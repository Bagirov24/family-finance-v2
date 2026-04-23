import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Allowed origin for CORS.
 * Set ALLOWED_ORIGIN env var to your production frontend URL, e.g.:
 *   https://your-app.netlify.app
 * For local dev set it to http://localhost:3000
 *
 * Supabase Dashboard → Edge Functions → Secrets
 */
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? ''

/**
 * Returns CORS headers scoped to the request origin.
 * Only reflects the Origin header if it matches ALLOWED_ORIGIN.
 * Falls back to ALLOWED_ORIGIN itself (never '*') so the browser
 * blocks cross-origin requests from unknown sites.
 */
function getCorsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get('Origin') ?? ''
  const allowedOrigin = requestOrigin === ALLOWED_ORIGIN ? requestOrigin : ALLOWED_ORIGIN

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  const body = await req.json() as {
    transfer_id?: string
    transferId?: string
    action?: 'confirmed' | 'declined' | 'confirm' | 'decline'
  }

  const transferId = body.transfer_id ?? body.transferId
  const action = body.action

  if (!transferId || !action) {
    return new Response(JSON.stringify({ error: 'Missing transfer_id/transferId or action' }), {
      status: 400,
      headers: corsHeaders,
    })
  }

  const normalizedAction = action === 'confirmed' ? 'confirm' : action === 'declined' ? 'decline' : action

  const { data: transfer, error: fetchErr } = await supabase
    .from('member_transfers')
    .select('*')
    .eq('id', transferId)
    .single()

  if (fetchErr || !transfer) {
    return new Response(JSON.stringify({ error: 'Transfer not found' }), {
      status: 404,
      headers: corsHeaders,
    })
  }

  if (transfer.to_user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: corsHeaders,
    })
  }

  if (transfer.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Transfer already processed' }), {
      status: 409,
      headers: corsHeaders,
    })
  }

  if (normalizedAction === 'decline') {
    const { error: updateError } = await supabase
      .from('member_transfers')
      .update({ status: 'declined' })
      .eq('id', transferId)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: corsHeaders,
      })
    }

    return new Response(JSON.stringify({ ok: true, status: 'declined' }), {
      headers: corsHeaders,
    })
  }

  const { error: rpcErr } = await supabase.rpc('confirm_transfer_atomic', {
    p_transfer_id: transferId,
  })

  if (rpcErr) {
    return new Response(JSON.stringify({ error: rpcErr.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  return new Response(JSON.stringify({ ok: true, status: 'confirmed' }), {
    headers: corsHeaders,
  })
})
