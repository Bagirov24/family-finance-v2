'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useTransfers } from '@/hooks/useTransfers'
import { useAccounts } from '@/hooks/useAccounts'
import { formatAmount } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { HandCoins } from 'lucide-react'

export function PendingTransferBanner() {
  const t = useTranslations('transfers')
  const tc = useTranslations('common')
  const { pending, pendingRequests, outgoingPending, respondTransfer, cancelTransfer } = useTransfers()
  const { accounts } = useAccounts()

  // Состояние выбора счёта при принятии запроса денег
  const [payAccounts, setPayAccounts] = useState<Record<string, string>>({})

  const hasAnything = pending.length > 0 || pendingRequests.length > 0 || outgoingPending.length > 0
  if (!hasAnything) return null

  return (
    <div className="space-y-2">

      {/* Входящие переводы (send): получатель принимает/отклоняет */}
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
              {tx.note && (
                <p className="text-xs text-muted-foreground truncate">💬 {tx.note}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm" variant="outline"
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

      {/* Входящие запросы денег (request): я должен оплатить */}
      {pendingRequests.map(tx => {
        const fromName = tx.from_member?.display_name ?? tx.from_user_id
        const selectedAccount = payAccounts[tx.id] ?? ''
        return (
          <div
            key={tx.id}
            className="p-4 rounded-2xl bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 space-y-3"
          >
            <div className="flex items-start gap-2">
              <HandCoins size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {t('request_received', { from: fromName, amount: formatAmount(Number(tx.amount)) })}
                </p>
                {tx.note && (
                  <p className="text-xs text-muted-foreground mt-0.5">📝 {tx.note}</p>
                )}
              </div>
            </div>

            {/* Выбор счёта списания */}
            <Select
              value={selectedAccount}
              onValueChange={v => setPayAccounts(prev => ({ ...prev, [tx.id]: v }))}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t('select_pay_account')} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.icon ?? '💳'} {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                size="sm" variant="outline" className="flex-1"
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
                size="sm" className="flex-1"
                disabled={respondTransfer.isPending || !selectedAccount}
                onClick={() => {
                  if (!selectedAccount) {
                    toast.error(t('select_pay_account'))
                    return
                  }
                  respondTransfer.mutate(
                    {
                      transfer_id: tx.id,
                      action: 'confirmed',
                      from_account_id: selectedAccount,
                      to_account_id: tx.to_account_id ?? undefined,
                    },
                    { onError: () => toast.error(tc('error')) }
                  )
                }}
              >
                {t('pay')}
              </Button>
            </div>
          </div>
        )
      })}

      {/* Исходящие ожидающие (и переводы и запросы): отправитель/инициатор может отменить */}
      {outgoingPending.map(tx => {
        const toName = tx.to_member?.display_name ?? tx.to_user_id
        const isRequest = tx.transfer_type === 'request'
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-muted/50 border"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {isRequest
                  ? t('request_sent_pending', { to: toName, amount: formatAmount(Number(tx.amount)) })
                  : t('transfer_sent_pending', { to: toName, amount: formatAmount(Number(tx.amount)) })}
              </p>
              {tx.note && (
                <p className="text-xs text-muted-foreground truncate">💬 {tx.note}</p>
              )}
            </div>
            <Button
              size="sm" variant="outline"
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
