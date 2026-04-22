'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount, formatFullDate } from '@/lib/formatters'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import type { Subscription } from '@/hooks/useSubscriptions'

interface Props {
  subscription: Subscription
  onEdit?: (s: Subscription) => void
  onDelete?: (id: string) => void
}

const CYCLE_KEYS = {
  monthly: 'monthly',
  yearly: 'yearly',
  weekly: 'weekly',
} as const

export function SubscriptionCard({ subscription: s, onEdit, onDelete }: Props) {
  const t = useTranslations('subscriptions')
  const tc = useTranslations('common')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const cycleKey = CYCLE_KEYS[s.billing_cycle] ?? 'monthly'

  return (
    <>
      <div className={cn(
        'rounded-2xl border bg-card p-4 space-y-3 relative',
        !s.is_active && 'opacity-50'
      )}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* icon is an emoji string stored in DB */}
            <span className="text-2xl leading-none">{s.icon || '📦'}</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{s.name}</p>
              {s.description && (
                <p className="text-xs text-muted-foreground truncate">{s.description}</p>
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
                onClick={() => setConfirmOpen(true)}
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
            {formatAmount(s.amount, s.currency)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t(cycleKey)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('next_billing')}: {formatFullDate(s.next_billing_date)}
        </p>
      </div>

      {onDelete && (
        <DeleteConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t('deleteTitle')}
          description={t('deleteDescription')}
          confirmLabel={tc('delete')}
          cancelLabel={tc('cancel')}
          onConfirm={() => {
            onDelete(s.id)
            setConfirmOpen(false)
          }}
        />
      )}
    </>
  )
}
