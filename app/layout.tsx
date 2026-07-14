import type { Metadata } from 'next';
import './globals.css';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import { Header } from '@/components/Header';

// Fonts are declared as system-font stacks in app/globals.css (--font-display /
// --font-body) rather than via next/font/google. This keeps `npm run build`
// fully offline-capable — no dependency on reaching fonts.googleapis.com from
// whatever machine or CI runner builds this project.

export const metadata: Metadata = {
  title: 'FIFA Nexus AI — The Intelligent Stadium Operating System',
  description:
    'A multi-agent GenAI stadium operating system for FIFA World Cup 2026 — crowd intelligence, safety, fan experience, volunteers, transport and sustainability agents unified by an Operations Copilot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AccessibilityProvider>
          <LanguageProvider>
            <Header />
            <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
              {children}
            </main>
            <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-mist">
              FIFA Nexus AI — a multi-agent GenAI stadium operating system for the Smart Stadiums &amp; Tournament Operations challenge.
            </footer>
          </LanguageProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
