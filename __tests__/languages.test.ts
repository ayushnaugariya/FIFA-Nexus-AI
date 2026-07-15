import { describe, expect, it } from 'vitest';
import { languageNameFor, LANGUAGES } from '../lib/i18n/languages';

describe('languageNameFor', () => {
  it('resolves every supported code to its English name', () => {
    for (const lang of LANGUAGES) {
      expect(languageNameFor(lang.code)).toBe(lang.englishName);
    }
  });

  it('falls back to English for an unknown code', () => {
    expect(languageNameFor('xx')).toBe('English');
    expect(languageNameFor('')).toBe('English');
  });

  it('every language has a non-empty native name', () => {
    for (const lang of LANGUAGES) {
      expect(lang.nativeName.length).toBeGreaterThan(0);
    }
  });
});
