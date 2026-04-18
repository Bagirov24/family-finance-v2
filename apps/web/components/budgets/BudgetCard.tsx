'use client'
import { useTranslations } from 'next-intl'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { BudgetView } from '@/hooks/useBudgets'

export function BudgetCard({ budget: b }: { budget: BudgetView }) {
  const t = useTranslations('budgets')
  const tc = useTranslations('categories')
  const isOver = b.percent >= 100
  const isWarning = b.percent >= 80 && b.percent < 100

  const barColor = isOver
    ? 'bg-red-500'
    : isWarning
      ? 'bg-yellow-500'
      : 'bg-primary'

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{b.category?.icon ?? '💸'}</span>
          <span className="font-medium text-sm truncate">
            {b.category ? tc(b.category.name_key, { defaultValue: b.category.name_key }) : t('other')}
          </span>
        </div>
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
          isOver ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                 : isWarning ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                              : 'bg-muted text-muted-foreground'
        )}>
          {b.percent}%
        </span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.min(b.percent, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground tabular-nums gap-2">
        <span>{t('spent')}: <span className="text-foreground font-medium">{formatAmount(b.spent)}</span></span>
        <span>{t('of')} {formatAmount(b.amount)}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        {isOver
          ? t('overspent', { amount: formatAmount(Math.abs(b.remaining)) })
          : `${t('left')}: ${formatAmount(Math.max(0, b.remaining))}`}
      </p>
    </div>
  )
}
