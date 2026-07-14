'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_STADIUM } from '@/lib/stadiumData';
import { StadiumSelect } from '@/components/StadiumSelect';
import { Card } from '@/components/Card';
import { CrowdHeatmap } from '@/components/CrowdHeatmap';
import { CopilotPanel } from '@/components/CopilotPanel';
import { EventSimulatorPanel } from '@/components/EventSimulatorPanel';
import { VolunteerPanel } from '@/components/VolunteerPanel';
import { IncidentForm } from '@/components/IncidentForm';
import { IncidentFeed } from '@/components/IncidentFeed';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { ZoneSnapshot } from '@/lib/crowdSim';
import type { ZoneForecast } from '@/lib/agents/crowdAgent';
import type { Incident } from '@/lib/incidentStore';

interface ContextState {
  incidents: Incident[];
  volunteers: { pool: { id: string; name: string; status: 'available' | 'assigned'; assignedZoneId: string | null }[]; plan: { zoneId: string; zoneName: string; volunteerIds: string[] }[] };
  utilities: { reading: { powerKw: number; waterLitersPerMin: number; wastePercentFull: number }; status: string };
}

export default function CommandCenterPage() {
  const [stadiumId, setStadiumId] = useState(DEFAULT_STADIUM.id);
  const [zones, setZones] = useState<ZoneSnapshot[]>([]);
  const [forecasts, setForecasts] = useState<ZoneForecast[]>([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const [context, setContext] = useState<ContextState | null>(null);

  // Live crowd stream via Server-Sent Events — the platform's real-time
  // telemetry layer (see the /api/crowd/stream route for the streaming design).
  useEffect(() => {
    setStreamConnected(false);
    const source = new EventSource(`/api/crowd/stream?stadiumId=${stadiumId}`);
    source.onopen = () => setStreamConnected(true);
    source.onmessage = (event) => {
      const state = JSON.parse(event.data);
      setZones(state.snapshot.zones);
      setForecasts(state.forecasts);
    };
    source.onerror = () => setStreamConnected(false);
    return () => source.close();
  }, [stadiumId]);

  // Cross-agent context (incidents, volunteers, utilities) for the side panels.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stadiumId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.context) {
          setContext({
            incidents: data.context.incidents,
            volunteers: data.context.volunteers,
            utilities: data.context.utilities,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [stadiumId]);

  const atRiskForecasts = forecasts.filter((f) => f.willBecomeCriticalAt);

  return (
    <div>
      <h1 className="font-display text-3xl">Command Center</h1>
      <p className="mt-1 max-w-2xl text-sm text-mist">
        The Operations Copilot&apos;s home — live crowd telemetry, predictive risk alerts, cross-agent Q&amp;A,
        match-event simulation, and volunteer/incident coordination in one place.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <StadiumSelect value={stadiumId} onChange={setStadiumId} />
          <p className="mt-3 flex items-center gap-2 text-xs text-mist">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${streamConnected ? 'bg-turf' : 'bg-clay'}`}
            />
            {streamConnected ? 'Live stream connected' : 'Connecting…'}
          </p>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-display text-xl">Ask the Operations Copilot</h2>
            <CopilotPanel stadiumId={stadiumId} />
          </Card>

          <Card>
            <h2 className="mb-3 font-display text-xl">Crowd intelligence — live</h2>
            {zones.length === 0 ? (
              <LoadingSpinner label="Connecting to live stream…" />
            ) : (
              <>
                <CrowdHeatmap zones={zones} />
                {atRiskForecasts.length > 0 && (
                  <div className="mt-4 rounded-card border border-clay/40 bg-clay/10 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-clay">Predictive alert</p>
                    <ul className="space-y-1 text-sm text-chalk">
                      {atRiskForecasts.map((f) => (
                        <li key={f.zoneId}>
                          {f.zoneName} projected to reach critical occupancy in ~{f.willBecomeCriticalAt?.minutesFromNow} min
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-display text-xl">Match-event simulator</h2>
            <EventSimulatorPanel stadiumId={stadiumId} />
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-display text-xl">Volunteer Copilot</h2>
              {context ? (
                <VolunteerPanel pool={context.volunteers.pool} plan={context.volunteers.plan} />
              ) : (
                <LoadingSpinner label="Loading…" />
              )}
            </Card>
            <Card>
              <h2 className="mb-3 font-display text-xl">Utilities</h2>
              {context ? (
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-mist">Power</dt><dd className="text-chalk">{context.utilities.reading.powerKw} kW</dd></div>
                  <div className="flex justify-between"><dt className="text-mist">Water</dt><dd className="text-chalk">{context.utilities.reading.waterLitersPerMin} L/min</dd></div>
                  <div className="flex justify-between"><dt className="text-mist">Waste capacity</dt><dd className="text-chalk">{context.utilities.reading.wastePercentFull}%</dd></div>
                  <div className="flex justify-between"><dt className="text-mist">Status</dt><dd className="text-chalk capitalize">{context.utilities.status}</dd></div>
                </dl>
              ) : (
                <LoadingSpinner label="Loading…" />
              )}
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-display text-xl">Report an incident</h2>
              <IncidentForm
                stadiumId={stadiumId}
                onCreated={(incident) =>
                  setContext((prev) => (prev ? { ...prev, incidents: [incident, ...prev.incidents] } : prev))
                }
              />
            </Card>
            <Card>
              <h2 className="mb-3 font-display text-xl">Incident feed</h2>
              <IncidentFeed incidents={context?.incidents ?? []} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
