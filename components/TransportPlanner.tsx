'use client';

import { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function TransportPlanner({ stadiumId }: { stadiumId: string }) {
  const [origin, setOrigin] = useState('');
  const [kickoffMinutes, setKickoffMinutes] = useState(90);
  const [mobilityNeeds, setMobilityNeeds] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stadiumId,
          originDescription: origin || 'downtown hotel area',
          kickoffMinutesFromNow: kickoffMinutes,
          mobilityNeeds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate a recommendation.');
      setRecommendation(data.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a recommendation.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="origin" className="mb-1 block text-sm font-medium text-mist">
          Where are you traveling from?
        </label>
        <input
          id="origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="e.g. Airbnb near downtown"
          maxLength={200}
          className="w-full rounded-card border border-white/20 bg-pitchnight px-3 py-2 text-chalk"
        />
      </div>

      <div>
        <label htmlFor="kickoff" className="mb-1 block text-sm font-medium text-mist">
          Minutes until kickoff: {kickoffMinutes}
        </label>
        <input
          id="kickoff"
          type="range"
          min={0}
          max={300}
          step={10}
          value={kickoffMinutes}
          onChange={(e) => setKickoffMinutes(Number(e.target.value))}
          className="w-full accent-floodlight"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="mobility"
          type="checkbox"
          checked={mobilityNeeds}
          onChange={(e) => setMobilityNeeds(e.target.checked)}
          className="h-4 w-4 accent-floodlight"
        />
        <label htmlFor="mobility" className="text-sm text-chalk">
          I need step-free / accessible transport options
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-card bg-floodlight px-4 py-2 text-sm font-semibold text-pitchnight disabled:opacity-50"
      >
        Get recommendation
      </button>

      {isLoading && <LoadingSpinner label="Planning your route…" />}
      {error && <p role="alert" className="text-sm text-clay">{error}</p>}
      {recommendation && (
        <p role="status" className="rounded-card border border-turf/40 bg-turf/10 p-4 text-sm text-chalk">
          {recommendation}
        </p>
      )}
    </form>
  );
}
