import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { useFamily } from '@/hooks/useFamily'

export interface BudgetRow {
  id: string
  family_id: string | null
  category_id: string | null
  amount: number
  period_month: number
  period_year: number
  categories: {
    name_key: string
    icon: string
    color: string
  } | null
}

export interface BudgetView {
  id: string
  family_id: string | null
  category_id: string | null
  amount: number
  period_month: number
  period_year: number
  spent: number
  remaining: number
  percent: number
  displayPercent: number
  category: {
    name_key: string
    icon: string
    color: string
  } | null
}

async function fetchBudgets(familyId: string, month: number, year: number): Promise<BudgetView[]> {
  if (!familyId) return []

  const supabase = createClient()
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = new Date(year, month, 0).toISOString().split('T')[0]

  const [{ data: budgets, error: bErr }, { data: txs, error: tErr }] = await Promise.all([
    supabase
      .from('budgets')
      .select('id,family_id,category_id,amount,period_month,period_year,categories(name_key,icon,color)')
      .eq('family_id', familyId)
      .eq('period_month', month)
      .eq('period_year', year),
    supabase
      .from('transactions')
      .select('amount,category_id')
      .eq('family_id', familyId)
      .eq('type', 'expense')
      .gte('date', from)
      .lte('date', to),
  ])

  if (bErr) throw bErr
  if (tErr) throw tErr

  const spentMap: Record<string, number> = {}
  ;(txs ?? []).forEach(t => {
    if (t.category_id) {
      spentMap[t.category_id] = (spentMap[t.category_id] ?? 0) + Number(t.amount)
    }
  })

  return (budgets ?? []).map((b: BudgetRow) => {
    const amount = Number(b.amount)
    const spent = Number(spentMap[b.category_id ?? ''] ?? 0)
    const remaining = amount - spent
    const rawPercent = amount > 0 ? Math.round((spent / amount) * 100) : 0
    const displayPercent = Math.min(100, rawPercent)

    return {
      id: b.id,
      family_id: b.family_id,
      category_id: b.category_id,
      amount,
      period_month: b.period_month,
      period_year: b.period_year,
      spent,
      remaining,
      percent: rawPercent,
      displayPercent,
      category: b.categories
        ? { name_key: b.categories.name_key, icon: b.categories.icon, color: b.categories.color }
        : null,
    } satisfies BudgetView
  })
}

export function useBudgets() {
  const month = useUIStore(s => s.activePeriod.month)
  const year  = useUIStore(s => s.activePeriod.year)
  const { family } = useFamily()

  const now = new Date()
  const isCurrentPeriod =
    month === now.getMonth() + 1 && year === now.getFullYear()

  const query = useQuery({
    queryKey: ['budgets', family?.id, month, year],
    // H-7: type guard replaces the implicit assumption that family?.id is
    // always truthy when enabled fires. fetchBudgets already has an early
    // return for falsy familyId, but this guard makes the invariant explicit
    // and produces a descriptive error if the guard ever trips.
    queryFn: () => {
      if (!family?.id) throw new Error('[useBudgets] family.id is required')
      return fetchBudgets(family.id, month, year)
    },
    enabled: !!family?.id,
    staleTime: isCurrentPeriod ? 30_000 : 5 * 60_000,
    gcTime: isCurrentPeriod ? 10 * 60_000 : 30 * 60_000,
  })

  return { ...query, budgets: query.data ?? [] }
}

export function useUpsertBudget() {
  const qc = useQueryClient()
  const month  = useUIStore(s => s.activePeriod.month)
  const year   = useUIStore(s => s.activePeriod.year)
  const { family } = useFamily()

  return useMutation({
    mutationFn: async (input: { category_id: string; amount: number }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          {
            family_id: family?.id,
            category_id: input.category_id,
            amount: input.amount,
            period_month: month,
            period_year: year,
          },
          { onConflict: 'family_id,category_id,period_month,period_year' }
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    // H-5: scoped invalidation — only the current family+period slice is
    // invalidated. The previous broad ['budgets'] key would refetch ALL cached
    // periods (including historical ones) on every upsert.
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['budgets', family?.id, month, year] }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  const month  = useUIStore(s => s.activePeriod.month)
  const year   = useUIStore(s => s.activePeriod.year)
  const { family } = useFamily()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw error
    },
    // H-5: same as upsert — scope to current family+period
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['budgets', family?.id, month, year] }),
  })
}
