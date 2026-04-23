import { useMemo } from 'react'
import { useUIStore } from '@/store/ui.store'
import { useTransactions } from '@/hooks/useTransactions'

export interface MonthlySummary {
  income: number
  expense: number
  balance: number
  savingsRate: number
  dailyBudget: number
  remainingDays: number
}

/**
 * useSummary — без сетевого запроса.
 * Вычисляет сводку через useMemo из кеша useTransactions.
 * month/year берётся явно из activePeriod — корректно даже при пустом списке транзакций.
 */
export function useSummary() {
  const { activePeriod } = useUIStore()
  const { month, year } = activePeriod

  const { isLoading, isPending, isError, totalIncome: income, totalExpense: expense } =
    useTransactions()

  const data = useMemo((): MonthlySummary => {
    const balance = income - expense
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

    const today = new Date()
    const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear()
    const daysInMonth = new Date(year, month, 0).getDate()
    const remainingDays = isCurrentMonth ? daysInMonth - today.getDate() + 1 : 0
    const dailyBudget = remainingDays > 0 ? Math.max(0, Math.round(balance / remainingDays)) : 0

    return { income, expense, balance, savingsRate, dailyBudget, remainingDays }
  }, [income, expense, month, year])

  return { data, isLoading, isPending, isError }
}
