import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

const supabase = createClient()

export interface Transfer {
  id: string
  family_id: string | null
  from_user_id: string
  to_user_id: string
  from_account_id: string | null
  to_account_id: string | null
  amount: number | string
  note: string | null
  status: 'pending' | 'confirmed' | 'declined'
  date: string
  confirmed_at: string | null
  created_at: string
  from_account?: { name: string; color: string; icon: string } | null
  to_account?: { name: string; color: string; icon: string } | null
}

export interface CreateTransferInput {
  family_id: string
  to_user_id: string
  from_account_id: string
  to_account_id: string
  amount: number
  note?: string
}

export function useTransfers() {
  const { userId } = useUIStore()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['transfers', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_transfers')
        .select(`
          *,
          from_account:accounts!from_account_id(name, color, icon),
          to_account:accounts!to_account_id(name, color, icon)
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as Transfer[]
    }
  })

  // Realtime: invalidate when transfer targeting this user changes
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('transfers-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'member_transfers',
        filter: `to_user_id=eq.${userId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['transfers'] })
        queryClient.invalidateQueries({ queryKey: ['accounts'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, queryClient])

  const createTransfer = useMutation({
    mutationFn: async (payload: CreateTransferInput) => {
      const { error } = await supabase.from('member_transfers').insert({
        ...payload,
        from_user_id: userId,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] }),
  })

  const respondTransfer = useMutation({
    mutationFn: async ({ transfer_id, action }: {
      transfer_id: string
      action: 'confirmed' | 'declined'
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/confirm-transfer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session!.access_token}`,
          },
          body: JSON.stringify({ transfer_id, action }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const all = query.data ?? []
  const pending = all.filter(t => t.status === 'pending' && t.to_user_id === userId)
  const history = all.filter(t => t.status !== 'pending')

  return {
    pending,
    history,
    allTransfers: all,
    isLoading: query.isLoading,
    userId,
    createTransfer,
    respondTransfer,
  }
}
