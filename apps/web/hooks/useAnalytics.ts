import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useMonthlyTrend(familyId: string, months = 6) {
  return useQuery({
    queryKey: ['monthly-trend', familyId, months],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_income_expense_trend', {
        p_family_id: familyId,
        p_months: months,
      })
      if (error) throw error
      return data as Array<{ month: string; income: number; expense: number }>
    },
  })
}

export function useMonthlySummary(familyId: string, month: number, year: number) {
  return useQuery({
    queryKey: ['monthly-summary', familyId, month, year],
    enabled: !!familyId,
    queryFn: async () => {
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
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_weekday_spending', {
        p_family_id: familyId,
      })
      if (error) throw error
      return data as Array<{ weekday: number; avg_amount: number }>
    },
  })
}

export function useCategoryBreakdown(familyId: string, month: number, year: number) {
  return useQuery({
    queryKey: ['category-breakdown', familyId, month, year],
    enabled: !!familyId,
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate   = `${year}-${String(month).padStart(2, '0')}-31`
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, category:categories(name_key, icon, color)')
        .eq('family_id', familyId)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate)
      if (error) throw error

      const map: Record<string, { name_key: string; icon: string; color: string; total: number }> = {}
      for (const t of data ?? []) {
        const cat = t.category as { name_key: string; icon: string; color: string } | null
        if (!cat) continue
        if (!map[cat.name_key]) map[cat.name_key] = { ...cat, total: 0 }
        map[cat.name_key].total += Number(t.amount)
      }
      return Object.values(map).sort((a, b) => b.total - a.total)
    },
  })
}
