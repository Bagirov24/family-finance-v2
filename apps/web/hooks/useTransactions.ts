import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { useFamily } from '@/hooks/useFamily'

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
  /**
   * Явный familyId — переопределяет семейный контекст из useFamily().
   * Используется на страницах где familyId уже известен из пропсов/стора.
   * Если не передан — используется family.id текущего пользователя.
   * Solo-пользователь (без семьи) — фильтрация по user_id.
   */
  familyId?: string
  categoryId?: string
  type?: 'expense' | 'income'
  limit?: number
  /**
   * Server-prefetched data to seed the React Query cache.
   * TanStack Query uses this as the initial cache value so no client
   * fetch is made on first render — provided `staleTime` has not elapsed.
   * Must come from a prefetch with the SAME limit/familyId/period params.
   */
  initialData?: Transaction[]
}

// Separate internal type to avoid polluting the public params interface
interface FetchTransactionsParams extends UseTransactionsParams {
  resolvedFamilyId?: string
}

async function fetchTransactions(
  userId: string,
  month: number,
  year: number,
  params?: FetchTransactionsParams
): Promise<Transaction[]> {
  const supabase = createClient()
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = new Date(year, month, 0).toISOString().split('T')[0]

  const familyId = params?.familyId ?? params?.resolvedFamilyId

  let query = supabase
    .from('transactions')
    .select('*, category:categories(name_key,icon,color), account:accounts(name,currency)')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (familyId) {
    // Семейный режим: показываем транзакции всех участников семьи.
    // RLS политика transactions разрешает SELECT по family_id для членов семьи.
    query = query.eq('family_id', familyId)
  } else {
    // Solo режим: пользователь без семьи — только свои транзакции
    query = query.eq('user_id', userId)
  }

  if (params?.categoryId) query = query.eq('category_id', params.categoryId)
  if (params?.type) query = query.eq('type', params.type)
  if (params?.limit) query = query.limit(params.limit)

  const { data, error } = await query
  if (error) throw error
  return data as Transaction[]
}

export function useTransactions(params?: UseTransactionsParams) {
  // Точные селекторы — не подписываемся на весь стор
  const userId = useUIStore(s => s.userId)
  const month = useUIStore(s => s.activePeriod.month)
  const year = useUIStore(s => s.activePeriod.year)

  // Получаем familyId из контекста если не передан явно
  const { family } = useFamily()
  const resolvedFamilyId = params?.familyId ?? family?.id ?? undefined

  const now = new Date()
  const isCurrentPeriod =
    month === now.getMonth() + 1 && year === now.getFullYear()

  const query = useQuery({
    queryKey: [
      'transactions',
      userId,
      month,
      year,
      resolvedFamilyId,
      params?.categoryId,
      params?.type,
      params?.limit ?? null,
    ],
    // C-4: replaced userId! non-null assertion with an explicit type guard.
    // `enabled: !!userId` prevents execution, but TypeScript does not know
    // that invariant — the guard makes it explicit and eliminates the unsafe cast.
    queryFn: () => {
      if (!userId) throw new Error('[useTransactions] userId is required but was null')
      return fetchTransactions(userId, month, year, { ...params, resolvedFamilyId })
    },
    // Ждём пока useFamily() разрешится: не запускаем запрос с неверным ключом
    enabled: !!userId && family !== undefined,
    staleTime: isCurrentPeriod ? 30_000 : 5 * 60_000,
    gcTime: isCurrentPeriod ? 10 * 60_000 : 30 * 60_000,
    // Seed the cache from server-prefetched data.
    // TanStack Query treats this as fresh for the duration of staleTime,
    // so no network request is made on first render.
    ...(params?.initialData ? { initialData: params.initialData } : {}),
  })

  const transactions = query.data ?? []

  // useMemo: пересчёт только при смене query.data, не на каждый рендер
  const { totalIncome, totalExpense } = useMemo(
    () => ({
      totalIncome: transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0),
      totalExpense: transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0),
    }),
    [transactions]
  )

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
      qc.invalidateQueries({ queryKey: ['monthly-summary'] })
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

export function useUpdateTransaction() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTransactionInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', userId] })
    },
  })
}
