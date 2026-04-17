'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTransactions } from '@/hooks/useTransactions'
import { formatAmount, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'

const TABS = ['all', 'expense', 'income'] as const
type Tab = typeof TABS[number]

export default function TransactionsPage() {
  const t = useTranslations()
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  const { transactions, totalIncome, totalExpense, isLoading } = useTransactions(
    tab !== 'all' ? { type: tab } : undefined
  )

  const filtered = transactions.filter(tx =>
    !search || (tx.note ?? '').toLowerCase().includes(search.toLowerCase())
    || (tx.category?.name_key ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // Group by date
  const groups: Record<string, typeof filtered> = {}
  for (const tx of filtered) {
    const d = tx.date
    if (!groups[d]) groups[d] = []
    groups[d].push(tx)
  }
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  const todayStr = new Date().toISOString().split('T')[0]
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const dateLabel = (d: string) => {
    if (d === todayStr) return t('common.today')
    if (d === yesterdayStr) return t('common.yesterday')
    return formatDate(d)
  }

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('transactions.title')}</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 dark:bg-green-950 rounded-2xl p-3">
          <div className="flex items-center gap-1 text-green-600 text-xs mb-1"><TrendingUp className="w-3 h-3" />{t('common.income')}</div>
          <p className="font-bold text-lg">{formatAmount(totalIncome)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950 rounded-2xl p-3">
          <div className="flex items-center gap-1 text-red-600 text-xs mb-1"><TrendingDown className="w-3 h-3" />{t('common.expense')}</div>
          <p className="font-bold text-lg">{formatAmount(totalExpense)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('transactions.search')}
          className="pl-9 rounded-xl"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl">
        {TABS.map(tab_ => (
          <button
            key={tab_}
            onClick={() => setTab(tab_)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === tab_ ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
            )}
          >
            {tab_ === 'all' ? t('common.all') : tab_ === 'income' ? t('common.income') : t('common.expense')}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading && <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">{t('transactions.no_transactions')}</p>
      )}
      {sortedDates.map(date => (
        <div key={date}>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{dateLabel(date)}</p>
          <div className="space-y-2">
            {groups[date].map(tx => (
              <div key={tx.id} className="bg-card border rounded-2xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: (tx.category?.color ?? '#aaa') + '25' }}>
                  <span className="text-base" style={{ color: tx.category?.color ?? '#aaa' }}>●</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.note || tx.category?.name_key || '—'}</p>
                  <p className="text-xs text-muted-foreground">{tx.account?.name}</p>
                </div>
                <span className={cn('text-sm font-semibold shrink-0', tx.type === 'income' ? 'text-green-600' : '')}>
                  {tx.type === 'income' ? '+' : '-'}{formatAmount(Number(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
