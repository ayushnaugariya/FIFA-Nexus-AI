'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccessibility } from './AccessibilityProvider';
import { useLanguage } from './LanguageProvider';
import { LANGUAGES } from '@/lib/i18n/languages';

const NAV_LINKS = [
  { href: '/command-center', label: 'Command Center' },
  { href: '/concierge', label: 'Concierge' },
  { href: '/vision', label: 'Vision' },
  { href: '/transport', label: 'Transport' },
  { href: '/sustainability', label: 'Sustainability' },
  { href: '/accessibility', label: 'Accessibility' },
];

export function Header() {
  const pathname = usePathname();
  const { fontScale, setFontScale, highContrast, toggleHighContrast } = useAccessibility();
  const { languageCode, setLanguageCode } = useLanguage();

  return (
    <header className="border-b border-white/10 bg-pitchnight2">
      <a
        href="#main-content"
        className="sr-only-live focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-floodlight focus:px-4 focus:py-2 focus:text-pitchnight"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-display text-2xl font-semibold tracking-wide text-chalk">
          FIFA <span className="text-floodlight">NEXUS</span> AI
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-card px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-floodlight text-pitchnight' : 'text-mist hover:bg-white/5 hover:text-chalk'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="language-select">
            Choose language
          </label>
          <select
            id="language-select"
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value as typeof languageCode)}
            className="rounded-card border border-white/20 bg-pitchnight px-2 py-1.5 text-sm text-chalk"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setFontScale(fontScale === 'normal' ? 'large' : fontScale === 'large' ? 'xl' : 'normal')}
            aria-pressed={fontScale !== 'normal'}
            className="rounded-card border border-white/20 px-2 py-1.5 text-sm text-chalk hover:bg-white/5"
            title="Cycle text size: normal, large, extra large"
          >
            A{fontScale === 'xl' ? '+++' : fontScale === 'large' ? '++' : '+'}
          </button>

          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className="rounded-card border border-white/20 px-2 py-1.5 text-sm text-chalk hover:bg-white/5"
          >
            {highContrast ? 'Standard contrast' : 'High contrast'}
          </button>
        </div>
      </div>
    </header>
  );
}
