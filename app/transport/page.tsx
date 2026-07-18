'use client';

import { useState } from 'react';
import { DEFAULT_STADIUM } from '@/lib/stadiumData';
import { StadiumSelect } from '@/components/StadiumSelect';
import { TransportPlanner } from '@/components/TransportPlanner';
import { Card } from '@/components/Card';

const TIPS = [
  { icon: '🚇', title: 'Take the train', desc: 'Light rail and subway options are fastest for most venues.' },
  { icon: '🅿️', title: 'Park & Ride', desc: 'Use satellite lots to avoid game-day traffic congestion.' },
  { icon: '🚲', title: 'Bike friendly', desc: 'Several venues have secure bike storage near main entrances.' },
  { icon: '♿', title: 'Accessible options', desc: 'Step-free routes and accessible parking available at all venues.' },
];

export default function TransportPage() {
  const [stadiumId, setStadiumId] = useState(DEFAULT_STADIUM.id);

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-floodlight/20 bg-floodlight/10 text-xl">
          🚇
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-chalk">Transport Intelligence</h1>
          <p className="text-sm text-mist">
            Personalized match-day travel planning · Step-free options · Departure surge alerts
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">Venue</p>
            <StadiumSelect value={stadiumId} onChange={setStadiumId} />
          </Card>

          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">Travel Tips</p>
            <div className="space-y-3">
              {TIPS.map((tip) => (
                <div key={tip.title} className="flex gap-3">
                  <span className="mt-0.5 text-lg">{tip.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-chalk">{tip.title}</p>
                    <p className="text-xs text-mist">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Planner */}
        <Card glow="gold">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-floodlight/15 border border-floodlight/20 text-lg">
              🗺️
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-chalk">Plan Your Journey</h2>
              <p className="text-xs text-mist">AI-powered route recommendation for your match day</p>
            </div>
          </div>
          <TransportPlanner stadiumId={stadiumId} />
        </Card>
      </div>
    </div>
  );
}
