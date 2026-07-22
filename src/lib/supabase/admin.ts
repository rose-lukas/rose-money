import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 * Bypasses RLS — use ONLY for privileged operations (account creation,
 * membership management) and never expose to the browser.
 *
 * IMPORTANT: SUPABASE_SERVICE_ROLE_KEY must belong to the SAME project as
 * NEXT_PUBLIC_SUPABASE_URL, otherwise requests fail with "invalid API key".
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase admin config: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
