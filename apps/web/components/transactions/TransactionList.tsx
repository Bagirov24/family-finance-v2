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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  limit?: number
  showDate?: boolean
  categoryId?: string
  type?: 'income' | 'expense'
}

export function TransactionList({ limit, showDate = true, categoryId, type }: Props) {
  const t = useTranslations('transactions')
  const tc = useTranslations('common')
  const tcat = useTranslations('categories')
  const { family } = useFamily()
  const { transactions, isLoading } = useTransactions({ familyId: family?.id, categoryId, limit, type })
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction()
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
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
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg bg-muted shrink-0">
                {tx.category?.icon ?? (tx.type === 'income' ? '💰' : '💸')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {tx.note || categoryLabel}
                </p>
                {showDate && (
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className={cn(
                  'font-semibold text-sm tabular-nums mr-1',
                  tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-foreground'
                )}>
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

      <EditTransactionModal
        transaction={editTx}
        open={!!editTx}
        onClose={() => setEditTx(null)}
      />

      <AlertDialog open={!!deleteTx} onOpenChange={open => { if (!open) setDeleteTx(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (deleteTx) {
                  deleteTransaction(deleteTx.id)
                  setDeleteTx(null)
                }
              }}
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
