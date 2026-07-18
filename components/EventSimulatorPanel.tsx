'use client';

import { useState } from 'react';

const EVENTS = [
  { value: 'goal_scored', label: 'Goal Scored', icon: '⚽', desc: 'Surge in concessions & exits' },
  { value: 'halftime', label: 'Halftime', icon: '🔔', desc: 'Major crowd movement wave' },
  { value: 'final_whistle', label: 'Final Whistle', icon: '🏁', desc: 'Mass exit simulation' },
] as const;

interface ZoneImpact {
  zoneId: string;
  zoneName: string;
  currentOccupancyPercent: number;
  projectedOccupancyPercent: number;
  reason: string;
}

interface EventResult {
  impact: {
    eventType: string;
    zoneImpacts: ZoneImpact[];
    recommendedVolunteers: number;
    recommendedActions: string[];
    expectedWaitTimeReductionPercent: number;
    expectedCongestionReductionPercent: number;
  };
  announcement: string;
}

export function EventSimulatorPanel({ stadiumId }: { stadiumId: string }) {
  const [result, setResult] = useState<EventResult | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function trigger(eventType: (typeof EVENTS)[number]['value']) {
    setIsLoading(eventType);
    setError(null);
    try {
      const res = await fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stadiumId, eventType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not simulate the event.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not simulate the event.');
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Event buttons */}
      <div className="grid grid-cols-3 gap-3">
        {EVENTS.map((event) => (
          <button
            key={event.value}
            type="button"
            onClick={() => trigger(event.value)}
            disabled={isLoading !== null}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-semibold transition-all disabled:opacity-50 ${
              isLoading === event.value
                ? 'border-floodlight bg-floodlight/20 text-floodlight'
                : 'border-white/15 bg-white/[0.04] text-mist hover:border-floodlight/40 hover:bg-floodlight/10 hover:text-floodlight'
            }`}
          >
            <span className="text-2xl">{event.icon}</span>
            <span className="text-chalk">{event.label}</span>
            <span className="text-[10px] text-mist font-normal">{event.desc}</span>
            {isLoading === event.value && (
              <span className="mt-1 flex gap-1">
                <span className="h-1 w-1 rounded-full bg-floodlight animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1 w-1 rounded-full bg-floodlight animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1 w-1 rounded-full bg-floodlight animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-clay/30 bg-clay/10 p-3 text-sm text-clay">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="animate-fade-in space-y-4" aria-live="polite">
          {/* Announcement */}
          <div className="rounded-xl border border-turf/30 bg-turf/10 p-4 text-sm text-chalk leading-relaxed">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-turf">📣 Broadcast</p>
            {result.announcement}
          </div>

          {/* Zone impact table */}
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Projected zone impact from the simulated event</caption>
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-mist">Zone</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-mist">Now</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-mist">Projected</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-mist">Change</th>
                </tr>
              </thead>
              <tbody>
                {result.impact.zoneImpacts.map((z) => {
                  const delta = z.projectedOccupancyPercent - z.currentOccupancyPercent;
                  const isCritical = z.projectedOccupancyPercent >= 95;
                  const isHigh = z.projectedOccupancyPercent >= 80;
                  return (
                    <tr key={z.zoneId} className="table-row-hover border-b border-white/[0.04]">
                      <th scope="row" className="px-4 py-3 font-medium text-chalk text-left">{z.zoneName}</th>
                      <td className="px-4 py-3 text-mist">{z.currentOccupancyPercent}%</td>
                      <td className={`px-4 py-3 font-bold ${isCritical ? 'text-clay' : isHigh ? 'text-floodlight' : 'text-chalk'}`}>
                        {z.projectedOccupancyPercent}%
                      </td>
                      <td className={`px-4 py-3 text-xs font-medium ${delta > 0 ? 'text-clay' : 'text-turf'}`}>
                        {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-floodlight/20 bg-floodlight/8 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-floodlight">
              🤖 Recommended Actions ({result.impact.recommendedVolunteers} volunteers)
            </p>
            <ul className="space-y-1.5">
              {result.impact.recommendedActions.map((action) => (
                <li key={action} className="flex items-start gap-2 text-sm text-chalk">
                  <span className="mt-0.5 text-floodlight">→</span> {action}
                </li>
              ))}
            </ul>
          </div>

          {result.impact.expectedWaitTimeReductionPercent > 0 && (
            <div className="flex gap-4 rounded-xl border border-turf/20 bg-turf/8 p-4 text-sm">
              <div className="text-center">
                <p className="font-display text-xl font-bold text-turf">{result.impact.expectedWaitTimeReductionPercent}%</p>
                <p className="text-xs text-mist">less wait time</p>
              </div>
              <div className="h-full w-px bg-white/10" />
              <div className="text-center">
                <p className="font-display text-xl font-bold text-turf">{result.impact.expectedCongestionReductionPercent}%</p>
                <p className="text-xs text-mist">less congestion</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
