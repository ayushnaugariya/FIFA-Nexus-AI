'use client';

import { STADIUMS } from '@/lib/stadiumData';

export function StadiumSelect({
  value,
  onChange,
  id = 'stadium-select',
}: {
  value: string;
  onChange: (stadiumId: string) => void;
  id?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-mist">
        🏟️ Select Venue
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-chalk focus:border-floodlight/30 focus:outline-none transition-colors"
      >
        {STADIUMS.map((stadium) => (
          <option key={stadium.id} value={stadium.id} className="bg-pitchnight2">
            {stadium.name} — {stadium.city}
          </option>
        ))}
      </select>
    </div>
  );
}
