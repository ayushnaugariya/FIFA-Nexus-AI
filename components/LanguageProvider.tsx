'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { LanguageCode } from '@/lib/i18n/languages';

interface LanguageSettings {
  languageCode: LanguageCode;
  setLanguageCode: (code: LanguageCode) => void;
}

const STORAGE_KEY = 'fifa-nexus:language';
const LanguageContext = createContext<LanguageSettings | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [languageCode, setLanguageCode] = useState<LanguageCode>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved) setLanguageCode(saved);
    } catch {
      // Ignore — default language remains English.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = languageCode;
    try {
      localStorage.setItem(STORAGE_KEY, languageCode);
    } catch {
      // Ignore storage failures.
    }
  }, [languageCode]);

  const value = useMemo(() => ({ languageCode, setLanguageCode }), [languageCode]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageSettings {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
