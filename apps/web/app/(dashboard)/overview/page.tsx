'use client'
import { useTranslations } from 'next-intl'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'
import { useTransfers } from '@/hooks/useTransfers'
import { useBudgets } from '@/hooks/useBudgets'
import { useUIStore } from '@/store/ui.store'
import { formatAmount, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, ArrowLeftRight, AlertTriangle } from 'lucide-react'

export default function OverviewPage() {
  const t = useTranslations()
  const { activePeriod } = useUIStore()
  const { accounts, totalBalance, isLoading: loadingAccounts } = useAccounts()
  const { transactions, totalIncome, totalExpense } = useTransactions({
    from: `${activePeriod.year}-${String(activePeriod.month).padStart(2,'0')}-01`,
    to:   `${activePeriod.year}-${String(activePeriod.month).padStart(2,'0')}-31`,
    limit: 5
  })
  const { pending } = useTransfers()
  const { budgets } = useBudgets(activePeriod.month, activePeriod.year)

  const daysInMonth = new Date(activePeriod.year, activePeriod.month, 0).getDate()
  const today = new Date().getDate()
  const daysLeft = daysInMonth - today + 1
  const remainingBudget = totalIncome - totalExpense
  const dailyBudget = daysLeft > 0 ? Math.max(0, remainingBudget / daysLeft) : 0

  // Category spending map
  const catSpend: Record<string, { name: string; icon: string; color: string; total: number }> = {}
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.category) continue
    const k = tx.category.id
    if (!catSpend[k]) catSpend[k] = { name: tx.category.name_key, icon: tx.category.icon, color: tx.category.color, total: 0 }
    catSpend[k].total += Number(tx.amount)
  }
  const topCategories = Object.values(catSpend).sort((a, b) => b.total - a.total).slice(0, 5)

  // 50/30/20
  const needs = totalExpense * 0.5
  const wants = totalExpense * 0.3
  const savings = totalIncome - totalExpense
  const savingsPct = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

  // Over-budget alerts
  const overBudget = budgets.filter(b => b.percent >= 80)

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      {/* Pending transfers banner */}
      {pending.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
          <ArrowLeftRight className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {pending.length === 1
                ? `Вам перевели ${formatAmount(Number(pending[0].amount))}`
                : `${pending.length} входящих перевода`}
            </p>
          </div>
          <a href="/transfers" className="text-xs text-amber-700 font-semibold hover:underline">Открыть →</a>
        </div>
      )}

      {/* Hero balance card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
        <p className="text-indigo-200 text-sm mb-1">{t('overview.total_balance')}</p>
        <p className="text-4xl font-bold tracking-tight">
          {loadingAccounts ? '...' : formatAmount(totalBalance)}
        </p>
        <div className="mt-5 flex gap-4">
          <div className="flex-1 bg-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1 text-green-300 text-xs mb-1">
              <TrendingUp className="w-3 h-3" />{t('common.income')}
            </div>
            <p className="font-semibold text-lg">{formatAmount(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl p-3">
            <div className="flex items-center gap-1 text-red-300 text-xs mb-1">
              <TrendingDown className="w-3 h-3" />{t('common.expense')}
            </div>
            <p className="font-semibold text-lg">{formatAmount(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Daily budget pulse */}
      <div className="bg-card border rounded-2xl p-4">
        <div className="flex justify-between items-baseline mb-1">
          <p className="text-sm text-muted-foreground">{t('overview.daily_budget')}</p>
          <p className="text-xs text-muted-foreground">{daysLeft} дн. {t('overview.daily_budget_left')}</p>
        </div>
        <p className={cn('text-2xl font-bold', dailyBudget < 500 ? 'text-destructive' : 'text-foreground')}>
          {formatAmount(dailyBudget)}
        </p>
        <div className="mt-2 h-1.5 bg-muted rounded-full">
          <div
            className={cn('h-full rounded-full transition-all', remainingBudget < 0 ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${Math.min(100, totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0)}%` }}
          />
        </div>
      </div>

      {/* Budget alerts */}
      {overBudget.length > 0 && (
        <div className="space-y-2">
          {overBudget.map(b => (
            <div key={b.id} className={cn(
              'flex items-center gap-3 p-3 rounded-xl border text-sm',
              b.percent >= 100
                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                : 'bg-amber-50 dark:bg-amber-950 border-amber-200 text-amber-700 dark:text-amber-300'
            )}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {b.percent >= 100
                  ? `Превышен бюджет «${b.category?.name_key}» на ${formatAmount(Math.abs(b.remaining))}`
                  : `Бюджет «${b.category?.name_key}» использован на ${b.percent}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Top categories */}
      {topCategories.length > 0 && (
        <div className="bg-card border rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{t('overview.top_categories')}</h2>
          <div className="space-y-2.5">
            {topCategories.map(cat => (
              <div key={cat.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: cat.color + '25' }}>
                  <span style={{ color: cat.color }}>●</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-sm font-semibold">{formatAmount(cat.total)}</span>
                  </div>
                  <div className="mt-1 h-1 bg-muted rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (cat.total / totalExpense) * 100)}%`, background: cat.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 50/30/20 */}
      <div className="bg-card border rounded-2xl p-4">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{t('overview.rule_5030')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {[{ label: t('overview.needs'), value: needs, target: 50, color: '#6366F1' },
            { label: t('overview.wants'), value: wants, target: 30, color: '#F59E0B' },
            { label: t('overview.savings'), value: Math.max(0, savings), target: 20, color: '#22C55E' }].map(item => (
            <div key={item.label} className="text-center p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="font-bold text-base">{formatAmount(item.value)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">цель {item.target}%</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-3 text-sm">
          Норма сбережений: <span className={cn('font-bold', savingsPct >= 20 ? 'text-green-600' : 'text-amber-600')}>{savingsPct}%</span>
        </p>
      </div>

      {/* Accounts */}
      {accounts.length > 0 && (
        <div className="bg-card border rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">{t('nav.accounts')}</h2>
          <div className="space-y-2">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg" style={{ background: (acc.color ?? '#6366F1') + '40' }} />
                  <span className="text-sm font-medium">{acc.name}</span>
                </div>
                <span className="text-sm font-semibold">{formatAmount(Number(acc.balance))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="bg-card border rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Последние операции</h2>
            <a href="/transactions" className="text-xs text-primary hover:underline">Все →</a>
          </div>
          <div className="space-y-3">
            {transactions.slice(0,5).map(tx => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: (tx.category?.color ?? '#aaa') + '25' }}>
                  <span style={{ color: tx.category?.color ?? '#aaa' }}>●</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.note || tx.category?.name_key || '—'}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                </div>
                <span className={cn('text-sm font-semibold', tx.type === 'income' ? 'text-green-600' : 'text-foreground')}>
                  {tx.type === 'income' ? '+' : '-'}{formatAmount(Number(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
