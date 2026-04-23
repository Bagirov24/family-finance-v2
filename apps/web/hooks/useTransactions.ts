import { useMemo } from 'react'
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
  // Точные селекторы — компонент не ре-рендерится при изменении sidebarOpen/theme/etc.
  const userId = useUIStore(s => s.userId)
  const month = useUIStore(s => s.activePeriod.month)
  const year = useUIStore(s => s.activePeriod.year)

  const now = new Date()
  const isCurrentPeriod =
    month === now.getMonth() + 1 && year === now.getFullYear()

  const query = useQuery({
    queryKey: ['transactions', userId, month, year, params?.familyId, params?.categoryId, params?.type, params?.limit],
    queryFn: () => fetchTransactions(userId!, month, year, params),
    enabled: !!userId,
    staleTime: isCurrentPeriod ? 30_000 : 5 * 60_000,
    gcTime: isCurrentPeriod ? 10 * 60_000 : 30 * 60_000,
  })

  const transactions = query.data ?? []

  // useMemo: пересчёт только при смене query.data, не на каждый рендер
  const { totalIncome, totalExpense } = useMemo(() => ({
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    totalExpense: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  }), [transactions])

  return { ...query, transactions, totalIncome, totalExpense }
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)

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
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)

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
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', userId] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
