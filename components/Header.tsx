'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccessibility } from './AccessibilityProvider';
import { useLanguage } from './LanguageProvider';
import { LANGUAGES } from '@/lib/i18n/languages';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/command-center', label: 'Command Center', icon: '🎛️' },
  { href: '/concierge', label: 'Concierge', icon: '💬' },
  { href: '/vision', label: 'Vision', icon: '👁️' },
  { href: '/transport', label: 'Transport', icon: '🚇' },
  { href: '/sustainability', label: 'Sustainability', icon: '🌿' },
  { href: '/accessibility', label: 'Accessibility', icon: '♿' },
];

export function Header() {
  const pathname = usePathname();
  const { fontScale, setFontScale, highContrast, toggleHighContrast } = useAccessibility();
  const { languageCode, setLanguageCode } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-pitchnight/80 backdrop-blur-xl">
      <a
        href="#main-content"
        className="sr-only-live focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-floodlight focus:px-4 focus:py-2 focus:text-pitchnight focus:font-semibold"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-floodlight/10 border border-floodlight/20 group-hover:bg-floodlight/20 transition-colors">
            <span className="text-floodlight text-sm font-bold">⚽</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-chalk">
            FIFA <span className="gradient-text">NEXUS</span> AI
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  active
                    ? 'nav-active text-pitchnight'
                    : 'text-mist hover:bg-white/[0.06] hover:text-chalk'
                }`}
              >
                <span className="text-xs">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="language-select">Choose language</label>
          <select
            id="language-select"
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value as typeof languageCode)}
            className="hidden sm:block rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-chalk focus:border-floodlight/50 transition-colors"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-pitchnight2">
                {lang.nativeName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setFontScale(fontScale === 'normal' ? 'large' : fontScale === 'large' ? 'xl' : 'normal')}
            aria-pressed={fontScale !== 'normal'}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-chalk hover:bg-white/[0.08] transition-colors"
            title="Cycle text size"
          >
            A{fontScale === 'xl' ? '⁺⁺⁺' : fontScale === 'large' ? '⁺⁺' : '⁺'}
          </button>

          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-chalk hover:bg-white/[0.08] transition-colors"
          >
            {highContrast ? '☀️' : '🌙'}
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-chalk"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/[0.06] px-4 pb-3 pt-2 space-y-0.5 animate-fade-in">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  active ? 'bg-floodlight text-pitchnight' : 'text-mist hover:bg-white/[0.06] hover:text-chalk'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
