'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type FontScale = 'normal' | 'large' | 'xl';

interface AccessibilitySettings {
  fontScale: FontScale;
  highContrast: boolean;
  setFontScale: (scale: FontScale) => void;
  toggleHighContrast: () => void;
}

const STORAGE_KEY = 'fifa-nexus:accessibility';

const AccessibilityContext = createContext<AccessibilitySettings | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>('normal');
  const [highContrast, setHighContrast] = useState(false);

  // Restore persisted preferences on mount (client-only, no SSR mismatch
  // risk since this is a client component gated behind useEffect).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { fontScale?: FontScale; highContrast?: boolean };
        if (parsed.fontScale) setFontScaleState(parsed.fontScale);
        if (typeof parsed.highContrast === 'boolean') setHighContrast(parsed.highContrast);
      }
    } catch {
      // Corrupt or blocked storage — fall back to defaults silently.
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', fontScale);
    document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontScale, highContrast }));
    } catch {
      // Ignore storage failures (private browsing, quota, etc.)
    }
  }, [fontScale, highContrast]);

  const setFontScale = useCallback((scale: FontScale) => setFontScaleState(scale), []);
  const toggleHighContrast = useCallback(() => setHighContrast((prev) => !prev), []);

  const value = useMemo(
    () => ({ fontScale, highContrast, setFontScale, toggleHighContrast }),
    [fontScale, highContrast, setFontScale, toggleHighContrast],
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilitySettings {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
