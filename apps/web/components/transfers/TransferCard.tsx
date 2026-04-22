'use client'
import { useTranslations } from 'next-intl'
import { formatAmount, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { ArrowUpRight, ArrowDownLeft, Clock, Ban, HandCoins } from 'lucide-react'
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
  const isCancelled = tx.status === 'cancelled'
  const isRequest = tx.transfer_type === 'request'

  const fromName = tx.from_member?.display_name ?? tx.from_user_id
  const toName = tx.to_member?.display_name ?? tx.to_user_id

  const dateStr = tx.created_at ? tx.created_at.split('T')[0] : tx.date

  // Иконка и цвет аватара
  const avatarColor = (() => {
    if (isCancelled) return 'bg-muted'
    if (isRequest && isOutgoing) return 'bg-blue-100 dark:bg-blue-950'
    if (isRequest && !isOutgoing) return 'bg-purple-100 dark:bg-purple-950'
    if (isOutgoing) return 'bg-red-100 dark:bg-red-950'
    return 'bg-green-100 dark:bg-green-950'
  })()

  const Icon = (() => {
    if (isCancelled) return <Ban size={18} className="text-muted-foreground" />
    if (isPending && !isRequest) return <Clock size={18} className="text-yellow-600" />
    if (isRequest) return <HandCoins size={18} className={isOutgoing ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'} />
    if (isOutgoing) return <ArrowUpRight size={18} className="text-red-600" />
    return <ArrowDownLeft size={18} className="text-green-600" />
  })()

  // Подпись
  const label = (() => {
    if (isRequest && isOutgoing) return t('request_sent_to', { name: toName })
    if (isRequest && !isOutgoing) return t('request_from_name', { name: fromName })
    if (isOutgoing) return t('sentTo', { name: toName })
    return t('receivedFrom', { name: fromName })
  })()

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-colors',
      (isDeclined || isCancelled) && 'opacity-50',
    )}>
      <div className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
        avatarColor
      )}>
        {Icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs text-muted-foreground">{formatDate(dateStr)}</p>
          {isPending && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              {isRequest ? t('request_pending') : t('pending')}
            </span>
          )}
          {isDeclined && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
              {t('declined')}
            </span>
          )}
          {isCancelled && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {t('cancelled')}
            </span>
          )}
        </div>
        {tx.note && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">💬 {tx.note}</p>
        )}
      </div>

      <p className={cn(
        'text-sm font-semibold tabular-nums shrink-0',
        (isDeclined || isCancelled)
          ? 'text-muted-foreground line-through'
          : isRequest
            ? isOutgoing
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-purple-600 dark:text-purple-400'
            : isOutgoing
              ? 'text-foreground'
              : 'text-green-600 dark:text-green-400'
      )}>
        {isRequest ? '🤝' : isOutgoing ? '−' : '+'}{!isRequest && formatAmount(Number(tx.amount))}
        {isRequest && ` ${formatAmount(Number(tx.amount))}`}
      </p>
    </div>
  )
}
