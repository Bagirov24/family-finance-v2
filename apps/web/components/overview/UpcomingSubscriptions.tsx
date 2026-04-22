'use client'
import { useTranslations } from 'next-intl'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useFamily } from '@/hooks/useFamily'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function UpcomingSubscriptions() {
  const t = useTranslations('subscriptions')
  const { subscriptions, isLoading } = useSubscriptions()
  const { family } = useFamily()
  const currency = family?.currency ?? 'RUB'

  const upcoming = subscriptions
    .filter(s => s.is_active && s.next_billing_date)
    .map(s => ({ ...s, daysLeft: daysUntil(s.next_billing_date) }))
    .filter(s => s.daysLeft >= 0 && s.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  if (isLoading) return <Skeleton className="h-16 w-full rounded-2xl" />
  if (!upcoming.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{t('upcoming')}</h2>
        <Link href="/subscriptions" className="text-xs text-primary font-medium hover:underline">
          {t('all')}
        </Link>
      </div>
      <div className="rounded-2xl border bg-card divide-y divide-border overflow-hidden">
        {upcoming.map(s => (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-xl leading-none shrink-0">{s.icon || '\uD83D\uDCE6'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.daysLeft === 0
                  ? t('due_today')
                  : s.daysLeft === 1
                    ? t('due_tomorrow')
                    : t('due_in_days', { count: s.daysLeft })}
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums shrink-0">
              {formatAmount(s.amount, s.currency ?? currency)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
