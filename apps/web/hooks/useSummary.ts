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

export interface UseSummaryResult {
  data: MonthlySummary
  isLoading: boolean
  isPending: boolean
  isError: boolean
}

/**
 * useSummary — без сетевого запроса.
 * Вычисляет сводку через useMemo из кеша useTransactions.
 * Точные Zustand-селекторы — не ре-рендерится при изменении sidebarOpen/theme/etc.
 */
export function useSummary(): UseSummaryResult {
  const month = useUIStore(s => s.activePeriod.month)
  const year  = useUIStore(s => s.activePeriod.year)

  const { isLoading, isPending, isError, totalIncome: income, totalExpense: expense } =
    useTransactions()

  // L-1: typed useMemo callback — TypeScript verifies the returned object
  // satisfies MonthlySummary rather than inferring the shape from the literal.
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
