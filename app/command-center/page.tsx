'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_STADIUM, getStadiumById } from '@/lib/stadiumData';
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

const CONTEXT_REFRESH_MS = 20_000;

export default function CommandCenterPage() {
  const [stadiumId, setStadiumId] = useState(DEFAULT_STADIUM.id);
  const [zones, setZones] = useState<ZoneSnapshot[]>([]);
  const [forecasts, setForecasts] = useState<ZoneForecast[]>([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const [context, setContext] = useState<ContextState | null>(null);

  useEffect(() => {
    setStreamConnected(false);
    setZones([]);
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

  const loadContext = useCallback(
    (signal: AbortSignal) => {
      fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stadiumId }),
        signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.incidents !== undefined) {
            setContext({
              incidents: data.incidents,
              volunteers: data.volunteers,
              utilities: data.utilities,
            });
          }
        })
        .catch(() => undefined);
    },
    [stadiumId],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadContext(controller.signal);
    const interval = setInterval(() => loadContext(controller.signal), CONTEXT_REFRESH_MS);
    return () => { controller.abort(); clearInterval(interval); };
  }, [loadContext]);


  const atRiskForecasts = forecasts.filter((f) => f.willBecomeCriticalAt);
  const currentZones = getStadiumById(stadiumId)?.zones ?? [];
  const activeIncidents = context?.incidents.length ?? 0;

  return (
    <div>
      {/* ── Page header ── */}
      <div className="mb-8 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-floodlight/20 bg-floodlight/10 text-xl">
            🎛️
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-chalk">Command Center</h1>
            <p className="text-sm text-mist">
              Live crowd telemetry · AI copilot · Incident coordination · Volunteer management
            </p>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium ${
            streamConnected
              ? 'border-turf/30 bg-turf/10 text-turf'
              : 'border-white/10 bg-white/[0.04] text-mist'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${streamConnected ? 'bg-turf live-badge' : 'bg-mist pulse-dot'}`} />
            {streamConnected ? 'Live telemetry connected' : 'Connecting to stream…'}
          </div>

          {activeIncidents > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-clay/30 bg-clay/10 px-3 py-1.5 text-xs font-medium text-clay">
              🚨 {activeIncidents} active incident{activeIncidents > 1 ? 's' : ''}
            </div>
          )}

          {atRiskForecasts.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-floodlight/30 bg-floodlight/10 px-3 py-1.5 text-xs font-medium text-floodlight">
              ⚠️ {atRiskForecasts.length} zone{atRiskForecasts.length > 1 ? 's' : ''} approaching critical density
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* ── Left sidebar ── */}
        <div className="space-y-4">
          {/* Venue selector */}
          <Card className="p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">Venue</p>
            <StadiumSelect value={stadiumId} onChange={setStadiumId} />
          </Card>

          {/* Utilities */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-base">⚡</span>
              <h2 className="font-display text-base font-bold text-chalk">Live Utilities</h2>
            </div>
            {context ? (
              <div className="space-y-3">
                {[
                  { label: 'Power', value: `${context.utilities.reading.powerKw} kW`, icon: '⚡', pct: Math.min(100, (context.utilities.reading.powerKw / 2000) * 100), color: 'bg-floodlight' },
                  { label: 'Water', value: `${context.utilities.reading.waterLitersPerMin} L/min`, icon: '💧', pct: Math.min(100, (context.utilities.reading.waterLitersPerMin / 1000) * 100), color: 'bg-blue-400' },
                  { label: 'Waste', value: `${context.utilities.reading.wastePercentFull}%`, icon: '🗑️', pct: context.utilities.reading.wastePercentFull, color: context.utilities.reading.wastePercentFull > 80 ? 'bg-clay' : 'bg-turf' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-mist">
                        {item.icon} {item.label}
                      </span>
                      <span className="font-semibold text-chalk">{item.value}</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-bar-fill ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-1 text-right text-xs text-mist capitalize">
                  Status: <span className="text-chalk">{context.utilities.status}</span>
                </div>
              </div>
            ) : (
              <LoadingSpinner label="Loading utilities…" />
            )}
          </Card>

          {/* Volunteer Copilot */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-base">🙋</span>
              <h2 className="font-display text-base font-bold text-chalk">Volunteer Copilot</h2>
            </div>
            {context ? (
              <VolunteerPanel pool={context.volunteers.pool} plan={context.volunteers.plan} />
            ) : (
              <LoadingSpinner label="Loading volunteers…" />
            )}
          </Card>
        </div>

        {/* ── Main content ── */}
        <div className="space-y-6">
          {/* Operations Copilot */}
          <Card glow="gold">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-floodlight/15 border border-floodlight/20 text-lg">
                🧠
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-chalk">Operations Copilot</h2>
                <p className="text-xs text-mist">Synthesizes all agents · Live stadium health score</p>
              </div>
            </div>
            <CopilotPanel stadiumId={stadiumId} />
          </Card>

          {/* Live Crowd Intelligence */}
          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-lg">
                  👥
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-chalk">Crowd Intelligence</h2>
                  <p className="text-xs text-mist">Live zone occupancy · 15–60 min forecasts</p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs ${streamConnected ? 'text-turf' : 'text-mist'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${streamConnected ? 'bg-turf live-badge' : 'bg-mist'}`} />
                {streamConnected ? 'LIVE' : 'Connecting'}
              </div>
            </div>

            {zones.length === 0 ? (
              <div className="flex h-32 items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <LoadingSpinner label="Connecting to live stream…" />
              </div>
            ) : (
              <>
                <CrowdHeatmap zones={zones} />
                {atRiskForecasts.length > 0 && (
                  <div className="mt-4 rounded-xl border border-floodlight/30 bg-floodlight/8 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-floodlight">
                      ⚠️ Predictive Alerts
                    </p>
                    <ul className="space-y-1">
                      {atRiskForecasts.map((f) => (
                        <li key={f.zoneId} className="text-sm text-chalk">
                          <span className="font-medium">{f.zoneName}</span>{' '}
                          projected critical in ~<span className="text-floodlight font-semibold">{f.willBecomeCriticalAt?.minutesFromNow} min</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Match Event Simulator */}
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-lg">
                ⚽
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-chalk">Match-Event Simulator</h2>
                <p className="text-xs text-mist">See how agents react before events happen</p>
              </div>
            </div>
            <EventSimulatorPanel stadiumId={stadiumId} />
          </Card>

          {/* Incident Management */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card glow="red">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-base">🚨</span>
                <h2 className="font-display text-lg font-bold text-chalk">Report Incident</h2>
              </div>
              <IncidentForm
                stadiumId={stadiumId}
                zones={currentZones}
                onCreated={(incident) =>
                  setContext((prev) => (prev ? { ...prev, incidents: [incident, ...prev.incidents] } : prev))
                }
              />
            </Card>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <h2 className="font-display text-lg font-bold text-chalk">Incident Feed</h2>
                </div>
                {activeIncidents > 0 && (
                  <span className="rounded-full bg-clay/20 border border-clay/30 px-2 py-0.5 text-xs font-bold text-clay">
                    {activeIncidents} open
                  </span>
                )}
              </div>
              <IncidentFeed
                incidents={context?.incidents ?? []}
                onResolved={(incidentId) =>
                  setContext((prev) =>
                    prev ? { ...prev, incidents: prev.incidents.filter((i) => i.id !== incidentId) } : prev,
                  )
                }
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
