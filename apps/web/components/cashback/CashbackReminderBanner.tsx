'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCashbackCards, isCategoryActive } from '@/hooks/useCashback'

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

/**
 * Smart reminder banner:
 * – shows on days 1–3 of month (new billing period)
 * – OR whenever any active category expires within 7 days
 * Lists the expiring categories so the user knows what to act on.
 */
export function CashbackReminderBanner() {
  const t = useTranslations('cashback')
  const [visible, setVisible] = useState(false)
  const { cards, isLoading } = useCashbackCards()

  // Categories expiring within 7 days (not yet expired)
  const expiringSoon = useMemo(() => {
    const result: { cardName: string; categoryKey: string; daysLeft: number }[] = []
    for (const card of cards) {
      for (const cat of card.cashback_categories ?? []) {
        if (!cat.valid_until) continue
        if (!isCategoryActive(cat)) continue
        const d = daysUntil(cat.valid_until)
        if (d >= 0 && d <= 7) {
          // card.name is optional — fall back to card_name which is always present
          result.push({ cardName: card.name ?? card.card_name, categoryKey: cat.category_key, daysLeft: d })
        }
      }
    }
    return result
  }, [cards])

  useEffect(() => {
    if (isLoading) return
    const dayOfMonth = new Date().getDate()
    if (dayOfMonth <= 3 || expiringSoon.length > 0) {
      setVisible(true)
    }
  }, [isLoading, expiringSoon.length])

  if (!visible) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <Bell size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold">{t('reminder_title')}</p>
        {expiringSoon.length > 0 ? (
          <ul className="text-xs mt-1 space-y-0.5 text-amber-800 dark:text-amber-300">
            {expiringSoon.map((item, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="opacity-60">•</span>
                <span className="font-medium">{item.cardName}</span>
                <span className="opacity-70">—</span>
                <span>{item.categoryKey}</span>
                <span className="ml-auto font-semibold tabular-nums">
                  {item.daysLeft === 0
                    ? t('cat_expires_today')
                    : t('cat_expires_in_days', { count: item.daysLeft })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-amber-800 dark:text-amber-300">{t('reminder_body')}</p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 -mt-0.5 -mr-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
        aria-label={t('reminder_dismiss')}
        onClick={() => setVisible(false)}
      >
        <X size={14} />
      </Button>
    </div>
  )
}
