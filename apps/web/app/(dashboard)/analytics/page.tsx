'use client'
import { useTranslations } from 'next-intl'
import { useFamily } from '@/hooks/useFamily'
import { useMonthlyTrend, useCategoryBreakdown, useWeekdaySpending } from '@/hooks/useAnalytics'
import { useUIStore } from '@/store/ui.store'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#01696f','#437a22','#006494','#7a39bb','#d19900','#da7101','#a12c7b','#a13544']

const WEEKDAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAY_KEYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export default function AnalyticsPage() {
  const t = useTranslations('analytics')
  const tc = useTranslations('common')
  const tcat = useTranslations('categories')
  const { family } = useFamily()
  const { activePeriod } = useUIStore()

  const { data: trend, isLoading: trendLoading } = useMonthlyTrend(family?.id ?? '', 6)
  const { data: breakdown, isLoading: breakLoading } = useCategoryBreakdown(
    family?.id ?? '',
    activePeriod.month,
    activePeriod.year
  )
  const { data: weekday, isLoading: weekdayLoading } = useWeekdaySpending(family?.id ?? '')

  const pieData = (breakdown ?? []).slice(0, 8).map(c => ({
    key: c.name_key,
    name: tcat(c.name_key, { defaultValue: c.name_key }),
    value: c.total,
    icon: c.icon,
  }))

  const weekdayData = Array.from({ length: 7 }, (_, i) => {
    const entry = (weekday ?? []).find(w => w.weekday === i)
    return {
      name: WEEKDAY_KEYS_RU[i],
      avg: entry ? Math.round(entry.avg_amount) : 0,
    }
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">{t('title')}</h1>

      {/* Income & Expense trend */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          {t('income_expense')}
        </h2>
        <div className="rounded-2xl border bg-card p-4">
          {trendLoading ? <Skeleton className="h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trend ?? []} barCategoryGap="30%">
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => formatAmount(v)} />
                <Bar dataKey="income" name={tc('income')} fill="#437a22" radius={[4,4,0,0]} />
                <Bar dataKey="expense" name={tc('expense')} fill="#01696f" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* By category */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          {t('by_category')}
        </h2>
        <div className="rounded-2xl border bg-card p-4">
          {breakLoading ? <Skeleton className="h-56 w-full" /> : pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{tc('empty')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatAmount(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* By weekday */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          {t('by_weekday')}
        </h2>
        <div className="rounded-2xl border bg-card p-4">
          {weekdayLoading ? <Skeleton className="h-40 w-full" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekdayData} barCategoryGap="25%">
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => formatAmount(v)} />
                <Bar dataKey="avg" name={tc('expense')} fill="#7a39bb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  )
}
