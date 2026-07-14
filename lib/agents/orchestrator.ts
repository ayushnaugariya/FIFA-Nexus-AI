import type { Stadium } from '../stadiumData';
import { askGemini } from '../gemini';
import { getCrowdAgentState, type CrowdAgentState } from './crowdAgent';
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
 * Pure with respect to its inputs (seed controls the deterministic crowd/
 * utility simulation), so it's directly unit-testable without touching
 * Gemini or the network.
 */
export function gatherStadiumContext(stadium: Stadium, seed?: number): StadiumContext {
  const crowd = getCrowdAgentState(stadium, seed);
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
 * The Operations Copilot's headline feature: answer a free-text operator
 * question (or, absent one, produce a general shift report) grounded
 * strictly in the gathered context above — what's happening, why, what's
 * next, and what to do about it.
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

  return askGemini({ systemInstruction, userContent, maxOutputTokens: 350 });
}
