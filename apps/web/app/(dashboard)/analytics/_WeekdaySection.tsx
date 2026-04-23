'use client'
import { useTranslations } from 'next-intl'
import { useFamily } from '@/hooks/useFamily'
import { useWeekdaySpending } from '@/hooks/useAnalytics'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const WEEKDAY_KEYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export function AnalyticsWeekdaySection() {
  const t = useTranslations('analytics')
  const tc = useTranslations('common')
  const { family } = useFamily()

  const { data: weekday, isLoading } = useWeekdaySpending(family?.id ?? '')

  const weekdayData = Array.from({ length: 7 }, (_, i) => {
    const entry = (weekday ?? []).find(w => w.weekday === i)
    return {
      name: WEEKDAY_KEYS_RU[i],
      avg: entry ? Math.round(entry.avg_amount) : 0,
    }
  })

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        {t('by_weekday')}
      </h2>
      <div className="rounded-2xl border bg-card p-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekdayData} barCategoryGap="25%">
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => formatAmount(v)} />
              <Bar dataKey="avg" name={tc('expense')} fill="#7a39bb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
