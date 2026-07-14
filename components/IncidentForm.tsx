'use client';

import { useState } from 'react';
import type { Incident } from '@/lib/incidentStore';

const ROLES = ['volunteer', 'steward', 'medical', 'security', 'ops-manager'] as const;

export function IncidentForm({
  stadiumId,
  onCreated,
}: {
  stadiumId: string;
  onCreated: (incident: Incident) => void;
}) {
  const [zone, setZone] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('steward');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      setZone('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the report.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" aria-describedby={error ? 'incident-error' : undefined}>
      <div>
        <label htmlFor="incident-zone" className="mb-1 block text-sm font-medium text-mist">
          Zone
        </label>
        <input
          id="incident-zone"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          required
          maxLength={50}
          placeholder="e.g. North Concourse"
          className="w-full rounded-card border border-white/20 bg-pitchnight px-3 py-2 text-chalk"
        />
      </div>

      <div>
        <label htmlFor="incident-role" className="mb-1 block text-sm font-medium text-mist">
          Your role
        </label>
        <select
          id="incident-role"
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          className="w-full rounded-card border border-white/20 bg-pitchnight px-3 py-2 text-chalk"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="incident-description" className="mb-1 block text-sm font-medium text-mist">
          What&apos;s happening?
        </label>
        <textarea
          id="incident-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={3}
          maxLength={500}
          rows={3}
          className="w-full rounded-card border border-white/20 bg-pitchnight px-3 py-2 text-chalk"
        />
      </div>

      {error && (
        <p id="incident-error" role="alert" className="text-sm text-clay">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-card bg-clay px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  );
}
