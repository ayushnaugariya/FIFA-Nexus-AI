# FIFA Nexus AI — The Intelligent Stadium Operating System

**One AI brain. Thousands of decisions. Millions of better experiences.**

A multi-agent GenAI platform built for the **FIFA World Cup 2026 Smart Stadiums &
Tournament Operations** challenge. Specialized agents handle crowd intelligence,
safety, fan experience, volunteers, transport, and sustainability; an **Operations
Copilot** unifies them into a single explainable situational report — so an operator
can ask "what's happening right now?" instead of checking five dashboards.

> **New to this repo?** See [`TECH_STACK.md`](./TECH_STACK.md) for a file-by-file map
> of every technology and exactly where it's used.

---

## 1. Why a rewrite, and what's real vs. roadmap

An earlier draft of this project ("StadiumPulse AI") shipped single-purpose GenAI
features. This version restructures the same proven infrastructure (Gemini wrapper,
validation, rate limiting, security headers, venue data) around a genuine **multi-agent
architecture** with predictive intelligence, a vision-capable Safety Agent, live
streaming telemetry, and a central orchestrator — the core ideas from the brief.

Some items in the original vision (CCTV integration, Kafka/Pub-Sub, Vertex AI Vision,
BigQuery, vector databases, LangGraph/CrewAI) describe production infrastructure that
needs real camera feeds, cloud accounts, and ongoing infra spend — not something a
hackathon reference build can honestly claim to run. Rather than list unused
dependencies to look more impressive, this build makes deliberate, disclosed
substitutions and documents the production path for each:

| Brief's tech | This build | Why |
|---|---|---|
| YOLO / OpenCV / Vertex AI Vision (CCTV) | **Gemini multimodal vision** on uploaded frames (`lib/vision.ts`) | Same crowd/hazard-reading capability, genuinely GenAI-native (the challenge's own requirement), zero model-serving infra to deploy |
| Kafka / Pub-Sub | **Server-Sent Events** (`app/api/crowd/stream/route.ts`) | Real one-directional streaming with native browser reconnect, no message-broker dependency for a reference deployment |
| LangGraph / CrewAI | **Custom TypeScript agent modules** (`lib/agents/*`) | A framework doesn't buy much at this scale; a small, fully-typed, directly-testable orchestrator is easier to verify and extend |
| Firestore / BigQuery / Redis | **In-memory stores**, documented as a known limitation | Zero-infra reference build; swapping in a real store is a contained change (see §9) |

Everything listed as "implemented" below is real, wired end-to-end, and covered by the
test suite — not a mock UI in front of nothing.

---

## 2. The agents

| Agent | Responsibility | Where |
|---|---|---|
| **Operations Copilot** | Gathers every agent's current state and synthesizes one situational report; computes a live Stadium Health Score | `lib/agents/orchestrator.ts`, `/command-center` |
| **Crowd Intelligence Agent** | Live per-zone occupancy + a 15/30/60-minute forecast that flags zones about to cross critical density *before* they do | `lib/agents/crowdAgent.ts`, `lib/prediction.ts` |
| **Safety & Emergency Agent** | AI incident triage (severity + response) with a deterministic fallback; Gemini-vision camera-frame inspection for hazards | `lib/agents/safetyAgent.ts`, `lib/vision.ts`, `/vision` |
| **Volunteer Copilot** | Converts crowd + incident pressure into a per-zone need score and greedily re-optimizes volunteer deployment every cycle | `lib/agents/volunteerAgent.ts`, `lib/volunteers.ts` |
| **Transport Intelligence Agent** | Personalized transit/parking recommendation grounded in real venue data; departure-surge classification | `lib/agents/transportAgent.ts`, `/transport` |
| **Sustainability Agent** | Fan trip carbon-footprint calculator; live venue power/water/waste monitoring | `lib/agents/sustainabilityAgent.ts`, `lib/carbon.ts`, `lib/utilities.ts` |
| **Fan Experience Agent** | Multilingual concierge (10 languages) for navigation, seating, and accessibility questions | `lib/agents/fanAgent.ts`, `/concierge` |

A **Match-Event Simulator** (`lib/eventSimulator.ts`, on `/command-center`) lets a
judge trigger "Goal scored" / "Halftime" / "Final whistle" and watch the Crowd
Intelligence and Volunteer agents predict impact and recommend action *before* it
happens — this is the brief's own worked example, fully implemented and testable.

---

## 3. Architecture

```
Fan / Operator Browser
        │
        ├── EventSource (SSE) ──▶ /api/crowd/stream  (live crowd telemetry, 5s ticks)
        │
        ▼
Next.js 14 App Router (TypeScript) — Command Center, Concierge, Vision, Transport,
Sustainability, Accessibility
        │
        ▼
API Routes (Node runtime): zod validation → per-IP rate limiting → agent layer
        │
        ▼
lib/agents/*  (Crowd, Safety, Volunteer, Transport, Sustainability, Fan, Orchestrator)
        │             │
        │             └─ deterministic logic (lib/*.ts) — crowd sim, forecasting,
        │                carbon math, need scoring, event impact — unit-tested,
        │                zero network dependency
        ▼
lib/gemini.ts / lib/vision.ts ──▶ Google Gemini API (text + multimodal)
        │
        └── timeout + retry + prompt-injection fencing; every AI call has a
            deterministic fallback so the product degrades gracefully, never blankly
```

**Design principle, unchanged from the original build:** the model never owns a fact
it wasn't given. Every agent grounds its Gemini call in structured venue data or a
computed result (crowd math, carbon math, need scores) that the model narrates,
classifies, or synthesizes — never invents.

---

## 4. Getting started

```bash
git clone <your-repo-url>
cd fifa-nexus-ai
cp .env.example .env.local   # add your GEMINI_API_KEY (https://aistudio.google.com/apikey)
npm install
npm run dev                  # http://localhost:3000
```

| Command | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build (type-checked) |
| `npm start` | Run the production build |
| `npm run lint` | ESLint (Next.js recommended + core web vitals) |
| `npm test` | Vitest unit tests |

---

## 5. Security

- **Secrets never reach the client.** `GEMINI_API_KEY` is read only inside server-only
  modules (`lib/gemini.ts`, `lib/vision.ts`, `lib/env.ts`), invoked exclusively from
  API routes.
- **Every API input is validated** with `zod` (`lib/validation.ts`) — including the
  vision endpoint, which checks MIME type and a 5MB size cap before any image reaches
  Gemini.
- **Rate limiting** on every AI-backed route (`lib/rateLimiter.ts`); the vision route
  uses a tighter limit given the higher cost of multimodal calls.
- **Prompt-injection hardening**: user text is fenced with explicit markers and the
  system instruction tells the model to treat that block as data, never as new
  instructions (`lib/gemini.ts`).
- **Vision privacy guardrail**: the Safety Agent's system prompt explicitly instructs
  the model to describe conditions, not identify or profile people in frames.
- **Security headers** (`next.config.js`): CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, restrictive `Permissions-Policy`.
- **No secrets in the repo**: `.env.local` is git-ignored; `.env.example` ships with
  placeholders only.
- **Fail-safe error handling**: errors are logged via a redacting structured logger
  (`lib/logger.ts`); only generic, non-leaking messages reach the client.
- **Prompt-fence forgery resistance**: `fenceUserContent` also neutralizes any literal
  occurrence of its own boundary tokens inside user input (not just code fences), so a
  crafted message can't forge a fake closing/opening marker — covered by
  `__tests__/gemini.test.ts`.
- **Dependency audit — what's fixed vs. accepted**: `npm audit` is clean for the
  `postcss`/`glob` advisories (forced to patched versions via `package.json`
  `overrides`, a zero-risk fix for these nested-dependency false-positive-prone
  findings). Two categories remain and are disclosed rather than hidden:
  - `esbuild` (via `vitest`→`vite`, dev/test-only): the advisory requires a exposed
    `vite dev` server accepting arbitrary requests; this project never runs one — it's
    a test-transform tool only, never a network service.
  - A cluster of `next@14.2.x` advisories: none have a non-breaking 14.x patch yet; a
    fix requires jumping to Next 16, a major-version migration out of scope for this
    submission window. Several only apply to features this app doesn't use
    (`next/image`, custom `rewrites`/`middleware`, i18n routing); the remainder are
    DoS-class and are mitigated in practice by the per-IP rate limiting already on
    every route. Tracked for the Next 16 migration post-submission.

---

## 6. Efficiency

- Every Gemini call sets `maxOutputTokens` and a timeout with a single retry; vision
  calls get a longer timeout (15s) reflecting real multimodal latency.
- **Response caching** (`lib/responseCache.ts`): identical (system instruction, user
  content, output cap) requests are served from an in-memory cache for 60s by
  default. This absorbs realistic burst load — hundreds of fans near one gate asking
  the same concierge question, or several operators loading the Command Center within
  the same tick — turning duplicate calls into cache hits instead of paid model calls.
  TTL is short enough that context embedded in prompts (like live crowd counts) can't
  go meaningfully stale.
- Deterministic math — crowd classification, forecasting, carbon footprint, need
  scoring, event impact modeling — never touches the network. The model is only
  called where natural-language synthesis genuinely adds value.
- The live crowd stream (SSE) pushes on a fixed 5s tick rather than the client
  polling, and closes cleanly on client disconnect (`request.signal` abort listener).
- The Operations Copilot only calls Gemini once per question/briefing, after
  synchronously gathering every agent's state — no chained agent-to-agent AI calls.

---

## 7. Testing

```bash
npm test
```

**144 tests across 26 files**, with zero network dependency:

- **Pure business logic**: crowd classification/forecasting, the match-event impact
  model, volunteer need-scoring and greedy allocation, carbon-footprint math, utility
  status classification, incident-triage fallback, every zod schema, the rate limiter,
  the response cache, and the orchestrator's context-gathering + health-score
  calculation (determinism checks, boundary checks).
- **Security-relevant paths, directly tested**: the prompt-injection fencing helper
  (forged-marker neutralization), the log-redaction helper (sensitive keys never
  leak), and the vision-input validator (MIME type + 5MB size enforcement).
- **Real automated accessibility audits** (`*.a11y.test.tsx`, via `jest-axe` +
  `@testing-library/react` + `jsdom`): `CrowdHeatmap`, `IncidentForm`,
  `TransportPlanner`, `SustainabilityCalculator`, and `Header` are each rendered and
  scanned for WCAG violations with `axe-core` — this catches real issues (missing
  labels, contrast, landmark structure), not just a documentation claim.

`npm test`, `npm run lint`, and `npm run build` all run automatically on every push
via GitHub Actions (`.github/workflows/ci.yml`).

---

## 8. Accessibility

- Semantic landmarks, a "skip to main content" link, and full keyboard operability
  with a persistent visible focus ring.
- Crowd levels, incident severities, and vision-detected density are **never
  color-only** — every badge/heatmap has a text label and an accessible table
  equivalent (`components/CrowdHeatmap.tsx`).
- User-adjustable text size (up to 125%) and a high-contrast theme, persisted across
  visits.
- `prefers-reduced-motion` is respected globally.
- Live regions (`aria-live`, `role="status"`/`role="alert"`) on the concierge chat,
  Copilot report, event simulator, and vision analysis so assistive tech announces
  updates as they stream in.
- The Vision Inspector explicitly surfaces accessibility conditions (blocked ramps,
  unclear signage) as a first-class output, not an afterthought.

---

## 9. Roadmap to production scale

- Swap the in-memory incident/volunteer/rate-limit stores for a shared store
  (Redis/Postgres) so state is consistent across instances.
- Replace the SSE crowd stream's simulator with a real telemetry bus (Kafka/Pub-Sub)
  once real turnstile/beacon/camera feeds exist.
- Add a dedicated high-frequency CV tier (Vertex AI Vision or a custom YOLO pipeline)
  for continuous CCTV monitoring, keeping Gemini vision for on-demand deep inspection.
- Introduce a vector store (Pinecone/Weaviate/Vertex AI Vector Search) once the fan
  knowledge base grows beyond what fits directly in a prompt.

---

## 10. Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Google Gemini API
(`@google/generative-ai`, text + multimodal) · Server-Sent Events · zod · Vitest ·
ESLint · GitHub Actions

---

Built by Ayush Naugariya for the Smart Stadiums & Tournament Operations challenge (FIFA World Cup 2026).
