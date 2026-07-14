'use client';

import { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

const EVENTS = [
  { value: 'goal_scored', label: 'Goal scored' },
  { value: 'halftime', label: 'Halftime' },
  { value: 'final_whistle', label: 'Final whistle' },
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
    <div>
      <p className="mb-3 text-sm text-mist">
        Simulate a match event and see how the Crowd Intelligence and Volunteer agents predict and respond —
        before it happens.
      </p>
      <div className="flex flex-wrap gap-2">
        {EVENTS.map((event) => (
          <button
            key={event.value}
            type="button"
            onClick={() => trigger(event.value)}
            disabled={isLoading !== null}
            className="rounded-card border border-floodlight px-3 py-2 text-sm font-semibold text-floodlight disabled:opacity-50"
          >
            {isLoading === event.value ? <LoadingSpinner label="Simulating…" /> : `Simulate: ${event.label}`}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-clay">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-3" aria-live="polite">
          <p role="status" className="rounded-card border border-turf/40 bg-turf/10 p-3 text-sm text-chalk">
            📣 {result.announcement}
          </p>

          <table className="w-full border-collapse text-sm">
            <caption className="mb-1 text-left text-mist">Projected zone impact</caption>
            <thead>
              <tr className="border-b border-white/10 text-left text-mist">
                <th scope="col" className="py-1">Zone</th>
                <th scope="col" className="py-1">Now</th>
                <th scope="col" className="py-1">Projected</th>
              </tr>
            </thead>
            <tbody>
              {result.impact.zoneImpacts.map((z) => (
                <tr key={z.zoneId} className="border-b border-white/5">
                  <th scope="row" className="py-1 font-normal text-chalk">{z.zoneName}</th>
                  <td className="py-1">{z.currentOccupancyPercent}%</td>
                  <td className={`py-1 ${z.projectedOccupancyPercent >= 95 ? 'text-clay' : z.projectedOccupancyPercent >= 80 ? 'text-floodlight' : 'text-chalk'}`}>
                    {z.projectedOccupancyPercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="list-inside list-disc space-y-1 text-sm text-chalk">
            {result.impact.recommendedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>

          {result.impact.expectedWaitTimeReductionPercent > 0 && (
            <p className="text-sm text-turf">
              Expected impact if actions are taken: ~{result.impact.expectedWaitTimeReductionPercent}% less wait time,
              ~{result.impact.expectedCongestionReductionPercent}% less congestion.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
