export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: string;
  stadiumId: string;
  zone: string;
  reporterRole: string;
  description: string;
  severity: IncidentSeverity;
  recommendedResponse: string;
  createdAt: string;
}

const incidents: Incident[] = [];

export function addIncident(incident: Incident): void {
  incidents.unshift(incident);
  // Bound memory use in this reference/demo store.
  if (incidents.length > 200) incidents.length = 200;
}

export function listIncidents(stadiumId?: string): Incident[] {
  return stadiumId ? incidents.filter((i) => i.stadiumId === stadiumId) : [...incidents];
}

/** Exposed for tests so each test file starts from a clean slate. */
export function _clearIncidentsForTests(): void {
  incidents.length = 0;
}

const CRITICAL_KEYWORDS = ['unconscious', 'fire', 'weapon', 'stampede', 'collapse', 'not breathing', 'explosion'];
const HIGH_KEYWORDS = ['injury', 'injured', 'fight', 'crush', 'medical', 'chest pain', 'seizure'];
const MEDIUM_KEYWORDS = ['lost child', 'blocked', 'overcrowd', 'fainted', 'dispute'];

/**
 * Deterministic keyword-based classifier used as a safety-net fallback if
 * the Gemini call fails or times out, so a report is never silently
 * dropped and staff always get at least a conservative severity + a
 * generic response protocol.
 */
export function classifySeverityFallback(description: string): {
  severity: IncidentSeverity;
  recommendedResponse: string;
} {
  const text = description.toLowerCase();
  if (CRITICAL_KEYWORDS.some((k) => text.includes(k))) {
    return {
      severity: 'critical',
      recommendedResponse: 'Dispatch medical/security immediately and alert the venue control room.',
    };
  }
  if (HIGH_KEYWORDS.some((k) => text.includes(k))) {
    return {
      severity: 'high',
      recommendedResponse: 'Send the nearest medical or security team to the zone and log follow-up.',
    };
  }
  if (MEDIUM_KEYWORDS.some((k) => text.includes(k))) {
    return {
      severity: 'medium',
      recommendedResponse: 'Send a steward to assess and resolve; escalate if it does not resolve in 10 minutes.',
    };
  }
  return {
    severity: 'low',
    recommendedResponse: 'Log for awareness; no immediate escalation required.',
  };
}
