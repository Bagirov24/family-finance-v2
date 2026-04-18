'use client'
import { useTranslations } from 'next-intl'
import { useTransfers } from '@/hooks/useTransfers'
import { formatAmount } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function PendingTransferBanner() {
  const t = useTranslations('transfers')
  const tc = useTranslations('common')
  const { pending, respondTransfer } = useTransfers()

  if (!pending.length) return null

  return (
    <div className="space-y-2">
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
    </div>
  )
}
