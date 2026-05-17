import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import {
  AppLocale,
  SUPPORTED_LOCALES,
  getStoredLocale,
  setStoredLocale,
  getBrowserLocale,
  normalizeLocale,
} from '../lib/locale';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'pt',
  setLocale: async () => {},
  isLoading: true,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState<AppLocale>('pt');
  const [isLoading, setIsLoading] = useState(true);

  const detectLocale = useCallback(async (): Promise<AppLocale> => {
    const stored = getStoredLocale();
    if (stored) return stored;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('profile_data')
          .eq('auth_id', user.id)
          .maybeSingle();
        const pref = member?.profile_data?.preferred_language;
        if (pref) return normalizeLocale(pref);
      }
    } catch {
      /* continue */
    }

    const browser = getBrowserLocale();
    if (browser) return browser;

    try {
      const res = await fetch(`${BACKEND_URL}/api/locale/detect`);
      if (res.ok) {
        const { locale: detected } = await res.json();
        return normalizeLocale(detected);
      }
    } catch {
      /* fallback */
    }

    return 'pt';
  }, []);

  useEffect(() => {
    detectLocale().then((detected) => {
      setLocaleState(detected);
      setStoredLocale(detected);
      void i18n.changeLanguage(detected);
      setIsLoading(false);
    });
  }, [detectLocale, i18n]);

  const setLocale = useCallback(
    async (newLocale: AppLocale) => {
      if (!SUPPORTED_LOCALES.includes(newLocale)) return;
      setLocaleState(newLocale);
      setStoredLocale(newLocale);
      await i18n.changeLanguage(newLocale);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: member } = await supabase
            .from('members')
            .select('id, profile_data')
            .eq('auth_id', user.id)
            .maybeSingle();
          if (member) {
            await supabase
              .from('members')
              .update({
                profile_data: {
                  ...member.profile_data,
                  preferred_language: newLocale,
                },
              })
              .eq('id', member.id);
          }
        }
      } catch (err) {
        console.error('Failed to save locale preference:', err);
      }
    },
    [i18n]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isLoading }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
