import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables validation with resilient fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key-to-prevent-startup-crash';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ WARNING: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing! ' +
    'The app will load but database queries will fail until these are configured in Vercel settings.'
  );
}

// Create Supabase client with anon key (for public access with RLS)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Connection health check
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

// Export types for convenience
export type { SupabaseClient };
