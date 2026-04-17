import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  amount: number
  type: 'income' | 'expense'
  date: string
  comment: string | null
  created_at: string
  categories?: { name: string; emoji: string; color: string } | null
  accounts?: { name: string; currency: string } | null
}

export interface CreateTransactionInput {
  account_id: string
  category_id?: string
  amount: number
  type: 'income' | 'expense'
  date: string
  comment?: string
}

async function fetchTransactions(userId: string, month: number, year: number) {
  const supabase = createClient()
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(name,emoji,color), accounts(name,currency)')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Transaction[]
}

export function useTransactions() {
  const { userId, activePeriod } = useUIStore()
  const { month, year } = activePeriod

  return useQuery({
    queryKey: ['transactions', userId, month, year],
    queryFn: () => fetchTransactions(userId!, month, year),
    enabled: !!userId,
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  const { userId, activePeriod } = useUIStore()

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...input, user_id: userId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', userId] })
      qc.invalidateQueries({ queryKey: ['summary', userId] })
      qc.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  const { userId } = useUIStore()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', userId] })
      qc.invalidateQueries({ queryKey: ['summary', userId] })
      qc.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })
}
