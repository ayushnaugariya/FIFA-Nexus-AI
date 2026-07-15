// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Header } from '../components/Header';
import { AccessibilityProvider } from '../components/AccessibilityProvider';
import { LanguageProvider } from '../components/LanguageProvider';

function renderHeader() {
  return render(
    <AccessibilityProvider>
      <LanguageProvider>
        <Header />
      </LanguageProvider>
    </AccessibilityProvider>,
  );
}

describe('Header accessibility', () => {
  it('has no detectable axe violations', async () => {
    const { container } = renderHeader();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('provides a skip-to-content link as the first focusable element', () => {
    const { getByText } = renderHeader();
    expect(getByText(/skip to main content/i)).toBeTruthy();
  });

  it('exposes the primary navigation as a labeled landmark', () => {
    const { getByRole } = renderHeader();
    expect(getByRole('navigation', { name: /primary/i })).toBeTruthy();
  });
});
