'use client';

import { useState } from 'react';
import { DEFAULT_STADIUM } from '@/lib/stadiumData';
import { StadiumSelect } from '@/components/StadiumSelect';
import { ChatWindow } from '@/components/ChatWindow';
import { useLanguage } from '@/components/LanguageProvider';
import { Card } from '@/components/Card';

export default function ConciergePage() {
  const [stadiumId, setStadiumId] = useState(DEFAULT_STADIUM.id);
  const { languageCode } = useLanguage();

  return (
    <div>
      <h1 className="font-display text-3xl">Fan Experience Agent</h1>
      <p className="mt-1 max-w-2xl text-sm text-mist">
        Ask about gates, seating, restrooms, accessible routes, or anything else at your venue.
        Answers are grounded in real venue data and delivered in your chosen language.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <StadiumSelect value={stadiumId} onChange={setStadiumId} />
          <p className="mt-3 text-xs text-mist">
            Replying in: <span className="text-chalk">{languageCode.toUpperCase()}</span> — change this from the
            language switcher in the header.
          </p>
        </Card>
        <ChatWindow stadiumId={stadiumId} languageCode={languageCode} />
      </div>
    </div>
  );
}
