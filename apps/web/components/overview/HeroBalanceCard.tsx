'use client'
import { useTranslations } from 'next-intl'
import { useAccounts } from '@/hooks/useAccounts'
import { useMonthlySummary } from '@/hooks/useAnalytics'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'
import { formatAmount } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const HIDDEN_KEY = 'balance_hidden'

export function HeroBalanceCard() {
  const t = useTranslations('overview')
  const tc = useTranslations('common')
  const [hidden, setHidden] = useState(false)
  const { totalBalance, isLoading: accountsLoading } = useAccounts()
  const { family } = useFamily()
  const { activePeriod } = useUIStore()
  const currency = family?.currency ?? 'RUB'

  const { data: summary, isLoading: summaryLoading } = useMonthlySummary(
    family?.id ?? '',
    activePeriod.month,
    activePeriod.year
  )

  const prevMonth = activePeriod.month === 1 ? 12 : activePeriod.month - 1
  const prevYear = activePeriod.month === 1 ? activePeriod.year - 1 : activePeriod.year
  const { data: prevSummary } = useMonthlySummary(family?.id ?? '', prevMonth, prevYear)

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(HIDDEN_KEY) === 'true')
    } catch {}
  }, [])

  function toggleHidden() {
    setHidden(h => {
      const next = !h
      try { localStorage.setItem(HIDDEN_KEY, String(next)) } catch {}
      return next
    })
  }

  const isLoading = accountsLoading || summaryLoading

  const net = summary ? summary.total_income - summary.total_expense : null
  const prevNet = prevSummary ? prevSummary.total_income - prevSummary.total_expense : null
  const delta = net !== null && prevNet !== null && prevNet !== 0
    ? ((net - prevNet) / Math.abs(prevNet)) * 100
    : null

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium opacity-80">{t('total_balance')}</p>
          {isLoading ? (
            <Skeleton className="h-10 w-36 mt-1 bg-white/20" />
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <p className={cn('text-4xl font-bold tabular-nums transition-all', hidden && 'blur-md select-none')}>
                {hidden ? '••••••' : formatAmount(totalBalance, currency)}
              </p>
              {delta !== null && (
                <span className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                  delta >= 0 ? 'bg-white/20 text-white' : 'bg-red-400/40 text-white'
                )}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={toggleHidden}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label={hidden ? tc('show') : tc('hide')}
        >
          {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
          <Skeleton className="h-10 w-full bg-white/20" />
          <Skeleton className="h-10 w-full bg-white/20" />
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="opacity-80" />
            <div>
              <p className="text-xs opacity-70">{tc('income')}</p>
              <p className={cn('text-sm font-semibold tabular-nums', hidden && 'blur-sm select-none')}>
                {hidden ? '••••' : formatAmount(summary.total_income, currency)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="opacity-80" />
            <div>
              <p className="text-xs opacity-70">{t('expenses')}</p>
              <p className={cn('text-sm font-semibold tabular-nums', hidden && 'blur-sm select-none')}>
                {hidden ? '••••' : formatAmount(summary.total_expense, currency)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
