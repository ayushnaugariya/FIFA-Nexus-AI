import type { CrowdLevel, ZoneSnapshot } from '@/lib/crowdSim';

const LEVEL_CONFIG: Record<CrowdLevel, { bg: string; text: string; badge: string; bar: string }> = {
  low: { bg: 'rgba(27,138,90,0.15)', text: '#1B8A5A', badge: 'bg-turf/15 text-turf border-turf/30', bar: 'bg-turf' },
  moderate: { bg: 'rgba(255,182,39,0.15)', text: '#FFB627', badge: 'bg-floodlight/15 text-floodlight border-floodlight/30', bar: 'bg-floodlight' },
  high: { bg: 'rgba(242,166,90,0.20)', text: '#f2a65a', badge: 'bg-orange-400/15 text-orange-400 border-orange-400/30', bar: 'bg-orange-400' },
  critical: { bg: 'rgba(225,75,75,0.20)', text: '#E14B4B', badge: 'bg-clay/15 text-clay border-clay/30', bar: 'bg-clay' },
};

const TREND_ICONS: Record<string, string> = {
  rising: '↑',
  falling: '↓',
  stable: '→',
};

export function CrowdHeatmap({ zones }: { zones: ZoneSnapshot[] }) {
  return (
    <div>
      {/* Visual heatmap cards */}
      <div aria-hidden="true" className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {zones.map((zone) => {
          const cfg = LEVEL_CONFIG[zone.level] ?? LEVEL_CONFIG.low;
          return (
            <div
              key={zone.zoneId}
              className="relative overflow-hidden rounded-xl border border-white/[0.06] p-3 text-center"
              style={{ background: cfg.bg }}
            >
              <p className="font-display text-2xl font-bold" style={{ color: cfg.text }}>
                {zone.occupancyPercent}%
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-white/60 truncate">{zone.zoneName}</p>
              <p className="mt-1 text-xs" style={{ color: cfg.text }}>
                {TREND_ICONS[zone.trend] ?? '→'}
              </p>
              {/* Progress bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                <div
                  className={`h-full transition-all duration-700 ${cfg.bar}`}
                  style={{ width: `${zone.occupancyPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Zone occupancy — updates every 5 seconds</caption>
          <thead>
            <tr className="border-b border-white/[0.06] text-left">
              <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-mist">Zone</th>
              <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-mist">Occupancy</th>
              <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-mist">Level</th>
              <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-mist">Trend</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => {
              const cfg = LEVEL_CONFIG[zone.level] ?? LEVEL_CONFIG.low;
              return (
                <tr key={zone.zoneId} className="table-row-hover border-b border-white/[0.04] transition-colors">
                  <th scope="row" className="px-4 py-3 font-medium text-chalk text-left">{zone.zoneName}</th>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cfg.bar}`}
                          style={{ width: `${zone.occupancyPercent}%` }}
                        />
                      </div>
                      <span className="text-chalk font-medium">{zone.occupancyPercent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold capitalize ${cfg.badge}`}>
                      {zone.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-mist capitalize" style={{ color: zone.trend === 'rising' ? '#E14B4B' : zone.trend === 'falling' ? '#1B8A5A' : undefined }}>
                      {TREND_ICONS[zone.trend] ?? '→'} {zone.trend}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
