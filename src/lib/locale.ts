export type AppLocale = 'pt' | 'en' | 'fr';

export const SUPPORTED_LOCALES: AppLocale[] = ['pt', 'en', 'fr'];
export const LOCALE_STORAGE_KEY = 'codeengine_locale';

const COUNTRY_TO_LOCALE: Record<string, AppLocale> = {
  AO: 'pt', BR: 'pt', PT: 'pt', MZ: 'pt', CV: 'pt',
  US: 'en', GB: 'en', CA: 'en', AU: 'en', IE: 'en', NZ: 'en',
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr',
};

export function normalizeLocale(input?: string | null): AppLocale {
  if (!input) return 'pt';
  const lower = input.toLowerCase();
  if (lower.startsWith('pt')) return 'pt';
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('fr')) return 'fr';
  return 'pt';
}

export function countryToLocale(countryCode?: string | null): AppLocale | null {
  if (!countryCode) return null;
  return COUNTRY_TO_LOCALE[countryCode.toUpperCase()] ?? null;
}

export function getBrowserLocale(): AppLocale {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'pt';
  return normalizeLocale(nav);
}

export function getStoredLocale(): AppLocale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as AppLocale)) {
      return stored as AppLocale;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setStoredLocale(locale: AppLocale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale === 'pt' ? 'pt-BR' : locale;
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  pt: 'Português',
  en: 'English',
  fr: 'Français',
};
