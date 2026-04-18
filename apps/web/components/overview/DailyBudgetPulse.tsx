'use client'
import { useTranslations } from 'next-intl'
import { useBudgets } from '@/hooks/useBudgets'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'

export function DailyBudgetPulse() {
  const t = useTranslations('overview')
  const { budgets, isLoading } = useBudgets()

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - now.getDate() + 1

  const totalRemaining = budgets.reduce((s, b) => s + Math.max(0, b.remaining), 0)
  const dailyBudget = daysLeft > 0 ? totalRemaining / daysLeft : 0

  if (isLoading || !budgets.length) return null

  const status = dailyBudget > 0 ? 'ok' : 'danger'

  return (
    <div className={cn(
      'rounded-2xl p-4 border transition-colors',
      status === 'ok'
        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
        : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
    )}>
      <p className="text-xs font-medium text-muted-foreground mb-1">{t('daily_budget')}</p>
      <p className={cn(
        'text-2xl font-bold tabular-nums',
        status === 'ok' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
      )}>
        {formatAmount(dailyBudget)}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {t('daily_budget_left')} · {t('days_left', { count: daysLeft })}
      </p>
    </div>
  )
}
