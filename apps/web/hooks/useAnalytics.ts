import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useTransactions } from '@/hooks/useTransactions'

export function useMonthlyTrend(familyId: string, months = 6) {
  return useQuery({
    queryKey: ['monthly-trend', familyId, months],
    enabled: !!familyId,
    staleTime: 60_000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_income_expense_trend', {
        p_family_id: familyId,
        p_months: months,
      })
      if (error) throw error
      return data as Array<{ month: string; income: number; expense: number }>
    },
  })
}

interface UseMonthlySummaryOptions {
  initialData?: { total_income: number; total_expense: number; net: number; top_category: string } | null
}

export function useMonthlySummary(
  familyId: string,
  month: number,
  year: number,
  { initialData }: UseMonthlySummaryOptions = {}
) {
  return useQuery({
    queryKey: ['monthly-summary', familyId, month, year],
    enabled: !!familyId,
    staleTime: 60_000,
    initialData: initialData ?? undefined,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_monthly_summary', {
        p_family_id: familyId,
        p_month: month,
        p_year: year,
      })
      if (error) throw error
      return data?.[0] as { total_income: number; total_expense: number; net: number; top_category: string } | null
    },
  })
}

export function useWeekdaySpending(familyId: string) {
  return useQuery({
    queryKey: ['weekday-spending', familyId],
    enabled: !!familyId,
    staleTime: 300_000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_weekday_spending', {
        p_family_id: familyId,
      })
      if (error) throw error
      return data as Array<{ weekday: number; avg_amount: number }>
    },
  })
}

/**
 * Вместо отдельного Supabase-запроса переиспользует транзакции из кеша
 * useTransactions (тот же queryKey ['transactions', ...]) — нулевой RTT.
 */
export function useCategoryBreakdown(familyId: string, month: number, year: number) {
  const { transactions } = useTransactions({ familyId })

  const breakdown = useMemo(() => {
    const map: Record<string, { name_key: string; icon: string; color: string; total: number }> = {}

    for (const t of transactions) {
      if (t.type !== 'expense') continue
      const cat = t.category
      if (!cat) continue
      if (!map[cat.name_key]) map[cat.name_key] = { ...cat, total: 0 }
      map[cat.name_key].total += Number(t.amount)
    }

    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [transactions])

  return { data: breakdown, isLoading: false }
}
