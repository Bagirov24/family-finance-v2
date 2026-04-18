'use client'
import { useTranslations } from 'next-intl'
import { useAccounts } from '@/hooks/useAccounts'
import { useMonthlySummary } from '@/hooks/useAnalytics'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'
import { formatAmount } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function HeroBalanceCard() {
  const t = useTranslations('overview')
  const tc = useTranslations('common')
  const [hidden, setHidden] = useState(false)
  const { totalBalance } = useAccounts()
  const { family } = useFamily()
  const { activePeriod } = useUIStore()
  const { data: summary } = useMonthlySummary(family?.id ?? '', activePeriod.month, activePeriod.year)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium opacity-80">{t('total_balance')}</p>
          <p className={cn('text-4xl font-bold mt-1 tabular-nums transition-all', hidden && 'blur-md select-none')}>
            {hidden ? '••••••' : formatAmount(totalBalance)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHidden(h => !h)}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label={hidden ? tc('show') : tc('hide')}
        >
          {hidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="opacity-80" />
            <div>
              <p className="text-xs opacity-70">{tc('income')}</p>
              <p className="text-sm font-semibold tabular-nums">{formatAmount(summary.total_income)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="opacity-80" />
            <div>
              <p className="text-xs opacity-70">{t('expenses')}</p>
              <p className="text-sm font-semibold tabular-nums">{formatAmount(summary.total_expense)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
