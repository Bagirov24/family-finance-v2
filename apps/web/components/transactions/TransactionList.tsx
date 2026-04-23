'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useTransactions, useDeleteTransaction, Transaction } from '@/hooks/useTransactions'
import { useFamily } from '@/hooks/useFamily'
import { formatAmount, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Pencil } from 'lucide-react'
import { EditTransactionModal } from './EditTransactionModal'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

interface Props {
  limit?: number
  showDate?: boolean
  categoryId?: string
  type?: 'income' | 'expense'
  /** Server-prefetched transactions to seed the React Query cache.
   *  When provided and the period matches, no client fetch will be made. */
  initialTransactions?: Transaction[]
}

export function TransactionList({ limit, showDate = true, categoryId, type, initialTransactions }: Props) {
  const t = useTranslations('transactions')
  const tc = useTranslations('common')
  const tcat = useTranslations('categories')
  const { family } = useFamily()
  const { transactions, isLoading } = useTransactions({
    familyId: family?.id,
    categoryId,
    limit,
    type,
    initialData: initialTransactions,
  })
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction()
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-4xl mb-3">💸</p>
        <p>{t('no_transactions')}</p>
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {transactions.map(tx => {
          const categoryLabel = tx.category
            ? tcat(tx.category.name_key as Parameters<typeof tcat>[0], { defaultValue: tx.category.name_key })
            : tcat('other')

          return (
            <li
              key={tx.id}
              className="group flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg bg-muted shrink-0">
                {tx.category?.icon ?? (tx.type === 'income' ? '💰' : '💸')}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{tx.note || categoryLabel}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                  {showDate && <span className="shrink-0">{formatDate(tx.date)}</span>}
                  <span className="truncate">{categoryLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <div
                  className={cn(
                    'font-semibold text-sm tabular-nums mr-1 text-right max-w-[110px] sm:max-w-none truncate',
                    tx.type === 'income' ? 'text-income' : 'text-foreground'
                  )}
                >
                  {tx.type === 'income' ? '+' : '−'}{formatAmount(Number(tx.amount))}
                </div>
                <button
                  type="button"
                  onClick={() => setEditTx(tx)}
                  className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={t('edit')}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTx(tx)}
                  className="p-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label={t('delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <EditTransactionModal transaction={editTx} open={!!editTx} onClose={() => setEditTx(null)} />

      <DeleteConfirmDialog
        open={!!deleteTx}
        onOpenChange={open => { if (!open) setDeleteTx(null) }}
        title={t('deleteTitle')}
        description={t('deleteDescription')}
        confirmLabel={tc('delete')}
        cancelLabel={tc('cancel')}
        onConfirm={() => {
          if (deleteTx) {
            deleteTransaction(deleteTx.id)
            setDeleteTx(null)
          }
        }}
        isLoading={isDeleting}
      />
    </>
  )
}
