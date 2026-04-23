'use client'
import { useTranslations } from 'next-intl'
import { useFamily } from '@/hooks/useFamily'
import { useMonthlyTrend } from '@/hooks/useAnalytics'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function AnalyticsTrendSection() {
  const t = useTranslations('analytics')
  const tc = useTranslations('common')
  const { family } = useFamily()

  const { data: trend, isLoading } = useMonthlyTrend(family?.id ?? '', 6)

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        {t('income_expense')}
      </h2>
      <div className="rounded-2xl border bg-card p-4">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend ?? []} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => formatAmount(v)} />
              <Bar dataKey="income" name={tc('income')} fill="#437a22" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name={tc('expense')} fill="#01696f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
