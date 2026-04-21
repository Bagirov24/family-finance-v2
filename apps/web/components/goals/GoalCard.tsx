'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Trash2, CheckCircle2 } from 'lucide-react'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { GoalView } from '@/hooks/useGoals'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

interface Props {
  goal: GoalView
  onContribute?: (id: string) => void
  onDelete?: (id: string) => void
  isDeleting?: boolean
}

export function GoalCard({ goal: g, onContribute, onDelete, isDeleting = false }: Props) {
  const t = useTranslations('goals')
  const tc = useTranslations('common')
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <div className={cn(
        'rounded-2xl border bg-card p-4 space-y-3 relative overflow-hidden',
        g.completed && 'border-green-300 dark:border-green-700'
      )}>
        {g.completed && (
          <div className="absolute top-3 right-3">
            <CheckCircle2 size={20} className="text-green-500" />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{g.icon ?? '\uD83C\uDFAF'}</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{g.name}</p>
              {g.deadline && (
                <p className="text-xs text-muted-foreground">{t('deadline')}: {g.deadline}</p>
              )}
            </div>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0"
              aria-label={tc('delete')}
            >
              <Trash2 size={14} />
            </button>
          )}
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

      {onDelete && (
        <DeleteConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t('deleteTitle')}
          description={t('deleteDescription')}
          confirmLabel={tc('delete')}
          cancelLabel={tc('cancel')}
          onConfirm={() => {
            onDelete(g.id)
            setDeleteOpen(false)
          }}
          isLoading={isDeleting}
        />
      )}
    </>
  )
}
