import Link from 'next/link';

const AGENTS = [
  {
    href: '/command-center',
    title: 'Operations Copilot',
    icon: '🎛️',
    covers: 'Operational Intelligence',
    color: 'gold',
    description: 'Ask "what\'s happening right now?" and get a synthesized report across every agent, plus a live stadium health score.',
  },
  {
    href: '/command-center',
    title: 'Crowd Intelligence',
    icon: '👥',
    covers: 'Predictive Analytics',
    color: 'gold',
    description: 'Live zone occupancy with 15–60 minute forecasts, flagging zones projected to cross critical density before they do.',
  },
  {
    href: '/command-center',
    title: 'Safety & Volunteer',
    icon: '🛡️',
    covers: 'Real-time Decision Support',
    color: 'red',
    description: 'AI-triaged incident reports and a needs-based volunteer allocator that continuously re-optimizes deployment.',
  },
  {
    href: '/vision',
    title: 'Vision Inspector',
    icon: '👁️',
    covers: 'Computer Vision',
    color: 'blue',
    description: 'Upload a concourse photo for Gemini-powered crowd density, hazard, and accessibility analysis.',
  },
  {
    href: '/concierge',
    title: 'Fan Concierge',
    icon: '💬',
    covers: 'Multilingual Assistance',
    color: 'green',
    description: 'Multilingual concierge answering gate, seat, and accessible-route questions in 10 languages, grounded in real venue data.',
  },
  {
    href: '/transport',
    title: 'Transport Agent',
    icon: '🚇',
    covers: 'Transportation',
    color: 'blue',
    description: 'Personalized transit and parking recommendations, including step-free options and post-match departure-surge awareness.',
  },
  {
    href: '/sustainability',
    title: 'Sustainability Agent',
    icon: '🌿',
    covers: 'Carbon & Utilities',
    color: 'green',
    description: 'Carbon footprint calculator for fan travel, plus live venue power/water/waste monitoring for operators.',
  },
];

const STATS = [
  { value: '7', label: 'Specialized AI Agents', icon: '🤖' },
  { value: '10', label: 'Languages Supported', icon: '🌐' },
  { value: '5s', label: 'Live Telemetry Tick', icon: '⚡' },
  { value: '60min', label: 'Crowd Forecasting', icon: '📊' },
];

const colorMap = {
  gold: 'border-floodlight/20 hover:border-floodlight/50 hover:shadow-[0_0_30px_rgba(255,182,39,0.12)]',
  green: 'border-turf/20 hover:border-turf/50 hover:shadow-[0_0_30px_rgba(27,138,90,0.12)]',
  red: 'border-clay/20 hover:border-clay/50 hover:shadow-[0_0_30px_rgba(225,75,75,0.12)]',
  blue: 'border-white/10 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.06)]',
};

const iconBgMap = {
  gold: 'bg-floodlight/10 text-floodlight border-floodlight/20',
  green: 'bg-turf/10 text-turf border-turf/20',
  red: 'bg-clay/10 text-clay border-clay/20',
  blue: 'bg-white/5 text-chalk border-white/10',
};

const coversColorMap = {
  gold: 'text-floodlight',
  green: 'text-turf',
  red: 'text-clay',
  blue: 'text-mist',
};

const btnColorMap = {
  gold: 'bg-floodlight/10 text-floodlight border-floodlight/30 hover:bg-floodlight hover:text-pitchnight',
  green: 'bg-turf/10 text-turf border-turf/30 hover:bg-turf hover:text-white',
  red: 'bg-clay/10 text-clay border-clay/30 hover:bg-clay hover:text-white',
  blue: 'bg-white/5 text-chalk border-white/20 hover:bg-white/10 hover:text-chalk',
};

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative mb-16 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-pitchnight2 to-pitchnight p-8 sm:p-12">
        {/* Background glow orbs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-floodlight/8 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-turf/8 blur-[80px]" />

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-floodlight/20 bg-floodlight/8 px-4 py-1.5 text-xs font-semibold text-floodlight">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-floodlight live-badge" />
            FIFA World Cup 2026 · Smart Stadiums Challenge
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            The intelligent stadium
            <br />
            <span className="gradient-text">operating system.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base text-mist leading-relaxed">
            FIFA Nexus AI is a multi-agent GenAI platform for FIFA World Cup 2026. Specialized
            agents handle crowd intelligence, safety, fan experience, volunteers, transport, and
            sustainability — unified by an <span className="text-chalk font-medium">Operations Copilot</span> that
            synthesizes everything into a single situational report.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/command-center"
              className="btn-glow inline-flex items-center gap-2 rounded-xl bg-floodlight px-6 py-3 text-sm font-semibold text-pitchnight transition-all hover:bg-floodlight/90"
            >
              <span>🎛️</span> Open Command Center
            </Link>
            <Link
              href="/concierge"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-chalk transition-all hover:bg-white/[0.08]"
            >
              <span>💬</span> Fan Concierge
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="card rounded-xl p-4 text-center"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="stat-number text-2xl text-floodlight">{stat.value}</div>
            <div className="mt-0.5 text-xs text-mist leading-tight">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ── Agents Grid ── */}
      <section aria-label="Platform agents">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-chalk">Platform Agents</h2>
          <div className="section-divider flex-1" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => (
            <article
              key={agent.title}
              className={`card group flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 ${colorMap[agent.color as keyof typeof colorMap]}`}
            >
              <div>
                {/* Icon + covers row */}
                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl ${iconBgMap[agent.color as keyof typeof iconBgMap]}`}>
                    {agent.icon}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-widest ${coversColorMap[agent.color as keyof typeof coversColorMap]}`}>
                    {agent.covers}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-chalk group-hover:text-white transition-colors">
                  {agent.title}
                </h3>
                <p className="mt-2 text-sm text-mist leading-relaxed">
                  {agent.description}
                </p>
              </div>

              <Link
                href={agent.href}
                className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${btnColorMap[agent.color as keyof typeof btnColorMap]}`}
              >
                Open {agent.title}
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mt-16">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="font-display text-2xl font-bold text-chalk">How It Works</h2>
          <div className="section-divider flex-1" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: '01', title: 'Live Telemetry', desc: 'Server-Sent Events stream live crowd density every 5 seconds from all stadium zones.', icon: '📡' },
            { step: '02', title: 'AI Analysis', desc: 'Seven specialized Gemini agents analyze crowd, safety, transport, sustainability and fan needs in parallel.', icon: '🧠' },
            { step: '03', title: 'Unified Report', desc: 'The Operations Copilot synthesizes everything into one explainable situational briefing with a Stadium Health Score.', icon: '📋' },
          ].map((item) => (
            <div key={item.step} className="card rounded-2xl p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-display text-4xl font-black text-floodlight/20">{item.step}</span>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <h3 className="font-display text-base font-bold text-chalk">{item.title}</h3>
              <p className="mt-1.5 text-sm text-mist">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
