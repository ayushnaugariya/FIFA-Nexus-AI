import type { Stadium } from '../stadiumData';
import { askGemini } from '../gemini';
import { getCrowdAgentState, peekCrowdAgentState, type CrowdAgentState } from './crowdAgent';
import { getActiveIncidents, countOpenIncidentsByZoneName } from './safetyAgent';
import { runVolunteerAllocation, type VolunteerAgentState } from './volunteerAgent';
import { getVenueUtilityState, type VenueUtilityState } from './sustainabilityAgent';
import type { Incident } from '../incidentStore';

export interface StadiumContext {
  stadium: Stadium;
  generatedAt: string;
  crowd: CrowdAgentState;
  incidents: Incident[];
  volunteers: VolunteerAgentState;
  utilities: VenueUtilityState;
}

/**
 * Synchronously gathers a point-in-time snapshot from every specialist
 * agent. This is the "central intelligence layer" the brief describes:
 * instead of an operator checking five dashboards, one function call
 * collects everything the Operations Copilot needs to reason over.
 *
 * `seed` provided (tests) → deterministic crowd data via `getCrowdAgentState`.
 * `seed` omitted (production, every real `/api/copilot` call) →
 * `peekCrowdAgentState`, which *reads* the live crowd state without
 * advancing it. This matters: `getCrowdAgentState`'s live path calls
 * `advanceZoneOccupancy`, which is meant to be driven by exactly one
 * "clock" (the SSE stream's 5s tick). Using it here too was a real bug —
 * every Copilot question, and every periodic context poll from the
 * Command Center, independently advanced the same shared simulation state
 * on top of whatever the SSE tick was already doing, making the crowd
 * "move" faster the more the app was queried instead of at a steady rate
 * tied to real time. `gatherStadiumContext` is otherwise pure with respect
 * to its inputs, so it's directly unit-testable without touching Gemini or
 * the network.
 */
export function gatherStadiumContext(stadium: Stadium, seed?: number): StadiumContext {
  const crowd = seed !== undefined ? getCrowdAgentState(stadium, seed) : peekCrowdAgentState(stadium);
  const incidents = getActiveIncidents(stadium.id);
  const openIncidentCounts = countOpenIncidentsByZoneName(stadium.id);
  const volunteers = runVolunteerAllocation(crowd.snapshot, openIncidentCounts);
  const utilities = getVenueUtilityState(stadium.id, seed);

  return {
    stadium,
    generatedAt: new Date().toISOString(),
    crowd,
    incidents,
    volunteers,
    utilities,
  };
}

/**
 * Weighted 0-100 health score. Pure and deterministic — a single number an
 * operator can glance at, backed by the same context the narrative report
 * explains in words. Weights are a documented reference starting point.
 */
export function computeStadiumHealthScore(context: StadiumContext): number {
  const criticalZones = context.crowd.snapshot.zones.filter((z) => z.level === 'critical').length;
  const highZones = context.crowd.snapshot.zones.filter((z) => z.level === 'high').length;
  const crowdPenalty = criticalZones * 25 + highZones * 10;

  const criticalIncidents = context.incidents.filter((i) => i.severity === 'critical').length;
  const highIncidents = context.incidents.filter((i) => i.severity === 'high').length;
  const incidentPenalty = criticalIncidents * 30 + highIncidents * 12;

  const utilityPenalty = context.utilities.status === 'action-needed' ? 15 : context.utilities.status === 'elevated' ? 5 : 0;

  const score = 100 - crowdPenalty - incidentPenalty - utilityPenalty;
  return Math.max(0, Math.min(100, score));
}

function summarizeContextForPrompt(context: StadiumContext): string {
  const zoneLines = context.crowd.snapshot.zones
    .map((z) => `${z.zoneName}: ${z.occupancyPercent}% (${z.level}, trend ${z.trend})`)
    .join('; ');

  const forecastLines = context.crowd.forecasts
    .filter((f) => f.willBecomeCriticalAt)
    .map((f) => `${f.zoneName} projected to reach critical occupancy in ~${f.willBecomeCriticalAt?.minutesFromNow}min`)
    .join('; ') || 'No zones are projected to reach critical occupancy in the next hour.';

  const incidentLines = context.incidents.length
    ? context.incidents
        .slice(0, 5)
        .map((i) => `[${i.severity}] ${i.zone}: ${i.description}`)
        .join(' | ')
    : 'No active incidents.';

  const volunteerLines = context.volunteers.plan.length
    ? context.volunteers.plan.map((p) => `${p.volunteerIds.length} volunteer(s) → ${p.zoneName}`).join('; ')
    : 'No urgent redeployment needed.';

  return [
    `Venue: ${context.stadium.name}.`,
    `Zone occupancy: ${zoneLines}.`,
    `Predictive alerts: ${forecastLines}`,
    `Active incidents: ${incidentLines}`,
    `Volunteer allocation: ${volunteerLines}`,
    `Utilities: ${context.utilities.reading.powerKw}kW power, ${context.utilities.reading.waterLitersPerMin}L/min water, ${context.utilities.reading.wastePercentFull}% waste capacity — status ${context.utilities.status}.`,
    `Computed stadium health score: ${computeStadiumHealthScore(context)}/100.`,
  ].join('\n');
}

/**
 * Generates a rich, data-driven situational report from the live context
 * without calling any external AI API. Used as the automatic fallback when
 * Gemini is unavailable (quota, network, etc.) so the Copilot always shows
 * a meaningful, accurate briefing rather than an error message.
 */
function generateTemplateReport(
  context: StadiumContext,
  operatorQuestion?: string,
): string {
  const healthScore = computeStadiumHealthScore(context);
  const criticalZones = context.crowd.snapshot.zones.filter((z) => z.level === 'critical');
  const highZones = context.crowd.snapshot.zones.filter((z) => z.level === 'high');
  const normalZones = context.crowd.snapshot.zones.filter((z) => z.level === 'moderate' || z.level === 'low');
  const atRisk = context.crowd.forecasts.filter((f) => f.willBecomeCriticalAt);
  const criticalIncidents = context.incidents.filter((i) => i.severity === 'critical');
  const highIncidents = context.incidents.filter((i) => i.severity === 'high');
  const availableVols = context.volunteers.pool.filter((v) => v.status === 'available').length;
  const assignedVols = context.volunteers.pool.filter((v) => v.status === 'assigned').length;

  // ── Crowd status sentence ──────────────────────────────────────────────
  let crowdSentence: string;
  if (criticalZones.length > 0) {
    crowdSentence = `${criticalZones.map((z) => z.zoneName).join(' and ')} ${
      criticalZones.length > 1 ? 'are' : 'is'
    } at critical density (${criticalZones.map((z) => `${z.occupancyPercent}%`).join(', ')}) and require immediate intervention`;
  } else if (highZones.length > 0) {
    crowdSentence = `${highZones.map((z) => z.zoneName).join(' and ')} ${
      highZones.length > 1 ? 'are' : 'is'
    } running at elevated density (${highZones.map((z) => `${z.occupancyPercent}%`).join(', ')}) and warrant close monitoring`;
  } else {
    const pcts = normalZones.map((z) => `${z.zoneName} at ${z.occupancyPercent}%`).join(', ');
    crowdSentence = `All ${context.crowd.snapshot.zones.length} zones are within normal parameters — ${pcts}`;
  }

  // ── Forecast sentence ──────────────────────────────────────────────────
  const forecastSentence = atRisk.length > 0
    ? `Predictive models flag ${
        atRisk.map((f) => `${f.zoneName} in ~${f.willBecomeCriticalAt?.minutesFromNow} min`).join(' and ')
      } as approaching critical thresholds — proactive crowd redirection is recommended before saturation occurs.`
    : 'No zones are projected to reach critical density in the next 60 minutes based on current flow trends.';

  // ── Incident sentence ──────────────────────────────────────────────────
  let incidentSentence: string;
  if (context.incidents.length === 0) {
    incidentSentence = 'No active incidents are on record.';
  } else if (criticalIncidents.length > 0) {
    incidentSentence = `${context.incidents.length} active incident${
      context.incidents.length > 1 ? 's' : ''
    } including ${criticalIncidents.length} critical (${criticalIncidents.map((i) => i.zone).join(', ')}) — emergency protocol should remain on standby.`;
  } else {
    incidentSentence = `${context.incidents.length} active incident${
      context.incidents.length > 1 ? 's' : ''
    } (${highIncidents.length} high severity) are being managed across the venue.`;
  }

  // ── Utilities sentence ─────────────────────────────────────────────────
  const { powerKw, waterLitersPerMin, wastePercentFull } = context.utilities.reading;
  let utilitySentence: string;
  if (context.utilities.status === 'normal') {
    utilitySentence = `Venue utilities are stable: ${powerKw} kW power draw, ${waterLitersPerMin} L/min water consumption, waste bins at ${wastePercentFull}% capacity.`;
  } else if (context.utilities.status === 'elevated') {
    utilitySentence = `Utility readings are elevated — power at ${powerKw} kW and waste at ${wastePercentFull}% — facilities team should review within the hour.`;
  } else {
    utilitySentence = `Utilities require immediate action: power at ${powerKw} kW, waste capacity at ${wastePercentFull}% — escalate to the facilities team now.`;
  }

  // ── Volunteer sentence ─────────────────────────────────────────────────
  const volunteerSentence = context.volunteers.plan.length > 0
    ? `Volunteer copilot has deployed ${assignedVols} staff across ${
        context.volunteers.plan.map((p) => p.zoneName).join(' and ')
      }, with ${availableVols} personnel held in reserve.`
    : `${availableVols} volunteers are on standby — no urgent redeployment required at this time.`;

  // ── Top recommendation ─────────────────────────────────────────────────
  let recommendation: string;
  if (criticalZones.length > 0) {
    recommendation = `PRIORITY ACTION: Deploy additional personnel to ${criticalZones[0]?.zoneName ?? 'critical zone'} and activate crowd-flow diversion to adjacent gates immediately.`;
  } else if (atRisk.length > 0) {
    recommendation = `PRIORITY ACTION: Pre-position volunteers near ${atRisk[0]?.zoneName ?? 'at-risk zone'} to stay ahead of the projected density spike in ~${atRisk[0]?.willBecomeCriticalAt?.minutesFromNow ?? 0} minutes.`;
  } else if (criticalIncidents.length > 0) {
    recommendation = `PRIORITY ACTION: Ensure emergency response teams are staged near ${criticalIncidents[0]?.zone ?? 'incident zone'} until the critical incident is resolved.`;
  } else if (context.utilities.status === 'action-needed') {
    recommendation = `PRIORITY ACTION: Escalate the utility situation to the facilities manager for immediate on-site inspection.`;
  } else {
    recommendation = `Stadium Health Score is ${healthScore}/100 — maintain current posture and continue monitoring all zones at standard 5-minute intervals.`;
  }

  // ── Assemble final report ──────────────────────────────────────────────
  // If there was a specific operator question, prepend a note acknowledging it
  const prefix = operatorQuestion
    ? `Regarding "${operatorQuestion.slice(0, 80)}${operatorQuestion.length > 80 ? '…' : ''}": `
    : '';

  return [
    `${prefix}${crowdSentence}.`,
    forecastSentence,
    incidentSentence,
    utilitySentence,
    volunteerSentence,
    recommendation,
  ].join(' ');
}

/**
 * The Operations Copilot's headline feature: answer a free-text operator
 * question (or, absent one, produce a general shift report) grounded
 * strictly in the gathered context above — what's happening, why, what's
 * next, and what to do about it.
 *
 * Tries Gemini first for a natural-language response; silently falls back to
 * the deterministic template report if the model is unavailable so the
 * Copilot is always functional regardless of API quota or billing status.
 */
export async function synthesizeSituationReport(
  context: StadiumContext,
  operatorQuestion?: string,
): Promise<string> {
  const systemInstruction = [
    'You are the Operations Copilot of FIFA Nexus AI — the single synthesis point across',
    'the Crowd Intelligence, Safety, Volunteer, Transport and Sustainability agents.',
    'Using ONLY the context below, explain: what is happening, why, what is likely next,',
    'and the single most important recommended action. Keep it to one tight paragraph',
    '(5-7 sentences), calm and operational in tone. Never invent facts beyond the context.',
    '--- CURRENT STADIUM CONTEXT ---',
    summarizeContextForPrompt(context),
  ].join('\n');

  const userContent =
    operatorQuestion?.trim() ||
    'Give me the current shift briefing: overall situation, key risks in the next hour, and top recommended action.';

  try {
    return await askGemini({ systemInstruction, userContent, maxOutputTokens: 350 });
  } catch {
    // Gemini unavailable (quota, network, etc.) — fall back to the
    // deterministic template so the Copilot always returns a useful report.
    return generateTemplateReport(context, operatorQuestion);
  }
}
