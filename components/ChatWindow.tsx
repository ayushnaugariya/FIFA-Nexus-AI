'use client';

import { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface Message {
  id: string;
  role: 'fan' | 'concierge';
  text: string;
}

export function ChatWindow({ stadiumId, languageCode }: { stadiumId: string; languageCode: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'concierge', text: 'Hi! Ask me about gates, seating, accessibility, transport or sustainability at your venue.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const fanMessage: Message = { id: crypto.randomUUID(), role: 'fan', text: trimmed };
    setMessages((prev) => [...prev, fanMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, languageCode, stadiumId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'concierge', text: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The concierge could not respond. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-[520px] flex-col rounded-card border border-white/10 bg-pitchnight2">
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation with the AI concierge"
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'fan' ? 'justify-end' : 'justify-start'}`}>
            <p
              className={`max-w-[80%] rounded-card px-4 py-2 text-sm ${
                m.role === 'fan' ? 'bg-floodlight text-pitchnight' : 'bg-pitchnight text-chalk'
              }`}
            >
              <span className="sr-only">{m.role === 'fan' ? 'You said: ' : 'Concierge said: '}</span>
              {m.text}
            </p>
          </div>
        ))}
        {isLoading && <LoadingSpinner label="Concierge is typing…" />}
        {error && (
          <p role="alert" className="text-sm text-clay">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/10 p-3">
        <label htmlFor="concierge-input" className="sr-only">
          Type your question for the concierge
        </label>
        <input
          id="concierge-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Where's the nearest accessible restroom to Gate B?"
          maxLength={1000}
          className="flex-1 rounded-card border border-white/20 bg-pitchnight px-3 py-2 text-sm text-chalk placeholder:text-mist"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-card bg-floodlight px-4 py-2 text-sm font-semibold text-pitchnight disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
