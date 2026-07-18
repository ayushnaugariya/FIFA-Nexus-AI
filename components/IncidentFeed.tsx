'use client';

import { useState } from 'react';
import type { Incident } from '@/lib/incidentStore';

const SEVERITY_CONFIG: Record<string, { color: string; icon: string; border: string }> = {
  low: { color: 'text-turf bg-turf/10 border-turf/30', icon: '🟢', border: 'border-l-turf' },
  medium: { color: 'text-floodlight bg-floodlight/10 border-floodlight/30', icon: '🟡', border: 'border-l-floodlight' },
  high: { color: 'text-clay bg-clay/10 border-clay/30', icon: '🟠', border: 'border-l-clay' },
  critical: { color: 'text-clay bg-clay/20 border-clay/50', icon: '🔴', border: 'border-l-clay' },
};

export function IncidentFeed({
  incidents,
  onResolved,
}: {
  incidents: Incident[];
  onResolved: (incidentId: string) => void;
}) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve(id: string) {
    setResolvingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${id}`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not resolve the incident.');
      onResolved(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve the incident.');
    } finally {
      setResolvingId(null);
    }
  }

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="mb-2 text-3xl">✅</span>
        <p className="text-sm font-medium text-chalk">All clear</p>
        <p className="text-xs text-mist">No open incidents. New reports appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="rounded-xl border border-clay/30 bg-clay/10 p-3 text-sm text-clay">
          ⚠️ {error}
        </div>
      )}
      <ul className="space-y-3" aria-label="Open incident reports, most recent first">
        {incidents.map((incident) => {
          const cfg = SEVERITY_CONFIG[incident.severity] ?? SEVERITY_CONFIG.medium;
          return (
            <li
              key={incident.id}
              className={`animate-fade-in rounded-xl border border-l-4 border-white/[0.06] bg-white/[0.02] p-4 ${cfg.border}`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold ${cfg.color}`}>
                  {cfg.icon} {incident.severity.toUpperCase()}
                </span>
                <span className="rounded-lg bg-white/[0.04] px-2 py-0.5 text-xs text-mist">
                  📍 {incident.zone}
                </span>
                <span className="ml-auto text-xs text-mist">
                  {new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-sm text-chalk leading-relaxed">{incident.description}</p>

              <div className="mt-2 rounded-lg border border-floodlight/20 bg-floodlight/8 px-3 py-2">
                <p className="text-xs font-semibold text-floodlight">🤖 AI Recommended Response</p>
                <p className="text-xs text-chalk mt-0.5">{incident.recommendedResponse}</p>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-mist">
                  Reported by <span className="text-chalk">{incident.reporterRole}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleResolve(incident.id)}
                  disabled={resolvingId === incident.id}
                  className="rounded-lg border border-turf/40 bg-turf/10 px-3 py-1.5 text-xs font-semibold text-turf hover:bg-turf/20 disabled:opacity-50 transition-all"
                >
                  {resolvingId === incident.id ? '⏳ Resolving…' : '✅ Mark Resolved'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
