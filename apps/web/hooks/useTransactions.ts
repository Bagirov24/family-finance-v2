import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface CreateTransactionPayload {
  family_id: string
  account_id: string
  category_id?: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  note?: string
  date?: string
  source?: 'manual' | 'vehicle' | 'recurring'
  vehicle_id?: string
  cashback_card_id?: string
  cashback_category_id?: string
  cashback_earned_rub?: number
}

export function useTransactions(filters?: {
  type?: 'income' | 'expense'
  category_id?: string
  from?: string
  to?: string
  limit?: number
}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(id, name_key, icon, color),
          account:accounts(id, name, color, icon)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters?.type) q = q.eq('type', filters.type)
      if (filters?.category_id) q = q.eq('category_id', filters.category_id)
      if (filters?.from) q = q.gte('date', filters.from)
      if (filters?.to) q = q.lte('date', filters.to)
      if (filters?.limit) q = q.limit(filters.limit)

      const { data, error } = await q
      if (error) throw error
      return data
    }
  })

  const totalIncome = (query.data ?? [])
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)

  const totalExpense = (query.data ?? [])
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)

  const create = useMutation({
    mutationFn: async (payload: CreateTransactionPayload) => {
      const { error } = await supabase.from('transactions').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    }
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  })

  return {
    transactions: query.data ?? [],
    totalIncome,
    totalExpense,
    isLoading: query.isLoading,
    create,
    remove
  }
}
