import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface UserCountryContextValue {
  country: string | null;
  isAngola: boolean;
  isLoading: boolean;
  setUserCountry: (country: string) => Promise<void>;
}

const UserCountryContext = createContext<UserCountryContextValue>({
  country: null,
  isAngola: false,
  isLoading: true,
  setUserCountry: async () => {},
});

export function UserCountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <UserCountryContext.Provider
      value={{
        country,
        isAngola: country === 'AO',
        isLoading,
        setUserCountry,
      }}
    >
      {children}
    </UserCountryContext.Provider>
  );
}

export function useUserCountry() {
  return useContext(UserCountryContext);
}
