import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
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
  const { userId } = useUIStore()
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

  // Realtime: слушаем только ВХОДЯЩИЕ события (to_user_id === me).
  // Исходящие (from_user_id === me) игнорируем — onSuccess мутации
  // уже вызвал invalidateQueries, двойной рефетч не нужен.
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    const invalidateIncoming = () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    }

    const channel = supabase
      .channel(`transfers-incoming:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'member_transfers',
        filter: `to_user_id=eq.${userId}`,
      }, invalidateIncoming)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, qc])

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] })
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] })
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

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/confirm-transfer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ transfer_id, action, from_account_id, to_account_id })
        }
      )
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    }
  })

  const cancelTransfer = useMutation({
    mutationFn: async (transfer_id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('member_transfers')
        .update({ status: 'cancelled' })
        .eq('id', transfer_id)
        .eq('status', 'pending')
        .eq('from_user_id', userId!)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] })
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
