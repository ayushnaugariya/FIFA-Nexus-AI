import Link from 'next/link';
import { Card } from '@/components/Card';

const AGENTS = [
  {
    href: '/command-center',
    title: 'Operations Copilot',
    covers: 'Operational intelligence · Real-time decision support',
    description: 'The central intelligence layer. Ask "what\u2019s happening right now?" and get a synthesized report across every agent, plus a live stadium health score.',
  },
  {
    href: '/command-center',
    title: 'Crowd Intelligence Agent',
    covers: 'Crowd management · Predictive analytics',
    description: 'Live zone occupancy with 15-60 minute forecasts, flagging zones projected to cross critical density before they do.',
  },
  {
    href: '/command-center',
    title: 'Safety & Volunteer Agents',
    covers: 'Real-time decision support',
    description: 'AI-triaged incident reports and a needs-based volunteer allocator that continuously re-optimizes deployment across zones.',
  },
  {
    href: '/vision',
    title: 'Vision Inspector',
    covers: 'Crowd management · Accessibility',
    description: 'Upload a concourse photo for Gemini-powered crowd density, hazard, and accessibility analysis \u2014 GenAI-native, no separate CV pipeline.',
  },
  {
    href: '/concierge',
    title: 'Fan Experience Agent',
    covers: 'Navigation · Multilingual assistance · Accessibility',
    description: 'A multilingual concierge answering gate, seat, and accessible-route questions in 10 languages, grounded in real venue data.',
  },
  {
    href: '/transport',
    title: 'Transport Intelligence Agent',
    covers: 'Transportation',
    description: 'Personalized transit and parking recommendations, including step-free options and post-match departure-surge awareness.',
  },
  {
    href: '/sustainability',
    title: 'Sustainability Agent',
    covers: 'Sustainability',
    description: 'A carbon footprint calculator for fan travel, plus live venue power/water/waste monitoring for operators.',
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-floodlight">
          One AI brain. Thousands of decisions. Millions of better experiences.
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-wide sm:text-5xl">
          The intelligent stadium{' '}
          <span className="text-floodlight">operating system.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-mist">
          FIFA Nexus AI is a multi-agent GenAI platform for FIFA World Cup 2026: specialized agents for
          crowd intelligence, safety, fan experience, volunteers, transport, and sustainability, unified
          by an Operations Copilot that turns raw stadium data into a single, explainable situational
          report — before problems occur, not after.
        </p>
      </section>

      <section aria-label="Platform agents" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent) => (
          <Card key={agent.title} as="article" className="flex flex-col justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-floodlight">{agent.covers}</p>
              <h2 className="font-display text-xl">{agent.title}</h2>
              <p className="mt-2 text-sm text-mist">{agent.description}</p>
            </div>
            <Link
              href={agent.href}
              className="mt-4 inline-block rounded-card bg-floodlight px-3 py-2 text-center text-sm font-semibold text-pitchnight"
            >
              Open {agent.title}
            </Link>
          </Card>
        ))}
      </section>
    </div>
  );
}
