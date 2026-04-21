'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount, formatFullDate } from '@/lib/formatters'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  aria-label={tc('delete')}
                >
                  <Trash2 size={14} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(s.id)}
                  >
                    {tc('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

      {s.next_billing_date && (
        <p className="text-xs text-muted-foreground">
          {t('next_billing')}: {formatFullDate(s.next_billing_date)}
        </p>
      )}
    </div>
  )
}
