'use client'
import { useTranslations } from 'next-intl'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface Budget {
  id: string
  amount: number | string
  spent: number
  remaining: number
  percent: number
  category: { name_key: string; icon: string; color: string } | null
}

export function BudgetCard({ budget: b }: { budget: Budget }) {
  const t = useTranslations('budgets')
  const isOver = b.percent >= 100
  const isWarning = b.percent >= 80 && b.percent < 100

  const barColor = isOver
    ? 'bg-red-500'
    : isWarning
    ? 'bg-yellow-500'
    : 'bg-primary'

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{b.category?.icon ?? '💸'}</span>
          <span className="font-medium text-sm">
            {b.category ? t(`categories.${b.category.name_key}`, { defaultValue: b.category.name_key }) : t('other')}
          </span>
        </div>
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full',
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
          style={{ width: `${b.percent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{t('spent')}: <span className="text-foreground font-medium">{formatAmount(b.spent)}</span></span>
        <span>{t('of')} {formatAmount(Number(b.amount))}</span>
      </div>

      {isOver && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {t('overspent', { amount: formatAmount(Math.abs(b.remaining)) })}
        </p>
      )}
    </div>
  )
}
