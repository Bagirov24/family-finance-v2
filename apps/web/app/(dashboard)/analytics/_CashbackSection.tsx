'use client'

import { useTranslations } from 'next-intl'
import { useCashbackStats } from '@/hooks/useCashbackStats'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, TrendingUp } from 'lucide-react'

function fmt(amount: number, currency = '₽') {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount) + ' ' + currency
}

export function AnalyticsCashbackSection() {
  const t = useTranslations('cashback')
  const tcat = useTranslations('categories')
  const { byCard, byCategory, totalEarned, isLoading } = useCashbackStats()

  if (isLoading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </section>
    )
  }

  if (!byCard.length && !byCategory.length) {
    return (
      <section className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
        <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">{t('no_cards')}</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('cashback_stats_title')}
        </h2>
        <span className="text-sm font-bold text-primary">
          {t('cashback_stats_total')}: {fmt(totalEarned)}
        </span>
      </div>

      {/* По картам */}
      {byCard.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {byCard.map(card => (
            <div
              key={card.cardId}
              className="rounded-2xl p-4 text-white relative overflow-hidden shadow-md"
              style={{ backgroundColor: card.color ?? '#6366f1' }}
            >
              <p className="text-xs opacity-75 mb-0.5">{card.bank}</p>
              <p className="font-bold">{card.cardName}</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs opacity-75">{t('cashback_stats_earned')}</p>
                  <p className="text-lg font-bold">{fmt(card.earned)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-75">{t('cashback_stats_from')}</p>
                  <p className="text-sm opacity-90">{fmt(card.coveredExpenses)}</p>
                </div>
              </div>
              <CreditCard size={48} className="absolute -right-2 -bottom-3 opacity-10" />
            </div>
          ))}
        </div>
      )}

      {/* По категориям */}
      {byCategory.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('cashback_stats_by_category')}
            </span>
          </div>
          {byCategory.map(cat => {
            const barWidth = totalEarned > 0
              ? Math.round((cat.earned / totalEarned) * 100)
              : 0

            return (
              <div key={cat.categoryId} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{cat.categoryIcon}</span>
                    <span className="text-sm truncate">
                      {tcat(cat.categoryNameKey, { defaultValue: cat.categoryNameKey })}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {fmt(cat.earned)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({cat.bestPercent}% • {cat.bestCardName})
                    </span>
                  </div>
                </div>
                {/* Прогресс-бар */}
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
