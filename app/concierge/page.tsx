'use client';

import { useState } from 'react';
import { DEFAULT_STADIUM } from '@/lib/stadiumData';
import { StadiumSelect } from '@/components/StadiumSelect';
import { ChatWindow } from '@/components/ChatWindow';
import { useLanguage } from '@/components/LanguageProvider';
import { Card } from '@/components/Card';
import { LANGUAGES } from '@/lib/i18n/languages';

export default function ConciergePage() {
  const [stadiumId, setStadiumId] = useState(DEFAULT_STADIUM.id);
  const { languageCode, setLanguageCode } = useLanguage();

  const currentLang = LANGUAGES.find((l) => l.code === languageCode);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-turf/20 bg-turf/10 text-xl">
          💬
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-chalk">Fan Concierge</h1>
          <p className="text-sm text-mist">
            Multilingual AI assistance · 10 languages · Grounded in real venue data
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">Venue</p>
            <StadiumSelect value={stadiumId} onChange={setStadiumId} />
          </Card>

          <Card className="p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">Reply Language</p>
            <select
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value as typeof languageCode)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-chalk focus:border-floodlight/30 focus:outline-none transition-colors"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-pitchnight2">
                  {lang.nativeName} ({lang.code.toUpperCase()})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-mist">
              Now replying in: <span className="font-semibold text-chalk">{currentLang?.nativeName}</span>
            </p>
          </Card>

          {/* Features */}
          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">What I can help with</p>
            <ul className="space-y-2">
              {[
                { icon: '🚪', text: 'Gate & entrance navigation' },
                { icon: '💺', text: 'Seat finding & directions' },
                { icon: '♿', text: 'Accessible routes & services' },
                { icon: '🍔', text: 'Food & drink locations' },
                { icon: '🚻', text: 'Restroom locations' },
                { icon: '🚇', text: 'Transport & parking' },
                { icon: '🌿', text: 'Sustainability info' },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-2 text-sm text-mist">
                  <span className="text-base">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Chat */}
        <ChatWindow stadiumId={stadiumId} languageCode={languageCode} />
      </div>
    </div>
  );
}
