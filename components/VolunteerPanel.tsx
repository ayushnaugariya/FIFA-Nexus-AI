interface AllocationPlan {
  zoneId: string;
  zoneName: string;
  volunteerIds: string[];
}

interface Volunteer {
  id: string;
  name: string;
  status: 'available' | 'assigned';
  assignedZoneId: string | null;
}

export function VolunteerPanel({ pool, plan }: { pool: Volunteer[]; plan: AllocationPlan[] }) {
  const availableCount = pool.filter((v) => v.status === 'available').length;

  return (
    <div>
      <p className="mb-3 text-sm text-mist">
        {pool.length} volunteers in the pool · {availableCount} currently unassigned
      </p>
      {plan.length === 0 ? (
        <p className="text-sm text-mist">No redeployment needed right now — all zones are within normal range.</p>
      ) : (
        <ul className="space-y-2">
          {plan.map((entry) => (
            <li key={entry.zoneId} className="rounded-card border border-white/10 p-3 text-sm">
              <span className="font-semibold text-floodlight">{entry.zoneName}:</span>{' '}
              {entry.volunteerIds.length} volunteer(s) assigned
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
