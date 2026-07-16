export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'resolved';

export interface Incident {
  id: string;
  stadiumId: string;
  zone: string;
  reporterRole: string;
  description: string;
  severity: IncidentSeverity;
  recommendedResponse: string;
  createdAt: string;
  status: IncidentStatus;
  resolvedAt: string | null;
}

const incidents: Incident[] = [];

export function addIncident(incident: Incident): void {
  incidents.unshift(incident);
  // Bound memory use in this reference/demo store.
  if (incidents.length > 200) incidents.length = 200;
}

/**
 * By default returns only *open* incidents — this is the fix for a real
 * bug: previously every incident ever filed counted toward the health
 * score and volunteer need-scoring forever, with no way to clear one, so a
 * single resolved incident from minutes ago would keep permanently
 * degrading "real-time" decision support for the rest of the session. Pass
 * `includeResolved: true` for an audit/history view.
 */
export function listIncidents(stadiumId?: string, options: { includeResolved?: boolean } = {}): Incident[] {
  const { includeResolved = false } = options;
  return incidents.filter(
    (i) => (!stadiumId || i.stadiumId === stadiumId) && (includeResolved || i.status === 'open'),
  );
}

/** Marks an incident resolved. Returns the updated incident, or null if the id doesn't exist. */
export function resolveIncident(id: string): Incident | null {
  const incident = incidents.find((i) => i.id === id);
  if (!incident) return null;
  incident.status = 'resolved';
  incident.resolvedAt = new Date().toISOString();
  return incident;
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
