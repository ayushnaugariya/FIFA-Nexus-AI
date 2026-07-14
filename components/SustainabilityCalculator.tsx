'use client';

import { useState } from 'react';
import type { CarbonEstimate, TravelMode } from '@/lib/carbon';
import { LoadingSpinner } from './LoadingSpinner';

const TRAVEL_MODES: { value: TravelMode; label: string }[] = [
  { value: 'walk', label: 'Walking' },
  { value: 'bike', label: 'Bike' },
  { value: 'public-transit', label: 'Public transit' },
  { value: 'rideshare-shared', label: 'Shared rideshare' },
  { value: 'rideshare-solo', label: 'Solo rideshare' },
  { value: 'personal-car', label: 'Personal car' },
  { value: 'flight', label: 'Flight' },
];

export function SustainabilityCalculator() {
  const [travelMode, setTravelMode] = useState<TravelMode>('public-transit');
  const [distanceKm, setDistanceKm] = useState(10);
  const [partySize, setPartySize] = useState(1);
  const [result, setResult] = useState<{ estimate: CarbonEstimate; tip: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sustainability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelMode, distanceKm, partySize }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not calculate your footprint.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not calculate your footprint.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="travel-mode" className="mb-1 block text-sm font-medium text-mist">
          How are you traveling to the match?
        </label>
        <select
          id="travel-mode"
          value={travelMode}
          onChange={(e) => setTravelMode(e.target.value as TravelMode)}
          className="w-full rounded-card border border-white/20 bg-pitchnight px-3 py-2 text-chalk"
        >
          {TRAVEL_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="distance" className="mb-1 block text-sm font-medium text-mist">
          One-way distance (km): {distanceKm}
        </label>
        <input
          id="distance"
          type="range"
          min={0}
          max={200}
          value={distanceKm}
          onChange={(e) => setDistanceKm(Number(e.target.value))}
          className="w-full accent-turf"
        />
      </div>

      <div>
        <label htmlFor="party-size" className="mb-1 block text-sm font-medium text-mist">
          People traveling together
        </label>
        <input
          id="party-size"
          type="number"
          min={1}
          max={20}
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
          className="w-24 rounded-card border border-white/20 bg-pitchnight px-3 py-2 text-chalk"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-card bg-turf px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Calculate footprint
      </button>

      {isLoading && <LoadingSpinner label="Calculating…" />}
      {error && <p role="alert" className="text-sm text-clay">{error}</p>}
      {result && (
        <div role="status" className="rounded-card border border-turf/40 bg-turf/10 p-4 text-sm text-chalk">
          <p className="font-display text-xl">{result.estimate.totalKgCO2e} kg CO₂e</p>
          <p>Saved vs. driving alone: {result.estimate.savedVsCarKgCO2e} kg CO₂e</p>
          <p className="mt-2">{result.tip}</p>
        </div>
      )}
    </form>
  );
}
