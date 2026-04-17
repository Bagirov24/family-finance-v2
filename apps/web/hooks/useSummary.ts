import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export interface MonthlySummary {
  income: number
  expense: number
  balance: number
  savingsRate: number
  dailyBudget: number
  remainingDays: number
}

async function fetchSummary(userId: string, month: number, year: number): Promise<MonthlySummary> {
  const supabase = createClient()
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transactions')
    .select('amount,type')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)

  if (error) throw error

  const income = (data ?? []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = (data ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  const today = new Date()
  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear()
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysPassed = isCurrentMonth ? today.getDate() : daysInMonth
  const remainingDays = isCurrentMonth ? daysInMonth - today.getDate() + 1 : 0
  const dailyBudget = remainingDays > 0 ? Math.max(0, Math.round(balance / remainingDays)) : 0

  return { income, expense, balance, savingsRate, dailyBudget, remainingDays }
}

export function useSummary() {
  const { userId, activePeriod } = useUIStore()
  const { month, year } = activePeriod

  return useQuery({
    queryKey: ['summary', userId, month, year],
    queryFn: () => fetchSummary(userId!, month, year),
    enabled: !!userId,
  })
}
