'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount, formatFullDate } from '@/lib/formatters'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { useUpdateSubscription } from '@/hooks/useSubscriptions'
import { useAccounts } from '@/hooks/useAccounts'
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

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function SubscriptionCard({ subscription: s, onEdit, onDelete }: Props) {
  const t = useTranslations('subscriptions')
  const tc = useTranslations('common')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const update = useUpdateSubscription()
  const { accounts } = useAccounts()

  const cycleKey = CYCLE_KEYS[s.billing_cycle] ?? 'monthly'
  const days = daysUntil(s.next_billing_date)
  // Безопасная проверка: icon может быть null
  const account = s.account_id ? accounts.find(a => a.id === s.account_id) ?? null : null
  const accountIcon: string = account?.icon ?? '💳'

  function toggleActive() {
    update.mutate({ id: s.id, is_active: !s.is_active })
  }

  const badgeClass =
    days < 0
      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
      : days <= 3
      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
      : days <= 7
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
      : 'bg-muted text-muted-foreground'

  const badgeLabel =
    days < 0
      ? t('overdue')
      : days === 0
      ? t('today')
      : days === 1
      ? t('tomorrow')
      : t('days_left', { days })

  return (
    <>
      <div className={cn(
        'rounded-2xl border bg-card p-4 space-y-3 relative transition-opacity',
        !s.is_active && 'opacity-50'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl leading-none">{s.icon || '📦'}</span>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{s.name}</p>
              {s.description && (
                <p className="text-xs text-muted-foreground truncate">{s.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleActive}
              disabled={update.isPending}
              title={s.is_active ? t('deactivate') : t('activate')}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none',
                s.is_active ? 'bg-primary' : 'bg-input'
              )}
            >
              <span className={cn(
                'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform',
                s.is_active ? 'translate-x-4' : 'translate-x-0'
              )} />
            </button>
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

        {/* Сумма + цикл */}
        <div className="flex items-end justify-between">
          <span className="text-xl font-bold tabular-nums">
            {formatAmount(s.amount, s.currency)}
          </span>
          <span className="text-xs text-muted-foreground">{t(cycleKey)}</span>
        </div>

        {/* Нижняя строка */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {formatFullDate(s.next_billing_date)}
            </span>
            <span className={cn('text-[11px] px-1.5 py-0.5 rounded-full font-medium', badgeClass)}>
              {badgeLabel}
            </span>
          </div>
          {account && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {accountIcon} {account.name}
            </span>
          )}
        </div>

        {s.auto_create_tx && (
          <p className="text-[11px] text-muted-foreground">⚡ {t('auto_create_tx')}</p>
        )}
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
