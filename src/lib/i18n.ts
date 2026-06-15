import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { LOCALE_STORAGE_KEY } from './locale';

import ptCommon from '../locales/pt/common.json';
import ptMember from '../locales/pt/member.json';
import ptCheckout from '../locales/pt/checkout.json';
import ptAuth from '../locales/pt/auth.json';
import ptPages from '../locales/pt/pages.json';
import enCommon from '../locales/en/common.json';
import enMember from '../locales/en/member.json';
import enCheckout from '../locales/en/checkout.json';
import enAuth from '../locales/en/auth.json';
import enPages from '../locales/en/pages.json';
import frCommon from '../locales/fr/common.json';
import frMember from '../locales/fr/member.json';
import frCheckout from '../locales/fr/checkout.json';
import frAuth from '../locales/fr/auth.json';
import frPages from '../locales/fr/pages.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { common: ptCommon, member: ptMember, checkout: ptCheckout, auth: ptAuth, pages: ptPages },
      en: { common: enCommon, member: enMember, checkout: enCheckout, auth: enAuth, pages: enPages },
      fr: { common: frCommon, member: frMember, checkout: frCheckout, auth: frAuth, pages: frPages },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'member', 'checkout', 'auth', 'pages'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
export { useTranslation } from 'react-i18next';
