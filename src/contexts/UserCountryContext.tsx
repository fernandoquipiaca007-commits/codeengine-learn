import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface UserCountryContextValue {
  country: string | null;
  isAngola: boolean;
  isLoading: boolean;
  setUserCountry: (country: string) => Promise<void>;
  rates: { USD_BRL: number; USD_EUR: number; USD_AOA: number } | null;
  convertPrice: (usdPrice: number, aoaPrice?: number | null) => { amount: number; currency: string; formatted: string };
}

const UserCountryContext = createContext<UserCountryContextValue>({
  country: null,
  isAngola: false,
  isLoading: true,
  setUserCountry: async () => {},
  rates: null,
  convertPrice: (usdPrice) => ({ amount: usdPrice, currency: 'USD', formatted: `$${usdPrice}` }),
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://codeengine-api-production-cb0c.up.railway.app';

export function UserCountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rates, setRates] = useState<{ USD_BRL: number; USD_EUR: number; USD_AOA: number } | null>(null);

  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/stripe/exchange-rates`);
        const data = await res.json();
        if (data.success && data.rates) {
          setRates(data.rates);
        }
      } catch (err) {
        console.warn('[UserCountryContext] Error fetching exchange rates:', err);
      }
    }
    fetchRates();
  }, []);

  const loadCountry = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCountry(null);
        return;
      }

      // Priority 1: auth user metadata (set during signup)
      const metaCountry: string | null = user.user_metadata?.country ?? null;
      if (metaCountry && metaCountry.trim() !== '') {
        setCountry(metaCountry.trim().toUpperCase());
        return;
      }

      // Priority 2: members.profile_data.country (synced from metadata)
      const { data: member } = await supabase
        .from('members')
        .select('profile_data')
        .eq('auth_id', user.id)
        .maybeSingle();

      const profileCountry: string | null = member?.profile_data?.country ?? null;
      if (profileCountry && profileCountry.trim() !== '') {
        setCountry(profileCountry.trim().toUpperCase());
        return;
      }

      // No country found
      setCountry(null);
    } catch (err) {
      console.error('[UserCountryContext] Error loading country:', err);
      setCountry(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCountry();

    // Re-run on auth state change (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metaCountry: string | null = session.user.user_metadata?.country ?? null;
        setCountry(metaCountry ? metaCountry.trim().toUpperCase() : null);
      } else {
        setCountry(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadCountry]);

  const setUserCountry = useCallback(async (newCountry: string) => {
    const normalized = newCountry.trim().toUpperCase();
    setCountry(normalized);

    try {
      // 1. Update Supabase auth user metadata
      await supabase.auth.updateUser({
        data: { country: normalized },
      });

      // 2. Sync into members.profile_data.country
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
                country: normalized,
              },
            })
            .eq('id', member.id);
        }
      }
    } catch (err) {
      console.error('[UserCountryContext] Error saving country:', err);
    }
  }, []);

  const convertPrice = useCallback((usdPrice: number, aoaPrice?: number | null) => {
    const defaultRates = { USD_BRL: 5.40, USD_EUR: 0.92, USD_AOA: 850.00 };
    const activeRates = rates || defaultRates;

    if (country === 'BR') {
      const amount = usdPrice * activeRates.USD_BRL;
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);
      return { amount, currency: 'BRL', formatted };
    }

    if (country === 'PT') {
      const amount = usdPrice * activeRates.USD_EUR;
      const formatted = new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
      return { amount, currency: 'EUR', formatted };
    }

    if (country === 'AO') {
      if (aoaPrice != null && aoaPrice > 0) {
        const formatted = new Intl.NumberFormat('pt-AO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(aoaPrice) + ' Kz';
        return { amount: aoaPrice, currency: 'AOA', formatted };
      } else {
        const amount = usdPrice * activeRates.USD_AOA;
        const formatted = new Intl.NumberFormat('pt-AO', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(amount) + ' Kz';
        return { amount, currency: 'AOA', formatted };
      }
    }

    // Default to USD
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdPrice);
    return { amount: usdPrice, currency: 'USD', formatted };
  }, [country, rates]);

  return (
    <UserCountryContext.Provider
      value={{
        country,
        isAngola: country === 'AO',
        isLoading,
        setUserCountry,
        rates,
        convertPrice,
      }}
    >
      {children}
    </UserCountryContext.Provider>
  );
}

export function useUserCountry() {
  return useContext(UserCountryContext);
}
