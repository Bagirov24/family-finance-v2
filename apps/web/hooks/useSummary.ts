import { useMemo } from 'react'
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
 * useSummary — переиспользует кеш useTransactions.
 *
 * Раньше делал отдельный SELECT amount,type FROM transactions — дублируя
 * запрос, который useTransactions уже выполняет. Теперь вычисляет summary
 * через useMemo из уже полученных данных — нулевой RTT, нет лишнего запроса.
 */
export function useSummary() {
  const { transactions, isLoading, isPending, isError, totalIncome: income, totalExpense: expense } =
    useTransactions()

  const data = useMemo((): MonthlySummary => {
    const balance = income - expense
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

    const today = new Date()
    const now = new Date()
    // activePeriod доступен через useTransactions внутри → берём из транзакций
    // Для определения текущего месяца смотрим на дату первой транзакции или now
    const firstTx = transactions[0]
    const txDate = firstTx ? new Date(firstTx.date) : now
    const month = txDate.getMonth() + 1
    const year = txDate.getFullYear()

    const isCurrentMonth =
      month === today.getMonth() + 1 && year === today.getFullYear()
    const daysInMonth = new Date(year, month, 0).getDate()
    const remainingDays = isCurrentMonth ? daysInMonth - today.getDate() + 1 : 0
    const dailyBudget =
      remainingDays > 0 ? Math.max(0, Math.round(balance / remainingDays)) : 0

    return { income, expense, balance, savingsRate, dailyBudget, remainingDays }
  }, [transactions, income, expense])

  return { data, isLoading, isPending, isError }
}
