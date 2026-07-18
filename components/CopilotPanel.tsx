'use client';

import { useState } from 'react';
import { HealthScoreGauge } from './HealthScoreGauge';
import { LoadingSpinner } from './LoadingSpinner';

interface CopilotResult {
  report: string;
  healthScore: number;
}

export function CopilotPanel({ stadiumId }: { stadiumId: string }) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(operatorQuestion?: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stadiumId, operatorQuestion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The copilot could not respond.');
      setResult({ report: data.report, healthScore: data.healthScore });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The copilot could not respond.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Health score + briefing button row */}
      <div className="flex items-center justify-between gap-4">
        {result ? (
          <HealthScoreGauge score={result.healthScore} />
        ) : (
          <p className="text-sm text-mist">
            Ask a question or request a briefing to see the live health score.
          </p>
        )}
        <button
          type="button"
          onClick={() => ask(undefined)}
          disabled={isLoading}
          className="btn-glow whitespace-nowrap rounded-xl bg-floodlight px-4 py-2.5 text-sm font-semibold text-pitchnight disabled:opacity-50 transition-all"
        >
          {isLoading ? '⏳ Thinking…' : '📋 Get shift briefing'}
        </button>
      </div>

      {/* Question input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) ask(question.trim());
        }}
        className="flex gap-2"
      >
        <label htmlFor="copilot-question" className="sr-only">
          Ask the Operations Copilot a question
        </label>
        <input
          id="copilot-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What are the biggest risks in the next 30 minutes?"
          maxLength={500}
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-chalk placeholder:text-mist focus:border-floodlight/40 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="rounded-xl border border-floodlight/40 bg-floodlight/10 px-5 py-2.5 text-sm font-semibold text-floodlight hover:bg-floodlight hover:text-pitchnight disabled:opacity-40 transition-all"
        >
          Ask
        </button>
      </form>

      {/* Result */}
      <div aria-live="polite" className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-3 rounded-xl border border-floodlight/20 bg-floodlight/5 p-4">
            <LoadingSpinner label="" />
            <span className="text-sm text-mist">Synthesizing across all agents…</span>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-clay/30 bg-clay/10 p-4 text-sm text-clay" role="alert">
            ⚠️ {error}
          </div>
        )}
        {result && !isLoading && (
          <div
            role="status"
            className="animate-fade-in rounded-xl border border-floodlight/20 bg-gradient-to-br from-floodlight/8 to-transparent p-5 text-sm text-chalk leading-relaxed"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-floodlight">
              AI Situational Report
            </p>
            {result.report}
          </div>
        )}
      </div>
    </div>
  );
}
