import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export interface MemberTransfer {
  id: string
  family_id: string | null
  from_user_id: string
  to_user_id: string
  from_account_id: string | null
  to_account_id: string | null
  amount: number
  note: string | null
  status: 'pending' | 'confirmed' | 'declined'
  date: string
  confirmed_at: string | null
  created_at: string
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
  note?: string
  family_id: string
}

export function useTransfers() {
  const { userId } = useUIStore()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['transfers', userId],
    enabled: !!userId,
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

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel('transfers-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'member_transfers',
        filter: `to_user_id=eq.${userId}`
      }, () => {
        qc.invalidateQueries({ queryKey: ['transfers'] })
        qc.invalidateQueries({ queryKey: ['accounts'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, qc])

  const createTransfer = useMutation({
    mutationFn: async (payload: CreateTransferInput) => {
      const supabase = createClient()
      const { error } = await supabase.from('member_transfers').insert({
        ...payload,
        from_user_id: userId,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] })
  })

  const respondTransfer = useMutation({
    mutationFn: async ({ transfer_id, action }: {
      transfer_id: string
      action: 'confirmed' | 'declined'
    }) => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/confirm-transfer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session!.access_token}`
          },
          body: JSON.stringify({ transfer_id, action })
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

  const all = query.data ?? []
  // Pending transfers incoming to the current user
  const pending = all.filter(t => t.status === 'pending' && t.to_user_id === userId)
  // All non-pending + outgoing pending sent by me
  const history = all.filter(t => t.status !== 'pending' || t.from_user_id === userId)

  return {
    pending,
    history,
    allTransfers: all,
    isLoading: query.isLoading,
    createTransfer,
    respondTransfer,
  }
}
