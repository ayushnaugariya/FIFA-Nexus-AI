'use client';

import { useState } from 'react';
import { DEFAULT_STADIUM } from '@/lib/stadiumData';
import { StadiumSelect } from '@/components/StadiumSelect';
import { TransportPlanner } from '@/components/TransportPlanner';
import { Card } from '@/components/Card';

export default function TransportPage() {
  const [stadiumId, setStadiumId] = useState(DEFAULT_STADIUM.id);

  return (
    <div>
      <h1 className="font-display text-3xl">Transport Intelligence Agent</h1>
      <p className="mt-1 max-w-2xl text-sm text-mist">
        Get a match-day travel recommendation grounded in your venue&apos;s real transit and parking
        options — including step-free routes if you need them.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <StadiumSelect value={stadiumId} onChange={setStadiumId} />
        </Card>
        <Card>
          <TransportPlanner stadiumId={stadiumId} />
        </Card>
      </div>
    </div>
  );
}
