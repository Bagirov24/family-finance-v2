import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// C-2: env-guard — fail fast with a clear message instead of runtime TypeError
function getEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      '[supabase/client] Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
  return { url, key }
}

// C-1: removed module-level `let client` singleton.
// createBrowserClient from @supabase/ssr internally de-duplicates the instance
// by URL+key, so calling createClient() multiple times is safe and correct.
// The external singleton was dangerous in SSR contexts where the module could
// be imported server-side, sharing session state across requests.
export function createClient(): SupabaseClient<Database> {
  const { url, key } = getEnvVars()
  return createBrowserClient<Database>(url, key)
}
