import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? ''

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
    from_account_id?: string
    to_account_id?: string
    paid_amount?: number
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
    // Distinguish expired from other terminal states
    const isExpired =
      transfer.status === 'declined' &&
      transfer.expires_at != null &&
      new Date(transfer.expires_at) <= new Date()

    return new Response(
      JSON.stringify({
        error: isExpired ? 'Transfer expired' : 'Transfer already processed',
        status: transfer.status,
      }),
      { status: isExpired ? 410 : 409, headers: corsHeaders }
    )
  }

  // ── DECLINE ────────────────────────────────────────────────────────────────
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

  // ── CONFIRM (full or partial) ───────────────────────────────────────────────
  const paidAmount: number = body.paid_amount ?? transfer.amount

  if (paidAmount <= 0) {
    return new Response(JSON.stringify({ error: 'paid_amount must be greater than 0' }), {
      status: 400,
      headers: corsHeaders,
    })
  }
  if (paidAmount > transfer.amount) {
    return new Response(JSON.stringify({ error: 'paid_amount cannot exceed the original amount' }), {
      status: 400,
      headers: corsHeaders,
    })
  }

  const isPartial = paidAmount < transfer.amount
  const remainder = Math.round((transfer.amount - paidAmount) * 100) / 100

  const { error: rpcErr } = await supabase.rpc('confirm_transfer_atomic', {
    p_transfer_id: transferId,
    p_paid_amount: paidAmount,
  })

  if (rpcErr) {
    return new Response(JSON.stringify({ error: rpcErr.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  if (isPartial) {
    const { error: insertErr } = await supabase.from('member_transfers').insert({
      family_id: transfer.family_id,
      from_user_id: transfer.from_user_id,
      to_user_id: transfer.to_user_id,
      from_account_id: null,
      to_account_id: null,
      amount: remainder,
      note: transfer.note
        ? `[остаток] ${transfer.note}`
        : `[остаток от #${transferId.slice(0, 8)}]`,
      transfer_type: 'request',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    })

    if (insertErr) {
      return new Response(
        JSON.stringify({
          ok: true,
          status: 'confirmed',
          partial: true,
          paid_amount: paidAmount,
          remainder,
          remainder_transfer_error: insertErr.message,
        }),
        { status: 207, headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ ok: true, status: 'confirmed', partial: true, paid_amount: paidAmount, remainder }),
      { headers: corsHeaders }
    )
  }

  return new Response(JSON.stringify({ ok: true, status: 'confirmed' }), {
    headers: corsHeaders,
  })
})
