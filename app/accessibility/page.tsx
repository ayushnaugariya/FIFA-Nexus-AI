'use client';

import { useState } from 'react';
import { STADIUMS, DEFAULT_STADIUM } from '@/lib/stadiumData';
import { StadiumSelect } from '@/components/StadiumSelect';
import { Card } from '@/components/Card';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function AccessibilityPage() {
  const [stadiumId, setStadiumId] = useState(DEFAULT_STADIUM.id);
  const stadium = STADIUMS.find((s) => s.id === stadiumId) ?? DEFAULT_STADIUM;
  const { fontScale, highContrast } = useAccessibility();

  return (
    <div>
      <h1 className="font-display text-3xl">Accessibility Center</h1>
      <p className="mt-1 max-w-2xl text-sm text-mist">
        Display settings apply across the whole app from the header. Below, find the accessible
        entrance and route for each zone at your venue.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <StadiumSelect value={stadiumId} onChange={setStadiumId} />
          <dl className="mt-4 space-y-1 text-sm text-mist">
            <div className="flex justify-between">
              <dt>Text size</dt>
              <dd className="text-chalk">{fontScale}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Contrast</dt>
              <dd className="text-chalk">{highContrast ? 'High' : 'Standard'}</dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-4">
          {stadium.zones.map((zone) => (
            <Card key={zone.id}>
              <h2 className="font-display text-xl">{zone.name}</h2>
              <p className="mt-1 text-sm text-chalk">
                <span className="font-semibold text-floodlight">Accessible route: </span>
                {zone.accessibleRoute}
              </p>
              <p className="mt-1 text-sm text-mist">Amenities: {zone.amenities.join(', ')}</p>
            </Card>
          ))}

          <Card>
            <h2 className="font-display text-xl">Conformance statement</h2>
            <p className="mt-2 text-sm text-mist">
              This interface targets WCAG 2.1 AA: full keyboard operability, visible focus
              indicators, semantic landmarks and headings, text alternatives for all visual
              indicators (crowd levels and severities are never color-only), adjustable text size
              up to 125%, a high-contrast mode, and respect for reduced-motion preferences.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
