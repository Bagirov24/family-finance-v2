'use client'
import { useTranslations } from 'next-intl'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/formatters'
import type { Subscription } from '@/hooks/useSubscriptions'

interface Props {
  subscription: Subscription
  onEdit?: (s: Subscription) => void
  onDelete?: (id: string) => void
}

export function SubscriptionCard({ subscription: s, onEdit, onDelete }: Props) {
  const t = useTranslations('subscriptions')
  const tc = useTranslations('common')

  return (
    <div className={cn(
      'rounded-2xl border bg-card p-4 space-y-3 relative',
      !s.is_active && 'opacity-50'
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{s.icon ?? '📦'}</span>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{s.name}</p>
            {s.category && (
              <p className="text-xs text-muted-foreground">{s.category}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(s)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={tc('edit')}
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(s.id)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
              aria-label={tc('delete')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <span className="text-xl font-bold tabular-nums">
          {formatAmount(s.amount)}
        </span>
        <span className="text-xs text-muted-foreground">
          {t(s.billing_cycle)}
        </span>
      </div>

      {s.next_billing_date && (
        <p className="text-xs text-muted-foreground">
          {t('next_billing')}: {s.next_billing_date}
        </p>
      )}
    </div>
  )
}
