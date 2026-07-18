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
  const assignedCount = pool.length - availableCount;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: pool.length, label: 'Total', color: 'text-chalk' },
          { value: assignedCount, label: 'Deployed', color: 'text-floodlight' },
          { value: availableCount, label: 'Available', color: 'text-turf' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5">
            <p className={`font-display text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-mist">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Allocation plan */}
      {plan.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-turf/20 bg-turf/8 p-3 text-sm text-turf">
          <span>✅</span>
          <span>All zones normal — no redeployment needed</span>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">Active Deployments</p>
          <ul className="space-y-2">
            {plan.map((entry) => (
              <li key={entry.zoneId} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <span className="text-sm font-medium text-chalk">{entry.zoneName}</span>
                <span className="rounded-lg bg-floodlight/15 border border-floodlight/25 px-2 py-0.5 text-xs font-bold text-floodlight">
                  {entry.volunteerIds.length} assigned
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
