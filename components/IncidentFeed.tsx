'use client';

import { useState } from 'react';
import type { Incident } from '@/lib/incidentStore';
import { Badge } from './Badge';

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
    return <p className="text-sm text-mist">No open incidents. New reports appear here in real time.</p>;
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-2 text-sm text-clay">
          {error}
        </p>
      )}
      <ul className="space-y-3" aria-label="Open incident reports, most recent first">
        {incidents.map((incident) => (
          <li key={incident.id} className="rounded-card border border-white/10 p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge level={incident.severity}>{incident.severity}</Badge>
              <span className="text-xs text-mist">{incident.zone}</span>
              <span className="text-xs text-mist">
                reported by {incident.reporterRole} · {new Date(incident.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-chalk">{incident.description}</p>
            <p className="mt-1 text-sm text-floodlight">→ {incident.recommendedResponse}</p>
            <button
              type="button"
              onClick={() => handleResolve(incident.id)}
              disabled={resolvingId === incident.id}
              className="mt-2 rounded-card border border-turf px-2 py-1 text-xs font-semibold text-turf disabled:opacity-50"
            >
              {resolvingId === incident.id ? 'Resolving…' : 'Mark resolved'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
