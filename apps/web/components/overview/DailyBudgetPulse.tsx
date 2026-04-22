'use client'
import { useTranslations } from 'next-intl'
import { useBudgets } from '@/hooks/useBudgets'
import { useFamily } from '@/hooks/useFamily'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function DailyBudgetPulse() {
  const t = useTranslations('overview')
  const { budgets, isLoading } = useBudgets()
  const { family } = useFamily()
  const currency = family?.currency ?? 'RUB'

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - now.getDate() + 1

  // Fix: only count active budgets
  const activeBudgets = budgets.filter(b => {
    const today = now
    const inCurrentMonth =
      b.period_month === today.getMonth() + 1 &&
      b.period_year === today.getFullYear()
    return inCurrentMonth
  })

  const totalBudget = activeBudgets.reduce((s, b) => s + Number(b.amount ?? 0), 0)
  const totalRemaining = activeBudgets.reduce((s, b) => s + Math.max(0, b.remaining), 0)
  const dailyBudget = daysLeft > 0 ? totalRemaining / daysLeft : 0

  const idealDaily = totalBudget > 0 ? totalBudget / daysInMonth : 0
  const ratio = idealDaily > 0 ? dailyBudget / idealDaily : 1

  if (isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />
  if (!activeBudgets.length) return null

  const status = totalRemaining <= 0 ? 'danger' : ratio < 0.5 ? 'warning' : 'ok'

  return (
    <div
      className={cn(
        'rounded-2xl p-4 border transition-colors',
        status === 'ok'
          ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
          : status === 'warning'
            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800'
            : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
      )}
    >
      <p className="text-xs font-medium text-muted-foreground mb-1">{t('daily_budget')}</p>
      <p
        className={cn(
          'text-2xl font-bold tabular-nums break-all',
          status === 'ok'
            ? 'text-green-700 dark:text-green-400'
            : status === 'warning'
              ? 'text-yellow-700 dark:text-yellow-400'
              : 'text-red-700 dark:text-red-400'
        )}
      >
        {totalRemaining <= 0 ? formatAmount(0, currency) : formatAmount(dailyBudget, currency)}
      </p>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
        {t('daily_budget_left')} · {t('days_left', { count: daysLeft })}
      </p>
    </div>
  )
}
