'use client';

import { useEffect, useState } from 'react';
import type { Incident } from '@/lib/incidentStore';

const ROLES = ['volunteer', 'steward', 'medical', 'security', 'ops-manager'] as const;

const ROLE_ICONS: Record<string, string> = {
  volunteer: '🙋',
  steward: '🦺',
  medical: '🏥',
  security: '🛡️',
  'ops-manager': '📋',
};

export function IncidentForm({
  stadiumId,
  zones,
  onCreated,
}: {
  stadiumId: string;
  zones: { id: string; name: string }[];
  onCreated: (incident: Incident) => void;
}) {
  const [zone, setZone] = useState(zones[0]?.name ?? '');
  const [role, setRole] = useState<(typeof ROLES)[number]>('steward');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!zones.some((z) => z.name === zone)) {
      setZone(zones[0]?.name ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stadiumId, zone, reporterRole: role, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit the report.');
      onCreated(data.incident);
      setDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the report.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? 'incident-error' : undefined}>
      {/* Zone */}
      <div>
        <label htmlFor="incident-zone" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
          📍 Zone
        </label>
        <select
          id="incident-zone"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          required
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-chalk focus:border-floodlight/30 focus:outline-none transition-colors"
        >
          {zones.map((z) => (
            <option key={z.id} value={z.name} className="bg-pitchnight2">
              {z.name}
            </option>
          ))}
        </select>
      </div>

      {/* Role */}
      <div role="group" aria-labelledby="role-label">
        <p id="role-label" className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-mist">👤 Your Role</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => setRole(r)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                role === r
                  ? 'border-clay/40 bg-clay/15 text-clay'
                  : 'border-white/10 bg-white/[0.04] text-mist hover:text-chalk hover:bg-white/[0.08]'
              }`}
            >
              {ROLE_ICONS[r]} {r}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="incident-description" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-mist">
          📝 What&apos;s happening?
        </label>
        <textarea
          id="incident-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={3}
          maxLength={500}
          rows={3}
          placeholder="Describe the incident clearly — the AI will triage severity and recommend a response…"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-chalk placeholder:text-mist/60 focus:border-floodlight/30 focus:outline-none transition-colors resize-none"
        />
        <p className="mt-1 text-right text-xs text-mist">{description.length}/500</p>
      </div>

      {error && (
        <div id="incident-error" role="alert" className="rounded-xl border border-clay/30 bg-clay/10 p-3 text-sm text-clay">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div role="status" className="animate-fade-in rounded-xl border border-turf/30 bg-turf/10 p-3 text-sm text-turf">
          ✅ Incident reported and AI-triaged successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !zone || !description.trim()}
        className="btn-glow w-full rounded-xl bg-clay py-3 text-sm font-semibold text-white disabled:opacity-50 transition-all"
      >
        {isSubmitting ? '⏳ Submitting…' : '🚨 Submit Incident Report'}
      </button>
    </form>
  );
}
