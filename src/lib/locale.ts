export type AppLocale = 'pt' | 'en' | 'fr';

export const SUPPORTED_LOCALES: AppLocale[] = ['pt', 'en', 'fr'];
export const LOCALE_STORAGE_KEY = 'codeengine_locale';

const COUNTRY_TO_LOCALE: Record<string, AppLocale> = {
  // Portuguese-speaking countries
  AO: 'pt', BR: 'pt', PT: 'pt', MZ: 'pt', CV: 'pt', ST: 'pt', GW: 'pt', TL: 'pt',
  // French-speaking countries
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr',
  SN: 'fr', CI: 'fr', ML: 'fr', BF: 'fr', NE: 'fr', TD: 'fr',
  CG: 'fr', CD: 'fr', MG: 'fr', CM: 'fr', RW: 'fr', BI: 'fr',
  DJ: 'fr', KM: 'fr', GQ: 'fr', GA: 'fr', MR: 'fr', TG: 'fr', BJ: 'fr',
  // English-speaking countries (explicit, rest defaults to 'en')
  US: 'en', GB: 'en', CA: 'en', AU: 'en', IE: 'en', NZ: 'en',
  ZA: 'en', NG: 'en', KE: 'en', GH: 'en', ZW: 'en', ZM: 'en',
};

export function normalizeLocale(input?: string | null): AppLocale {
  if (!input) return 'en';
  const lower = input.toLowerCase();
  if (lower.startsWith('pt')) return 'pt';
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('fr')) return 'fr';
  return 'en';
}

export function countryToLocale(countryCode?: string | null): AppLocale {
  if (!countryCode) return 'en';
  return COUNTRY_TO_LOCALE[countryCode.toUpperCase()] ?? 'en';
}

export function getBrowserLocale(): AppLocale {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
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
