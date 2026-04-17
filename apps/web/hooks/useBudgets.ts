import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useBudgets(month: number, year: number) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['budgets', month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, category:categories(id, name_key, icon, color)')
        .eq('period_month', month)
        .eq('period_year', year)
      if (error) throw error
      return data
    }
  })

  // Get actual spending per category for the month
  const spendingQuery = useQuery({
    queryKey: ['budget-spending', month, year],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`
      const { data, error } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate)
      if (error) throw error
      return data
    }
  })

  const spendingMap = (spendingQuery.data ?? []).reduce<Record<string, number>>((acc, t) => {
    if (t.category_id) acc[t.category_id] = (acc[t.category_id] ?? 0) + Number(t.amount)
    return acc
  }, {})

  const budgetsWithSpending = (query.data ?? []).map(b => ({
    ...b,
    spent: spendingMap[b.category_id] ?? 0,
    remaining: Number(b.amount) - (spendingMap[b.category_id] ?? 0),
    percent: Math.min(100, Math.round(((spendingMap[b.category_id] ?? 0) / Number(b.amount)) * 100))
  }))

  const upsertBudget = useMutation({
    mutationFn: async (payload: {
      family_id: string; category_id: string;
      amount: number; period_month: number; period_year: number
    }) => {
      const { error } = await supabase
        .from('budgets')
        .upsert(payload, { onConflict: 'family_id,category_id,period_month,period_year' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
  })

  return {
    budgets: budgetsWithSpending,
    isLoading: query.isLoading,
    upsertBudget
  }
}
