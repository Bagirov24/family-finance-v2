'use client'
import { useTranslations } from 'next-intl'
import { formatAmount, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import type { MemberTransfer } from '@/hooks/useTransfers'

interface Props {
  transfer: MemberTransfer
  myUserId: string
}

export function TransferCard({ transfer: tx, myUserId }: Props) {
  const t = useTranslations('transfers')
  const isOutgoing = tx.from_user_id === myUserId
  const isPending = tx.status === 'pending'
  const isDeclined = tx.status === 'declined'

  const fromName = tx.from_member?.display_name ?? tx.from_user_id
  const toName = tx.to_member?.display_name ?? tx.to_user_id

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-colors',
      isDeclined && 'opacity-50',
    )}>
      <div className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
        isOutgoing ? 'bg-red-100 dark:bg-red-950' : 'bg-green-100 dark:bg-green-950'
      )}>
        {isPending
          ? <Clock size={18} className="text-yellow-600" />
          : isOutgoing
            ? <ArrowUpRight size={18} className="text-red-600" />
            : <ArrowDownLeft size={18} className="text-green-600" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {isOutgoing
            ? t('sentTo', { name: toName })
            : t('receivedFrom', { name: fromName })}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{formatDate(tx.created_at.split('T')[0])}</p>
          {isPending && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              {t('pending')}
            </span>
          )}
          {isDeclined && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              {t('declined')}
            </span>
          )}
        </div>
      </div>

      <p className={cn(
        'text-sm font-semibold tabular-nums shrink-0',
        isOutgoing ? 'text-foreground' : 'text-green-600 dark:text-green-400'
      )}>
        {isOutgoing ? '−' : '+'}{formatAmount(Number(tx.amount))}
      </p>
    </div>
  )
}
