'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { BudgetView } from '@/hooks/useBudgets'
import { useDeleteBudget } from '@/hooks/useBudgets'
import { EditBudgetModal } from './EditBudgetModal'

export function BudgetCard({ budget: b }: { budget: BudgetView }) {
  const t = useTranslations('budgets')
  const tcat = useTranslations('categories')
  const tc = useTranslations('common')
  const { mutate: deleteBudget, isPending: isDeleting } = useDeleteBudget()
  const [editOpen, setEditOpen] = useState(false)

  const isOver = b.percent >= 100
  const isWarning = b.percent >= 80 && b.percent < 100

  const barColor = isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-primary'

  function handleDelete() {
    deleteBudget(b.id, {
      onError: () => toast.error(tc('error')),
    })
  }

  return (
    <>
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{b.category?.icon ?? '💸'}</span>
            <span className="font-medium text-sm truncate">
              {b.category
                ? tcat(b.category.name_key as Parameters<typeof tcat>[0], { defaultValue: b.category.name_key })
                : t('other')}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              isOver
                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                : isWarning
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                  : 'bg-muted text-muted-foreground'
            )}>
              {b.displayPercent}%
            </span>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Edit budget"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              aria-label="Delete budget"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${b.displayPercent}%` }}
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

      <EditBudgetModal budget={b} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  )
}
