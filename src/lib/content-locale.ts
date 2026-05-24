import type { AppLocale } from './locale';

/** UI locale vs content locale (FR users see English product/news body). */
export function resolveContentLocale(uiLocale: AppLocale): AppLocale {
  if (uiLocale === 'fr') return 'en';
  return uiLocale;
}
