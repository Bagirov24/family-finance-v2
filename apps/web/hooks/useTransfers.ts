import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useTransfers() {
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

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
      return data
    }
  })

  // Realtime: get notified when a transfer targeting this user changes
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
    mutationFn: async (payload: {
      to_user_id: string
      from_account_id: string
      to_account_id: string
      amount: number
      note?: string
      family_id: string
    }) => {
      const { error } = await supabase.from('member_transfers').insert({
        ...payload,
        from_user_id: userId,
        status: 'pending',
        date: new Date().toISOString().split('T')[0]
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transfers'] })
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
            Authorization: `Bearer ${session!.access_token}`
          },
          body: JSON.stringify({ transfer_id, action })
        }
      )
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    }
  })

  const pending = (query.data ?? []).filter(
    t => t.status === 'pending' && t.to_user_id === userId
  )
  const history = (query.data ?? []).filter(t => t.status !== 'pending')

  return {
    pending,
    history,
    allTransfers: query.data ?? [],
    isLoading: query.isLoading,
    userId,
    createTransfer,
    respondTransfer
  }
}
