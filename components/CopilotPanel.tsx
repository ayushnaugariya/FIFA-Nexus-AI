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
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        {result ? <HealthScoreGauge score={result.healthScore} /> : <p className="text-sm text-mist">Ask a question or request a briefing to see the live health score.</p>}
        <button
          type="button"
          onClick={() => ask(undefined)}
          disabled={isLoading}
          className="whitespace-nowrap rounded-card bg-floodlight px-3 py-2 text-sm font-semibold text-pitchnight disabled:opacity-50"
        >
          Get shift briefing
        </button>
      </div>

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
          className="flex-1 rounded-card border border-white/20 bg-pitchnight px-3 py-2 text-sm text-chalk placeholder:text-mist"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="rounded-card border border-floodlight px-4 py-2 text-sm font-semibold text-floodlight disabled:opacity-50"
        >
          Ask Nexus
        </button>
      </form>

      <div className="mt-4" aria-live="polite">
        {isLoading && <LoadingSpinner label="Synthesizing across agents…" />}
        {error && <p role="alert" className="text-sm text-clay">{error}</p>}
        {result && !isLoading && (
          <p role="status" className="rounded-card border border-floodlight/30 bg-floodlight/10 p-4 text-sm text-chalk">
            {result.report}
          </p>
        )}
      </div>
    </div>
  );
}
