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
import type { OverviewInitialData } from '@/types/overview'

const HIDDEN_KEY = 'balance_hidden'

interface HeroBalanceCardProps {
  initialData?: OverviewInitialData
}

export function HeroBalanceCard({ initialData }: HeroBalanceCardProps) {
  const t = useTranslations('overview')
  const tc = useTranslations('common')
  const [hidden, setHidden] = useState(false)

  const { family } = useFamily({ initialMembers: initialData?.members })
  const { totalBalance, isLoading: accountsLoading } = useAccounts({ initialAccounts: initialData?.accounts })
  const { activePeriod } = useUIStore()
  const currency = family?.currency ?? 'RUB'

  // Используем initialData только если период совпадает с текущим
  const isCurrentPeriod =
    initialData != null &&
    activePeriod.month === initialData.month &&
    activePeriod.year === initialData.year

  const { data: summary, isLoading: summaryLoading } = useMonthlySummary(
    family?.id ?? '',
    activePeriod.month,
    activePeriod.year,
    { initialData: isCurrentPeriod ? initialData?.summary : undefined }
  )

  const prevMonth = activePeriod.month === 1 ? 12 : activePeriod.month - 1
  const prevYear = activePeriod.month === 1 ? activePeriod.year - 1 : activePeriod.year
  const { data: prevSummary } = useMonthlySummary(family?.id ?? '', prevMonth, prevYear)

  useEffect(() => {
    try { setHidden(localStorage.getItem(HIDDEN_KEY) === 'true') } catch {}
  }, [])

  function toggleHidden() {
    setHidden(h => {
      const next = !h
      try { localStorage.setItem(HIDDEN_KEY, String(next)) } catch {}
      return next
    })
  }

  const isLoading = accountsLoading || summaryLoading

  const expense = summary?.total_expense ?? null
  const prevExpense = prevSummary?.total_expense ?? null
  const expenseDelta =
    expense !== null && prevExpense !== null && prevExpense !== 0
      ? ((expense - prevExpense) / Math.abs(prevExpense)) * 100
      : null

  return (
    // min-h зафиксирован под реальный контент — предотвращает CLS при появлении данных
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-5 sm:p-6 text-white shadow-lg min-h-[140px]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-80">{t('total_balance')}</p>
          {isLoading ? (
            <Skeleton className="h-10 w-36 mt-1 bg-white/20" />
          ) : (
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <p className={cn('text-3xl sm:text-4xl font-bold tabular-nums transition-all break-all', hidden && 'blur-md select-none')}>
                {hidden ? '••••••' : formatAmount(totalBalance, currency)}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={toggleHidden}
          className="p-2.5 rounded-full hover:bg-white/20 transition-colors shrink-0"
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
            <TrendingUp size={16} className="opacity-80 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs opacity-70">{tc('income')}</p>
              <p className={cn('text-sm font-semibold tabular-nums break-all', hidden && 'blur-sm select-none')}>
                {hidden ? '••••' : formatAmount(summary.total_income, currency)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="opacity-80 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs opacity-70">{t('expenses')}</p>
                {expenseDelta !== null && (
                  <span className={cn(
                    'text-[10px] font-semibold px-1 py-0.5 rounded-full leading-none',
                    expenseDelta <= 0
                      ? 'bg-green-400/30 text-white'
                      : 'bg-red-400/30 text-white'
                  )}>
                    {expenseDelta > 0 ? '+' : ''}{expenseDelta.toFixed(0)}%
                  </span>
                )}
              </div>
              <p className={cn('text-sm font-semibold tabular-nums break-all', hidden && 'blur-sm select-none')}>
                {hidden ? '••••' : formatAmount(summary.total_expense, currency)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
