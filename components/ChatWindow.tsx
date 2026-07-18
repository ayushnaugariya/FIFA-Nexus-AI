'use client';

import { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface Message {
  id: string;
  role: 'fan' | 'concierge';
  text: string;
  time: string;
}

export function ChatWindow({ stadiumId, languageCode }: { stadiumId: string; languageCode: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'concierge',
      text: '👋 Hi! I\'m your FIFA Nexus AI concierge. Ask me about gates, seating, restrooms, accessible routes, or anything else at your venue. I\'m here to help!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSubmit(e: React.FormEvent, overrideText?: string) {
    e.preventDefault();
    const trimmed = (overrideText ?? input).trim();
    if (!trimmed || isLoading) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fanMessage: Message = { id: crypto.randomUUID(), role: 'fan', text: trimmed, time: now };
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
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'concierge',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The concierge could not respond. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const QUICK = [
    'Where is Gate B?',
    'Nearest accessible restroom?',
    'Where can I park?',
    'What food is available?',
  ];

  return (
    <div className="flex flex-col h-[580px] rounded-2xl border border-white/[0.06] bg-pitchnight2 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-turf/20 text-base border border-turf/20">
          🤖
        </div>
        <div>
          <p className="text-sm font-semibold text-chalk">Nexus Concierge</p>
          <p className="text-xs text-turf flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-turf live-badge inline-block" />
            Online · Replies in {languageCode.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation with the AI concierge"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-scroll"
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === 'fan' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {m.role === 'concierge' && (
              <div className="mt-1 flex-shrink-0 h-7 w-7 rounded-full bg-turf/20 flex items-center justify-center text-sm border border-turf/20">
                🤖
              </div>
            )}
            <div className="max-w-[78%]">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'fan'
                    ? 'chat-bubble-user rounded-tr-sm'
                    : 'chat-bubble-ai rounded-tl-sm text-chalk'
                }`}
              >
                <span className="sr-only">{m.role === 'fan' ? 'You said: ' : 'Concierge said: '}</span>
                {m.text}
              </div>
              <p className={`mt-1 text-[10px] text-mist ${m.role === 'fan' ? 'text-right' : 'text-left'}`}>
                {m.time}
              </p>
            </div>
            {m.role === 'fan' && (
              <div className="mt-1 flex-shrink-0 h-7 w-7 rounded-full bg-floodlight/20 flex items-center justify-center text-xs border border-floodlight/20 font-bold text-floodlight">
                U
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 justify-start animate-fade-in">
            <div className="mt-1 h-7 w-7 rounded-full bg-turf/20 flex items-center justify-center text-sm border border-turf/20">🤖</div>
            <div className="chat-bubble-ai rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="flex gap-1 items-center">
                <span className="h-2 w-2 rounded-full bg-turf/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-turf/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-turf/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-clay/30 bg-clay/10 p-3 text-sm text-clay" role="alert">
            ⚠️ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={(e) => {
                setInput(q);
                handleSubmit(e as unknown as React.FormEvent, q);
              }}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-mist hover:bg-white/[0.08] hover:text-chalk transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/[0.06] p-3">
        <label htmlFor="concierge-input" className="sr-only">Type your question for the concierge</label>
        <input
          id="concierge-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your venue…"
          maxLength={1000}
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-chalk placeholder:text-mist focus:border-floodlight/30 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="btn-glow rounded-xl bg-turf px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 transition-all"
        >
          Send ↑
        </button>
      </form>
    </div>
  );
}
