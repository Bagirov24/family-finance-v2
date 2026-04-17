'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useFamily } from '@/hooks/useFamily'
import { TransactionList } from '@/components/transactions/TransactionList'
import { useCategories } from '@/hooks/useCategories'
import { formatAmount } from '@/lib/formatters'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TransactionsPage() {
  const t = useTranslations('transactions')
  const { family } = useFamily()
  const { data: categories } = useCategories()

  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
  const [type, setType] = useState<'expense' | 'income' | undefined>(undefined)

  const { totalIncome, totalExpense } = useTransactions({
    familyId: family?.id,
    categoryId,
    type,
  })

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t('title')}</h1>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('income')}</p>
          <p className="text-lg font-bold text-green-600 tabular-nums">{formatAmount(totalIncome)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">{t('expenses')}</p>
          <p className="text-lg font-bold tabular-nums">{formatAmount(totalExpense)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={type ?? 'all'} onValueChange={v => setType(v === 'all' ? undefined : v as 'expense' | 'income')}>
          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTypes')}</SelectItem>
            <SelectItem value="expense">{t('expense')}</SelectItem>
            <SelectItem value="income">{t('income')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryId ?? 'all'} onValueChange={v => setCategoryId(v === 'all' ? undefined : v)}>
          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {(categories ?? []).map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {t(`categories.${c.name_key}`, { defaultValue: c.name_key })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <TransactionList categoryId={categoryId} />
      </div>
    </div>
  )
}
