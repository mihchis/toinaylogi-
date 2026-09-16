import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isSupabaseServerConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseServiceKey &&
    supabaseServiceKey !== 'your-anon-key'
  );
}

/**
 * Server/Admin client using Service Role key (or anon key fallback)
 * Bypasses RLS when service role key is provided, useful for backend tasks & cron
 */
export function getSupabaseServerClient() {
  if (!isSupabaseServerConfigured()) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
