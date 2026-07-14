import type { Incident } from '@/lib/incidentStore';
import { Badge } from './Badge';

export function IncidentFeed({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return <p className="text-sm text-mist">No incidents reported yet. New reports appear here in real time.</p>;
  }

  return (
    <ul className="space-y-3" aria-label="Incident reports, most recent first">
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
        </li>
      ))}
    </ul>
  );
}
