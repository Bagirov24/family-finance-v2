import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export type TransferStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled'
export type TransferType = 'send' | 'request'

export interface MemberTransfer {
  id: string
  family_id: string | null
  from_user_id: string
  to_user_id: string
  from_account_id: string | null
  to_account_id: string | null
  amount: number
  note: string | null
  status: TransferStatus
  transfer_type: TransferType
  date: string
  confirmed_at: string | null
  created_at: string | null
  from_account?: { name: string; color: string | null; icon: string | null } | null
  to_account?: { name: string; color: string | null; icon: string | null } | null
  from_member?: { display_name: string | null } | null
  to_member?: { display_name: string | null } | null
}

export interface CreateTransferInput {
  to_user_id: string
  from_account_id: string
  to_account_id: string
  amount: number
  note: string
  family_id: string
  transfer_type?: TransferType
}

export interface CreateRequestInput {
  to_user_id: string
  amount: number
  note: string
  family_id: string
}

export function useTransfers() {
  const userId = useUIStore(s => s.userId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['transfers', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('member_transfers')
        .select(`
          *,
          from_account:accounts!from_account_id(name,color,icon),
          to_account:accounts!to_account_id(name,color,icon),
          from_member:family_members!from_user_id(display_name),
          to_member:family_members!to_user_id(display_name)
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as MemberTransfer[]
    }
  })

  const createTransfer = useMutation({
    mutationFn: async (payload: CreateTransferInput) => {
      const supabase = createClient()
      const { error } = await supabase.from('member_transfers').insert({
        ...payload,
        from_user_id: userId,
        transfer_type: payload.transfer_type ?? 'send',
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers', userId] })
  })

  const createRequest = useMutation({
    mutationFn: async (payload: CreateRequestInput) => {
      const supabase = createClient()
      const { error } = await supabase.from('member_transfers').insert({
        family_id: payload.family_id,
        from_user_id: userId,
        to_user_id: payload.to_user_id,
        from_account_id: null,
        to_account_id: null,
        amount: payload.amount,
        note: payload.note,
        transfer_type: 'request',
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers', userId] })
  })

  const respondTransfer = useMutation({
    mutationFn: async ({ transfer_id, action, from_account_id, to_account_id }: {
      transfer_id: string
      action: 'confirmed' | 'declined'
      from_account_id?: string
      to_account_id?: string
    }) => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      // H-2: validate env var before using it in URL construction.
      // Without this check, a missing var produces the URL "undefined/functions/v1/..."
      // which silently fails with a confusing network error.
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')

      // H-1: wrap the fetch in try/catch to distinguish network failures
      // (DNS, timeout, offline) from application-level errors (4xx/5xx).
      // Without this, a network error throws an unhandled Promise rejection
      // that bypasses the mutation's onError handler.
      let res: Response
      try {
        res = await fetch(
          `${supabaseUrl}/functions/v1/confirm-transfer`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ transfer_id, action, from_account_id, to_account_id })
          }
        )
      } catch (networkError) {
        throw new Error(
          `Network error: unable to reach transfer service. ${
            networkError instanceof Error ? networkError.message : String(networkError)
          }`
        )
      }

      if (!res.ok) {
        const body = await res.text().catch(() => res.statusText)
        throw new Error(`Transfer service error ${res.status}: ${body}`)
      }

      return res.json() as Promise<{ success: boolean }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers', userId] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    }
  })

  const cancelTransfer = useMutation({
    mutationFn: async (transfer_id: string) => {
      // Guard replaces the previous userId! non-null assertion.
      if (!userId) throw new Error('userId is required to cancel a transfer')
      const supabase = createClient()
      const { error } = await supabase
        .from('member_transfers')
        .update({ status: 'cancelled' })
        .eq('id', transfer_id)
        .eq('status', 'pending')
        .eq('from_user_id', userId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers', userId] })
  })

  const all = query.data ?? []

  const pending = all.filter(
    t => t.status === 'pending' && t.to_user_id === userId && t.transfer_type === 'send'
  )
  const pendingRequests = all.filter(
    t => t.status === 'pending' && t.to_user_id === userId && t.transfer_type === 'request'
  )
  const outgoingPending = all.filter(
    t => t.status === 'pending' && t.from_user_id === userId
  )
  const history = all.filter(t => t.status !== 'pending')

  return {
    pending,
    pendingRequests,
    outgoingPending,
    history,
    allTransfers: all,
    isLoading: query.isLoading,
    createTransfer,
    createRequest,
    respondTransfer,
    cancelTransfer,
  }
}
