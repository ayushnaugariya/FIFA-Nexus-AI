import { SUPPORTED_LANGUAGE_CODES } from '../validation';

export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const LANGUAGES: { code: LanguageCode; nativeName: string; englishName: string }[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'fr', nativeName: 'Français', englishName: 'French' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'zh', nativeName: '中文', englishName: 'Chinese' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese' },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German' },
];

export function languageNameFor(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.englishName ?? 'English';
}
