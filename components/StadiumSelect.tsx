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
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-mist">
        Venue
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-card border border-white/20 bg-pitchnight px-3 py-2 text-chalk"
      >
        {STADIUMS.map((stadium) => (
          <option key={stadium.id} value={stadium.id}>
            {stadium.name} — {stadium.city}
          </option>
        ))}
      </select>
    </div>
  );
}
