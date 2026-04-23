import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieMethodsServer } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type CookieToSet = Parameters<NonNullable<CookieMethodsServer['setAll']>>[0][number]

// C-2: env-guard — fail fast with a clear message instead of runtime TypeError
function getEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      '[supabase/server] Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
  return { url, key }
}

export async function createClient(): Promise<SupabaseClient<Database>> {
  const { url, key } = getEnvVars()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      // C-7: setAll can throw in Route Handlers (cookies are read-only there).
      // We catch that expected error silently, but log unexpected ones in dev
      // so they are not hidden during development.
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[supabase/server] cookie set failed (expected in Route Handlers):', e)
          }
        }
      },
    },
  })
}
