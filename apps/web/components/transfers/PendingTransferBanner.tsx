'use client'
import { useTranslations } from 'next-intl'
import { useTransfers } from '@/hooks/useTransfers'
import { formatAmount } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function PendingTransferBanner() {
  const t = useTranslations('transfers')
  const tc = useTranslations('common')
  const { pending, outgoingPending, respondTransfer, cancelTransfer } = useTransfers()

  if (!pending.length && !outgoingPending.length) return null

  return (
    <div className="space-y-2">
      {/* Входящие: получатель может принять или отклонить */}
      {pending.map(tx => {
        const fromName = tx.from_member?.display_name ?? tx.from_user_id
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {t('transfer_received', { from: fromName, amount: formatAmount(Number(tx.amount)) })}
              </p>
              {tx.note && <p className="text-xs text-muted-foreground truncate">{tx.note}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={respondTransfer.isPending}
                onClick={() =>
                  respondTransfer.mutate(
                    { transfer_id: tx.id, action: 'declined' },
                    { onError: () => toast.error(tc('error')) }
                  )
                }
              >
                {t('decline')}
              </Button>
              <Button
                size="sm"
                disabled={respondTransfer.isPending}
                onClick={() =>
                  respondTransfer.mutate(
                    { transfer_id: tx.id, action: 'confirmed' },
                    { onError: () => toast.error(tc('error')) }
                  )
                }
              >
                {t('accept')}
              </Button>
            </div>
          </div>
        )
      })}

      {/* Исходящие: отправитель может отменить */}
      {outgoingPending.map(tx => {
        const toName = tx.to_member?.display_name ?? tx.to_user_id
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 dark:bg-gray-900/30 dark:border-gray-700"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {t('transfer_sent_pending', { to: toName, amount: formatAmount(Number(tx.amount)) })}
              </p>
              {tx.note && <p className="text-xs text-muted-foreground truncate">{tx.note}</p>}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={cancelTransfer.isPending}
              onClick={() =>
                cancelTransfer.mutate(
                  tx.id,
                  { onError: () => toast.error(tc('error')) }
                )
              }
            >
              {t('cancel_transfer')}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
