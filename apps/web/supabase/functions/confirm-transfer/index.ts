import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const { transferId, action } = await req.json() as { transferId: string; action: 'confirm' | 'decline' }

  if (!transferId || !action) {
    return new Response(JSON.stringify({ error: 'Missing transferId or action' }), { status: 400 })
  }

  // Fetch transfer
  const { data: transfer, error: fetchErr } = await supabase
    .from('member_transfers')
    .select('*')
    .eq('id', transferId)
    .single()

  if (fetchErr || !transfer) {
    return new Response(JSON.stringify({ error: 'Transfer not found' }), { status: 404 })
  }

  if (transfer.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Transfer already processed' }), { status: 409 })
  }

  if (action === 'decline') {
    await supabase.from('member_transfers').update({ status: 'declined' }).eq('id', transferId)
    return new Response(JSON.stringify({ ok: true, status: 'declined' }))
  }

  // Confirm: call atomic DB function
  const { error: rpcErr } = await supabase.rpc('confirm_transfer_atomic', {
    p_transfer_id: transferId,
  })

  if (rpcErr) {
    return new Response(JSON.stringify({ error: rpcErr.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, status: 'confirmed' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
