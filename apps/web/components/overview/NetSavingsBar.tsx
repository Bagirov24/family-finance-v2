'use client'
import { useTranslations } from 'next-intl'
import { useMonthlySummary } from '@/hooks/useAnalytics'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export function NetSavingsBar() {
  const t = useTranslations('overview')
  const { family } = useFamily()
  const { activePeriod } = useUIStore()
  const currency = family?.currency ?? 'RUB'

  const { data: summary, isLoading } = useMonthlySummary(
    family?.id ?? '',
    activePeriod.month,
    activePeriod.year
  )

  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      </div>
    )
  }

  if (!summary) return null

  const income = summary.total_income
  const expense = summary.total_expense
  const net = income - expense
  // Процент расходов от доходов (0–100). Если доходов нет — 100%
  const expensePct = income > 0 ? Math.min((expense / income) * 100, 100) : 100
  const saved = net > 0

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      {/* Заголовок + чистые сбережения */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{t('net_savings')}</p>
        <p className={cn(
          'text-sm font-bold tabular-nums',
          saved ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
        )}>
          {net >= 0 ? '+' : ''}{formatAmount(net, currency)}
        </p>
      </div>

      {/* Прогресс-бар: расходы / доходы */}
      <div className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            expensePct >= 100
              ? 'bg-destructive'
              : expensePct >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
          )}
          style={{ width: `${expensePct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(expensePct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('expense_ratio')}
        />
      </div>

      {/* Доходы и расходы по краям */}
      <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
        <span>
          <span className="text-foreground font-medium">{formatAmount(expense, currency)}</span>
          {' '}{t('spent')}
        </span>
        <span>
          {t('of')}{' '}
          <span className="text-foreground font-medium">{formatAmount(income, currency)}</span>
        </span>
      </div>
    </div>
  )
}
