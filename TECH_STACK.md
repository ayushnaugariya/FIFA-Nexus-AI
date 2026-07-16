# Tech Stack Map — where everything is and why

A file-by-file guide so anyone (including an automated reviewer) can understand the
codebase without reading every line first.

## Framework & language

| Tech | Used for | Where |
|---|---|---|
| **Next.js 14 (App Router)** | Full app: pages + API routes in one project, server/client component split | `app/**` |
| **TypeScript (strict mode)** | Every file. `noUncheckedIndexedAccess` on for extra null-safety | `tsconfig.json` |
| **Tailwind CSS** | All styling, custom design tokens (no default-theme look) | `tailwind.config.ts`, `app/globals.css` |
| **React 18** | UI, client components use `'use client'` + hooks explicitly | `components/**` |

## GenAI

| Tech | Used for | Where |
|---|---|---|
| **Google Gemini API** (`@google/generative-ai`) | All text generation: concierge answers, incident triage, transport/sustainability tips, Operations Copilot synthesis, event announcements | `lib/gemini.ts` (wrapper), called from every `lib/agents/*.ts` |
| **Gemini multimodal (vision)** | Camera-frame hazard/crowd/accessibility analysis — the platform's "computer vision" | `lib/vision.ts`, `app/api/vision/route.ts`, `/vision` page |
| Prompt-injection fencing | User text delimited + boundary-forgery neutralized before reaching the model | `lib/gemini.ts` → `fenceUserContent()` |
| In-memory response cache | Avoids duplicate Gemini calls for identical prompts within a TTL window | `lib/responseCache.ts`, wired into `askGemini()` |

## Data & validation

| Tech | Used for | Where |
|---|---|---|
| **zod** | Every API input validated before touching business logic | `lib/validation.ts`, imported in every `app/api/*/route.ts` |
| Static reference data | 3 real World Cup 2026 venues (MetLife, Azteca, BC Place) with zones/gates/transit/amenities, grounds every AI prompt | `lib/stadiumData.ts` |
| In-memory stores | Incidents, volunteer pool, rate-limit windows, response cache (documented as a demo-scope limitation, see README §10) | `lib/incidentStore.ts`, `lib/volunteers.ts`, `lib/rateLimiter.ts`, `lib/responseCache.ts` |

## The seven agents (business logic layer)

| File | Role | Pure logic (unit-tested) | AI calls |
|---|---|---|---|
| `lib/agents/orchestrator.ts` | Operations Copilot — gathers all agent state, synthesizes report, computes health score | `gatherStadiumContext`, `computeStadiumHealthScore` | `synthesizeSituationReport` |
| `lib/agents/crowdAgent.ts` | Crowd Intelligence | `getCrowdAgentState` (advances live state — the one true SSE-tick caller), `peekCrowdAgentState` (read-only, used by the Copilot), `buildOccupancyHistory` (+ `lib/crowdLiveState.ts`, `lib/crowdSim.ts`, `lib/prediction.ts`) | none — fully deterministic |
| `lib/agents/safetyAgent.ts` | Safety & Emergency | incident query helpers (+ `lib/incidentStore.ts`) | incident triage, vision inspection |
| `lib/agents/volunteerAgent.ts` | Volunteer Copilot | `buildZoneNeeds`, allocation (+ `lib/volunteers.ts`) | none — fully deterministic |
| `lib/agents/transportAgent.ts` | Transport Intelligence | `classifyDepartureSurge` | travel recommendation |
| `lib/agents/sustainabilityAgent.ts` | Sustainability | `getVenueUtilityState` (+ `lib/carbon.ts`, `lib/utilities.ts`) | eco-tip generation |
| `lib/agents/fanAgent.ts` | Fan Experience (concierge) | — | multilingual answer |

`lib/eventSimulator.ts` is the pure predictive model behind the Match-Event Simulator
(goal/halftime/final-whistle), consumed by `app/api/event/route.ts`.

## API routes (`app/api/**/route.ts`)

| Route | Method | Calls |
|---|---|---|
| `/api/concierge` | POST | `fanAgent.answerFanQuestion` |
| `/api/copilot` | POST | `orchestrator.gatherStadiumContext` + `synthesizeSituationReport` |
| `/api/crowd/stream` | GET (SSE) | `crowdAgent.getCrowdAgentState`, pushed every 5s via `ReadableStream` |
| `/api/incidents` | GET/POST | `safetyAgent.fileIncidentReport` / `getActiveIncidents` (POST gated by optional `OPERATOR_API_KEY`, see `lib/auth.ts`) |
| `/api/vision` | POST | `safetyAgent.inspectCameraFrame` → `lib/vision.ts` |
| `/api/event` | POST | `lib/eventSimulator.ts` + Gemini announcement |
| `/api/transport` | POST | `transportAgent.recommendTransport` |
| `/api/sustainability` | POST | `sustainabilityAgent.estimateFanFootprint` |

Every route: zod validation → per-IP rate limit (`lib/rateLimiter.ts`) → agent call →
typed JSON response, generic error message on failure (never leaks internals).

## Pages (`app/**/page.tsx`)

| Page | Purpose |
|---|---|
| `/` | Landing — links to all 7 agents with problem-area tags |
| `/command-center` | Operations Copilot Q&A, live SSE crowd heatmap + predictive alerts, match-event simulator, volunteer panel, utilities panel, incident form/feed |
| `/concierge` | Multilingual chat (Fan Experience Agent) |
| `/vision` | Camera-frame upload → Gemini vision hazard/crowd/accessibility analysis |
| `/transport` | Transport Intelligence Agent |
| `/sustainability` | Carbon footprint calculator |
| `/accessibility` | Text size / contrast controls, per-venue accessible routes, WCAG conformance statement |

## Frontend components (`components/**`)

| Component | Notable pattern |
|---|---|
| `AccessibilityProvider.tsx` / `LanguageProvider.tsx` | React context, persisted via `localStorage`, applied as `<html>` attributes for CSS + `lang` |
| `Header.tsx` | Skip-link, labeled nav landmark, language switcher, contrast/font-size toggles |
| `CrowdHeatmap.tsx` | Dual representation: decorative color grid (`aria-hidden`) + a real accessible `<table>` — never color-only |
| `ChatWindow.tsx` | `aria-live="polite"` log region for the concierge |
| `CopilotPanel.tsx`, `EventSimulatorPanel.tsx`, `VolunteerPanel.tsx`, `VisionUploader.tsx` | Client components calling the corresponding API route, with loading/error states using `role="status"`/`role="alert"` |

## Testing (`__tests__/**`, `vitest.config.ts`, `vitest.setup.ts`)

| Tool | Used for |
|---|---|
| **Vitest** | Test runner, `node` environment by default |
| **`@vitejs/plugin-react`** | JSX transform for `.a11y.test.tsx` files |
| **jsdom** (per-file `// @vitest-environment jsdom`) | DOM environment for component tests |
| **`@testing-library/react`** | Rendering components in isolation |
| **`jest-axe`** | Automated WCAG violation scanning (`toHaveNoViolations`) |

212 tests / 33 files, including route-level integration tests with Gemini mocked at
the module boundary. See README §8 for the full breakdown.

## Security & ops

| Tech | Used for | Where |
|---|---|---|
| **CSP + security headers** | XSS/clickjacking mitigation; CSP applied per-request via middleware | `middleware.ts`, `lib/csp.ts`, `next.config.js` |
| **Request body-size guard** | Rejects oversized payloads before they're buffered into memory or reach zod | `lib/requestGuard.ts` |
| **Optional operator authorization** | Bearer-token gate on staff-only mutation (incident filing), opt-in via `OPERATOR_API_KEY` | `lib/auth.ts` |
| **`npm overrides`** | Force patched nested `postcss`/`glob` versions without a breaking Next.js upgrade | `package.json` |
| **GitHub Actions CI** | Lint + test + build on every push | `.github/workflows/ci.yml` |
| **Structured logger with redaction** | No secrets/PII in logs | `lib/logger.ts` |

---
See `README.md` for setup instructions, the full problem-statement alignment table, and the honest "what's real vs. roadmap" section on production-scale infrastructure (Kafka, Vertex AI Vision, BigQuery, etc.) from the original brief.
