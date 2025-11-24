/**
 * Supabase Service Client for Background Jobs
 *
 * This client uses the service role key and bypasses RLS (Row Level Security).
 * Use ONLY in trusted server-side code like background workers.
 *
 * WARNING: This client has full database access. Never expose this client
 * or the service role key to client-side code.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with service role privileges
 * Bypasses Row Level Security - use carefully
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
