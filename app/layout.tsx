import type { Metadata } from 'next';
import './globals.css';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'FIFA Nexus AI — The Intelligent Stadium Operating System',
  description:
    'A multi-agent GenAI stadium operating system for FIFA World Cup 2026 — crowd intelligence, safety, fan experience, volunteers, transport and sustainability agents unified by an Operations Copilot.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AccessibilityProvider>
          <LanguageProvider>
            <Header />
            <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer className="border-t border-white/5 mt-16">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-mist">
                <span>
                  <span className="text-floodlight font-semibold">FIFA Nexus AI</span> — Multi-agent GenAI Stadium OS for FIFA World Cup 2026
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-turf live-badge" />
                  Powered by Google Gemini
                </span>
              </div>
            </footer>
          </LanguageProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
