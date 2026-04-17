'use client'
import { useTranslations } from 'next-intl'
import { useTransfers } from '@/hooks/useTransfers'
import { useUIStore } from '@/store/ui.store'
import { formatAmount } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function PendingTransferBanner() {
  const t = useTranslations('transfers')
  const userId = useUIStore(s => s.userId)
  const { transfers, respondTransfer } = useTransfers()

  const pending = transfers.filter(
    tx => tx.to_user_id === userId && tx.status === 'pending'
  )

  if (!pending.length) return null

  return (
    <div className="space-y-2">
      {pending.map(tx => (
        <div
          key={tx.id}
          className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {t('incomingFrom', { name: tx.from_user_id })} — {formatAmount(Number(tx.amount))}
            </p>
            {tx.note && <p className="text-xs text-muted-foreground truncate">{tx.note}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm" variant="outline"
              onClick={() => respondTransfer.mutate({ transferId: tx.id, action: 'decline' })}
            >
              {t('decline')}
            </Button>
            <Button
              size="sm"
              onClick={() => respondTransfer.mutate({ transferId: tx.id, action: 'confirm' })}
            >
              {t('confirm')}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
