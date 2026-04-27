import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export type TransferStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled'
export type TransferType = 'send' | 'request' | 'recurring'

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
  recurring_transfer_id: string | null
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

export interface RespondTransferInput {
  transfer_id: string
  action: 'confirmed' | 'declined'
  from_account_id?: string
  to_account_id?: string
  /** Для частичной оплаты request-а. Если не передан — оплачивается полная сумма. */
  paid_amount?: number
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
    mutationFn: async (payload: CreateTransferInput): Promise<void> => {
      if (!userId) throw new Error('[createTransfer] userId is required')
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
    mutationFn: async (payload: CreateRequestInput): Promise<void> => {
      if (!userId) throw new Error('[createRequest] userId is required')
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
    mutationFn: async ({
      transfer_id,
      action,
      from_account_id,
      to_account_id,
      paid_amount,
    }: RespondTransferInput): Promise<{ success: boolean }> => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')

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
            body: JSON.stringify({ transfer_id, action, from_account_id, to_account_id, paid_amount })
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
    mutationFn: async (transfer_id: string): Promise<void> => {
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
  const pendingRecurring = all.filter(
    t => t.status === 'pending' && t.to_user_id === userId && t.transfer_type === 'recurring'
  )
  const outgoingPending = all.filter(
    t => t.status === 'pending' && t.from_user_id === userId
  )
  const history = all.filter(t => t.status !== 'pending')

  return {
    pending,
    pendingRequests,
    pendingRecurring,
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