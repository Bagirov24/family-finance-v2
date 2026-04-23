'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Shows a reminder banner at the start of each billing period (1st of month).
 * Dismissed state is kept in memory only — refreshes each new session,
 * which is intentional: the user should see the reminder each month.
 */
export function CashbackReminderBanner() {
  const t = useTranslations('cashback')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const today = new Date()
    const dayOfMonth = today.getDate()
    // Show banner on days 1-3 of the month (grace period to catch it)
    if (dayOfMonth <= 3) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const monthKey = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ][new Date().getMonth()]

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <Bell size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{t('reminder_title')}</p>
        <p className="text-xs mt-0.5 text-amber-800 dark:text-amber-300">
          {t('reminder_body', { month: t(`reminder_month_${monthKey}` as never, { defaultValue: '' }) || monthKey })}
        </p>
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
