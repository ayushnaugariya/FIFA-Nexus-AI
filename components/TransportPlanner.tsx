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

  const urgency =
    kickoffMinutes <= 30 ? { label: 'Urgent', color: 'text-clay bg-clay/10 border-clay/30' }
    : kickoffMinutes <= 90 ? { label: 'Get Moving', color: 'text-floodlight bg-floodlight/10 border-floodlight/30' }
    : { label: 'Plenty of Time', color: 'text-turf bg-turf/10 border-turf/30' };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Origin */}
      <div>
        <label htmlFor="origin" className="mb-2 flex items-center gap-1.5 text-sm font-medium text-chalk">
          <span>📍</span> Where are you traveling from?
        </label>
        <input
          id="origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="e.g. Airbnb near downtown, Newark Airport…"
          maxLength={200}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-chalk placeholder:text-mist focus:border-floodlight/30 focus:outline-none transition-colors"
        />
      </div>

      {/* Kickoff slider */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="kickoff" className="flex items-center gap-1.5 text-sm font-medium text-chalk">
            <span>⏱️</span> Minutes until kickoff
          </label>
          <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${urgency.color}`}>
            {kickoffMinutes} min · {urgency.label}
          </span>
        </div>
        <input
          id="kickoff"
          type="range"
          min={0}
          max={300}
          step={10}
          value={kickoffMinutes}
          onChange={(e) => setKickoffMinutes(Number(e.target.value))}
          className="w-full accent-floodlight cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-xs text-mist">
          <span>Now</span>
          <span>1 hr</span>
          <span>2 hr</span>
          <span>3 hr</span>
          <span>5 hr</span>
        </div>
      </div>

      {/* Mobility toggle */}
      <button
        type="button"
        onClick={() => setMobilityNeeds(!mobilityNeeds)}
        className={`flex w-full items-center gap-3 rounded-xl border p-4 text-sm transition-all ${
          mobilityNeeds
            ? 'border-floodlight/40 bg-floodlight/10 text-chalk'
            : 'border-white/10 bg-white/[0.03] text-mist hover:bg-white/[0.06]'
        }`}
      >
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${mobilityNeeds ? 'bg-floodlight/20' : 'bg-white/5'}`}>
          ♿
        </div>
        <div className="text-left">
          <p className="font-medium text-chalk">Step-free / accessible transport</p>
          <p className="text-xs text-mist">Prioritize wheelchair-accessible options and lifts</p>
        </div>
        <div className={`ml-auto flex h-6 w-11 items-center rounded-full transition-colors ${mobilityNeeds ? 'bg-floodlight justify-end' : 'bg-white/10 justify-start'}`}>
          <div className="mx-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform" />
        </div>
      </button>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-glow w-full rounded-xl bg-floodlight py-3 text-sm font-semibold text-pitchnight disabled:opacity-50 transition-all"
      >
        {isLoading ? '⏳ Planning your route…' : '🗺️ Get My Route'}
      </button>

      {isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-floodlight/20 bg-floodlight/5 p-4">
          <LoadingSpinner label="" />
          <span className="text-sm text-mist">Planning the best route for you…</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-clay/30 bg-clay/10 p-4 text-sm text-clay" role="alert">
          ⚠️ {error}
        </div>
      )}
      {recommendation && (
        <div
          role="status"
          className="animate-fade-in rounded-xl border border-floodlight/20 bg-gradient-to-br from-floodlight/8 to-transparent p-5 text-sm text-chalk leading-relaxed"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-floodlight">
            🚇 Your Route Recommendation
          </p>
          {recommendation}
        </div>
      )}
    </form>
  );
}
