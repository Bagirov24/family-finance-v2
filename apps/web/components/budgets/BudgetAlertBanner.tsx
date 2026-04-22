'use client'
import { useTranslations } from 'next-intl'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/formatters'
import type { BudgetView } from '@/hooks/useBudgets'

interface Props {
  budgets: BudgetView[]
}

export function BudgetAlertBanner({ budgets }: Props) {
  const t = useTranslations('budgets')
  const tcat = useTranslations('categories')

  const over = budgets.filter(b => b.percent >= 100)
  const warning = budgets.filter(b => b.percent >= 80 && b.percent < 100)

  if (over.length === 0 && warning.length === 0) return null

  return (
    <div className="space-y-2">
      {over.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1.5">
                {t('alert_over_title', { count: over.length })}
              </p>
              <ul className="space-y-1">
                {over.map(b => (
                  <li key={b.id} className="flex items-center justify-between gap-2 text-xs text-red-600 dark:text-red-400">
                    <span className="flex items-center gap-1.5">
                      <span>{b.category?.icon ?? '💸'}</span>
                      <span className="font-medium">
                        {b.category
                          ? tcat(b.category.name_key as Parameters<typeof tcat>[0], { defaultValue: b.category.name_key })
                          : t('other')}
                      </span>
                    </span>
                    <span className="tabular-nums shrink-0">
                      +{formatAmount(Math.abs(b.remaining))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {warning.length > 0 && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40 p-4">
          <div className="flex items-start gap-3">
            <TrendingUp size={18} className="shrink-0 mt-0.5 text-yellow-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-1.5">
                {t('alert_warning_title', { count: warning.length })}
              </p>
              <ul className="space-y-1">
                {warning.map(b => (
                  <li key={b.id} className="flex items-center justify-between gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                    <span className="flex items-center gap-1.5">
                      <span>{b.category?.icon ?? '💸'}</span>
                      <span className="font-medium">
                        {b.category
                          ? tcat(b.category.name_key as Parameters<typeof tcat>[0], { defaultValue: b.category.name_key })
                          : t('other')}
                      </span>
                    </span>
                    <span className="tabular-nums shrink-0">
                      {b.displayPercent}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
