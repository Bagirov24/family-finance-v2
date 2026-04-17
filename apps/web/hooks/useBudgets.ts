import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  spent?: number
  categories?: { name: string; emoji: string; color: string }
}

async function fetchBudgets(userId: string, month: number, year: number) {
  const supabase = createClient()

  const [{ data: budgets, error: bErr }, { data: txs, error: tErr }] = await Promise.all([
    supabase
      .from('budgets')
      .select('*, categories(name,emoji,color)')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year),
    supabase
      .from('transactions')
      .select('amount,category_id')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lte('date', new Date(year, month, 0).toISOString().split('T')[0]),
  ])

  if (bErr) throw bErr
  if (tErr) throw tErr

  const spentMap: Record<string, number> = {}
  ;(txs ?? []).forEach(t => {
    if (t.category_id) spentMap[t.category_id] = (spentMap[t.category_id] ?? 0) + t.amount
  })

  return (budgets ?? []).map(b => ({ ...b, spent: spentMap[b.category_id] ?? 0 })) as Budget[]
}

export function useBudgets() {
  const { userId, activePeriod } = useUIStore()
  const { month, year } = activePeriod

  return useQuery({
    queryKey: ['budgets', userId, month, year],
    queryFn: () => fetchBudgets(userId!, month, year),
    enabled: !!userId,
  })
}

export function useUpsertBudget() {
  const qc = useQueryClient()
  const { userId, activePeriod } = useUIStore()

  return useMutation({
    mutationFn: async (input: { category_id: string; amount: number }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('budgets')
        .upsert({
          user_id: userId,
          month: activePeriod.month,
          year: activePeriod.year,
          ...input,
        }, { onConflict: 'user_id,category_id,month,year' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets', userId] }),
  })
}
