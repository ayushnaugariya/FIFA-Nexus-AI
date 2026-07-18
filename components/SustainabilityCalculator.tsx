'use client';

import { useState } from 'react';
import type { CarbonEstimate, TravelMode } from '@/lib/carbon';
import { LoadingSpinner } from './LoadingSpinner';

const TRAVEL_MODES: { value: TravelMode; label: string; icon: string; color: string }[] = [
  { value: 'walk', label: 'Walking', icon: '🚶', color: 'text-turf' },
  { value: 'bike', label: 'Bike', icon: '🚲', color: 'text-turf' },
  { value: 'public-transit', label: 'Public Transit', icon: '🚇', color: 'text-turf' },
  { value: 'rideshare-shared', label: 'Shared Rideshare', icon: '🚗', color: 'text-floodlight' },
  { value: 'rideshare-solo', label: 'Solo Rideshare', icon: '🚕', color: 'text-floodlight' },
  { value: 'personal-car', label: 'Personal Car', icon: '🚙', color: 'text-clay' },
  { value: 'flight', label: 'Flight', icon: '✈️', color: 'text-clay' },
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

  const selectedMode = TRAVEL_MODES.find((m) => m.value === travelMode);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode selector grid */}
      <div>
        <p className="mb-3 text-sm font-medium text-chalk">How are you traveling to the match?</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TRAVEL_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setTravelMode(mode.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                travelMode === mode.value
                  ? 'border-turf/50 bg-turf/15 text-chalk shadow-[0_0_15px_rgba(27,138,90,0.15)]'
                  : 'border-white/10 bg-white/[0.03] text-mist hover:bg-white/[0.06] hover:text-chalk'
              }`}
            >
              <span className="text-xl">{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distance */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="distance" className="text-sm font-medium text-chalk">
            📏 One-way distance
          </label>
          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-semibold text-chalk">
            {distanceKm} km
          </span>
        </div>
        <input
          id="distance"
          type="range"
          min={0}
          max={200}
          value={distanceKm}
          onChange={(e) => setDistanceKm(Number(e.target.value))}
          className="w-full accent-turf cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-xs text-mist">
          <span>Walking</span><span>Local</span><span>City</span><span>Regional</span><span>Far</span>
        </div>
      </div>

      {/* Party size */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-chalk">👥 People traveling together</p>
          <p className="text-xs text-mist">Shared trips reduce per-person emissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPartySize(Math.max(1, partySize - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] text-chalk hover:bg-white/[0.12] transition-colors"
          >−</button>
          <span className="w-6 text-center font-bold text-chalk">{partySize}</span>
          <button
            type="button"
            onClick={() => setPartySize(Math.min(20, partySize + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.05] text-chalk hover:bg-white/[0.12] transition-colors"
          >+</button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-glow w-full rounded-xl bg-turf py-3 text-sm font-semibold text-white disabled:opacity-50 transition-all"
      >
        {isLoading ? '⏳ Calculating…' : '🌿 Calculate My Carbon Footprint'}
      </button>

      {isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-turf/20 bg-turf/5 p-4">
          <LoadingSpinner label="" />
          <span className="text-sm text-mist">Calculating your environmental impact…</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-clay/30 bg-clay/10 p-4 text-sm text-clay" role="alert">
          ⚠️ {error}
        </div>
      )}
      {result && (
        <div role="status" className="animate-fade-in space-y-4">
          {/* Main result */}
          <div className="rounded-xl border border-turf/30 bg-gradient-to-br from-turf/15 to-transparent p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-turf mb-3">
              🌍 Your Carbon Footprint
            </p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-4xl font-extrabold text-chalk">{result.estimate.totalKgCO2e}</span>
              <span className="text-sm text-mist">kg CO₂e total</span>
            </div>
            <div className="progress-bar mb-3">
              <div
                className="progress-bar-fill bg-gradient-to-r from-turf to-turf/60"
                style={{ width: `${Math.min(100, (result.estimate.totalKgCO2e / 100) * 100)}%` }}
              />
            </div>
            <p className="text-sm text-turf font-semibold">
              ✅ Saved {result.estimate.savedVsCarKgCO2e} kg CO₂e vs driving alone
            </p>
          </div>
          {/* Tip */}
          <div className="rounded-xl border border-floodlight/20 bg-floodlight/8 p-4 text-sm text-chalk leading-relaxed">
            <p className="mb-1 text-xs font-semibold text-floodlight">💡 Sustainability Tip</p>
            {result.tip}
          </div>
        </div>
      )}
    </form>
  );
}
