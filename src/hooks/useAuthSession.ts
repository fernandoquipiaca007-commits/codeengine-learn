import { useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthSessionState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

export function useAuthSession(): AuthSessionState {
  const mountedRef = useRef(true);
  const refreshSeqRef = useRef(0);
  const [state, setState] = useState<AuthSessionState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    mountedRef.current = true;

    const setAuthState = (session: Session | null, loading = false) => {
      if (!mountedRef.current) return;
      setState({
        user: session?.user ?? null,
        session,
        loading,
      });
    };

    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Auth session refresh timeout')), timeoutMs);
      });

      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    };

    const refreshSession = async () => {
      const seq = ++refreshSeqRef.current;
      try {
        const { data, error } = await withTimeout(supabase.auth.getSession(), 7000);
        if (error) {
          console.error('Error refreshing auth session:', error);
        }
        if (seq === refreshSeqRef.current) {
          setAuthState(data?.session ?? null);
        }
      } catch (error) {
        console.error('Error refreshing auth session:', error);
        if (seq === refreshSeqRef.current) {
          setAuthState(null);
        }
      }
    };

    void refreshSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session);
    });

    const revalidateOnFocus = () => {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    };

    window.addEventListener('focus', revalidateOnFocus);
    document.addEventListener('visibilitychange', revalidateOnFocus);

    return () => {
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener('focus', revalidateOnFocus);
      document.removeEventListener('visibilitychange', revalidateOnFocus);
    };
  }, []);

  return state;
}
