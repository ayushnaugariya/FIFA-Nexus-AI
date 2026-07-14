import type { ZoneSnapshot } from '@/lib/crowdSim';
import { Badge } from './Badge';

export function CrowdHeatmap({ zones }: { zones: ZoneSnapshot[] }) {
  return (
    <div>
      {/* Visual grid — decorative; the table below is the accessible source of truth */}
      <div aria-hidden="true" className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {zones.map((zone) => (
          <div
            key={zone.zoneId}
            className="rounded-card border border-white/10 p-3 text-center"
            style={{ backgroundColor: colorFor(zone.occupancyPercent) }}
          >
            <p className="font-display text-lg text-pitchnight">{zone.occupancyPercent}%</p>
            <p className="text-xs text-pitchnight/80">{zone.zoneName}</p>
          </div>
        ))}
      </div>

      <table className="w-full border-collapse text-sm">
        <caption className="mb-2 text-left text-mist">Zone occupancy — updates every refresh</caption>
        <thead>
          <tr className="border-b border-white/10 text-left text-mist">
            <th scope="col" className="py-2">Zone</th>
            <th scope="col" className="py-2">Occupancy</th>
            <th scope="col" className="py-2">Level</th>
            <th scope="col" className="py-2">Trend</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => (
            <tr key={zone.zoneId} className="border-b border-white/5">
              <th scope="row" className="py-2 font-normal text-chalk">{zone.zoneName}</th>
              <td className="py-2">{zone.occupancyPercent}%</td>
              <td className="py-2"><Badge level={zone.level}>{zone.level}</Badge></td>
              <td className="py-2 capitalize">{zone.trend}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function colorFor(occupancyPercent: number): string {
  if (occupancyPercent >= 95) return '#E14B4B';
  if (occupancyPercent >= 80) return '#f2a65a';
  if (occupancyPercent >= 50) return '#FFB627';
  return '#1B8A5A';
}
