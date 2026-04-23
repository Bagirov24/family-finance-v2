import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// expire-transfers
// Scheduled Edge Function - runs every 6 hours via Supabase Cron.
// Schedule: 0 */6 * * *  (set in Dashboard -> Edge Functions -> Schedule)
// Can also be triggered manually via POST with service-role key.

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase.rpc('expire_pending_transfers')

  if (error) {
    console.error('[expire-transfers] RPC error:', error.message)
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const expired: number = data ?? 0
  console.log(`[expire-transfers] Expired ${expired} transfer(s)`)

  return new Response(
    JSON.stringify({ ok: true, expired }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
