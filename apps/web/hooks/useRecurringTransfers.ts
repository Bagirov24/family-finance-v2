import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export type RecurrenceRule = 'daily' | 'weekly' | 'monthly'

export interface RecurringTransfer {
  id: string
  family_id: string
  from_user_id: string
  to_user_id: string
  from_account_id: string | null
  to_account_id: string | null
  amount: number
  note: string | null
  recurrence_rule: RecurrenceRule
  next_run_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  // joined
  from_account?: { name: string; icon: string | null } | null
  to_account?: { name: string; icon: string | null } | null
  to_member?: { display_name: string | null } | null
  from_member?: { display_name: string | null } | null
}

export interface CreateRecurringInput {
  family_id: string
  to_user_id: string
  from_account_id: string
  to_account_id: string
  amount: number
  note: string
  recurrence_rule: RecurrenceRule
  /** Первый запуск. Если не указан — сегодня. */
  next_run_at?: string
}

export function useRecurringTransfers(): {
  templates: RecurringTransfer[]
  isLoading: boolean
  create: ReturnType<typeof useMutation<void, Error, CreateRecurringInput>>
  toggle: ReturnType<typeof useMutation<void, Error, { id: string; is_active: boolean }>>
  remove: ReturnType<typeof useMutation<void, Error, string>>
} {
  const userId = useUIStore(s => s.userId)
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['recurring_transfers', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('recurring_transfers')
        .select(`
          *,
          from_account:accounts!from_account_id(name,icon),
          to_account:accounts!to_account_id(name,icon),
          to_member:family_members!to_user_id(display_name),
          from_member:family_members!from_user_id(display_name)
        `)
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as RecurringTransfer[]
    },
  })

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['recurring_transfers', userId] })

  const create = useMutation<void, Error, CreateRecurringInput>({
    mutationFn: async (payload) => {
      const supabase = createClient()
      const { error } = await supabase.from('recurring_transfers').insert({
        ...payload,
        from_user_id: userId,
        next_run_at: payload.next_run_at ?? new Date().toISOString().split('T')[0],
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const toggle = useMutation<void, Error, { id: string; is_active: boolean }>({
    mutationFn: async ({ id, is_active }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('recurring_transfers')
        .update({ is_active })
        .eq('id', id)
        .eq('from_user_id', userId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('recurring_transfers')
        .delete()
        .eq('id', id)
        .eq('from_user_id', userId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    create,
    toggle,
    remove,
  }
}
