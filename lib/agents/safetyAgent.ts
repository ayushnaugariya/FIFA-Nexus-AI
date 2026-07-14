import { randomUUID } from 'crypto';
import { askGemini } from '../gemini';
import {
  addIncident,
  classifySeverityFallback,
  listIncidents,
  type Incident,
  type IncidentSeverity,
} from '../incidentStore';
import { analyzeStadiumFrame, type VisionAnalysis } from '../vision';
import { logger } from '../logger';

export async function fileIncidentReport(input: {
  stadiumId: string;
  zone: string;
  reporterRole: string;
  description: string;
}): Promise<Incident> {
  const { severity, recommendedResponse } = await classifyIncidentSeverity(input.description);
  const incident: Incident = {
    id: randomUUID(),
    stadiumId: input.stadiumId,
    zone: input.zone,
    reporterRole: input.reporterRole,
    description: input.description,
    severity,
    recommendedResponse,
    createdAt: new Date().toISOString(),
  };
  addIncident(incident);
  return incident;
}

async function classifyIncidentSeverity(
  description: string,
): Promise<{ severity: IncidentSeverity; recommendedResponse: string }> {
  try {
    const raw = await askGemini({
      systemInstruction: [
        'You are the Safety & Emergency Agent triaging a stadium incident report.',
        'Respond with ONLY compact JSON of the exact shape:',
        '{"severity":"low|medium|high|critical","recommendedResponse":"one short sentence"}',
        'critical = immediate danger to life (fire, unconscious person, stampede, weapon).',
        'high = injury or safety risk needing fast response.',
        'medium = disruption needing a steward, not an emergency.',
        'low = informational, no urgent action needed.',
      ].join('\n'),
      userContent: description,
      maxOutputTokens: 100,
    });
    const parsed = JSON.parse(raw.replace(/^```json\s*|^```\s*|```$/g, '').trim());
    if (isValidSeverity(parsed.severity) && typeof parsed.recommendedResponse === 'string') {
      return { severity: parsed.severity, recommendedResponse: parsed.recommendedResponse };
    }
    throw new Error('Unexpected AI triage shape');
  } catch (error) {
    logger.warn('incident_triage_fallback', { error: String(error) });
    return classifySeverityFallback(description);
  }
}

function isValidSeverity(value: unknown): value is IncidentSeverity {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical';
}

export function getActiveIncidents(stadiumId: string): Incident[] {
  return listIncidents(stadiumId);
}

export function countOpenIncidentsByZoneName(stadiumId: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const incident of listIncidents(stadiumId)) {
    counts.set(incident.zone, (counts.get(incident.zone) ?? 0) + 1);
  }
  return counts;
}

export async function inspectCameraFrame(base64Data: string, mimeType: string): Promise<VisionAnalysis> {
  return analyzeStadiumFrame(base64Data, mimeType);
}
