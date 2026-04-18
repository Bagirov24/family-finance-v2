'use client'
import { useTranslations } from 'next-intl'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'
import type { GoalView } from '@/hooks/useGoals'

interface Props {
  goal: GoalView
  onContribute?: (id: string) => void
}

export function GoalCard({ goal: g, onContribute }: Props) {
  const t = useTranslations('goals')

  return (
    <div className={cn(
      'rounded-2xl border bg-card p-4 space-y-3 relative overflow-hidden',
      g.completed && 'border-green-300 dark:border-green-700'
    )}>
      {g.completed && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 size={20} className="text-green-500" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-2xl">{g.icon ?? '🎯'}</span>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{g.name}</p>
          {g.deadline && (
            <p className="text-xs text-muted-foreground">{t('deadline')}: {g.deadline}</p>
          )}
        </div>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(g.percent, 100)}%`,
            backgroundColor: g.color ?? 'var(--primary)'
          }}
        />
      </div>

      <div className="flex justify-between text-xs tabular-nums">
        <span className="text-muted-foreground">
          {formatAmount(g.current_amount)} / {formatAmount(g.target_amount)}
        </span>
        <span className="font-medium">{g.percent}%</span>
      </div>

      {!g.completed && g.monthsLeft !== null && (
        <p className="text-xs text-muted-foreground">
          {t('monthsLeft', { count: g.monthsLeft })}
        </p>
      )}

      {!g.completed && onContribute && (
        <button
          type="button"
          onClick={() => onContribute(g.id)}
          className="w-full text-sm py-1.5 rounded-xl border border-primary text-primary hover:bg-primary hover:text-white transition-colors font-medium"
        >
          + {t('contribute')}
        </button>
      )}
    </div>
  )
}
