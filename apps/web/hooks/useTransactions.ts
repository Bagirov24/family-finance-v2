import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export interface Transaction {
  id: string
  user_id: string
  family_id: string
  account_id: string
  category_id: string | null
  amount: number
  type: 'income' | 'expense'
  date: string
  note: string | null
  created_at: string
  category?: { name_key: string; icon: string; color: string } | null
  account?: { name: string; currency: string } | null
}

export interface CreateTransactionInput {
  family_id: string
  account_id: string
  category_id?: string
  amount: number
  type: 'income' | 'expense'
  date: string
  note?: string
}

export interface UpdateTransactionInput {
  id: string
  account_id?: string
  category_id?: string | null
  amount?: number
  type?: 'income' | 'expense'
  date?: string
  note?: string | null
}

interface UseTransactionsParams {
  familyId?: string
  categoryId?: string
  type?: 'expense' | 'income'
  limit?: number
}

async function fetchTransactions(
  userId: string,
  month: number,
  year: number,
  params?: UseTransactionsParams
) {
  const supabase = createClient()
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = new Date(year, month, 0).toISOString().split('T')[0]

  let query = supabase
    .from('transactions')
    .select('*, category:categories(name_key,icon,color), account:accounts(name,currency)')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (params?.familyId) query = query.eq('family_id', params.familyId)
  if (params?.categoryId) query = query.eq('category_id', params.categoryId)
  if (params?.type) query = query.eq('type', params.type)
  if (params?.limit) query = query.limit(params.limit)

  const { data, error } = await query
  if (error) throw error
  return data as Transaction[]
}

export function useTransactions(params?: UseTransactionsParams) {
  const { userId, activePeriod } = useUIStore()
  const { month, year } = activePeriod

  const query = useQuery({
    queryKey: ['transactions', userId, month, year, params?.familyId, params?.categoryId, params?.type, params?.limit],
    queryFn: () => fetchTransactions(userId!, month, year, params),
    enabled: !!userId,
  })

  const transactions = query.data ?? []
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return { ...query, transactions, totalIncome, totalExpense }
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  const { userId } = useUIStore()

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
      qc.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  const { userId } = useUIStore()

  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateTransactionInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('transactions')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', userId] })
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
      qc.invalidateQueries({ queryKey: ['accounts', userId] })
    },
  })
}
