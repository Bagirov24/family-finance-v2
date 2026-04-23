'use client'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useFamily } from '@/hooks/useFamily'
import { useCategoryBreakdown } from '@/hooks/useAnalytics'
import { useUIStore } from '@/store/ui.store'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'

// PieChart + d3-shape/d3-path загружаются только когда секция монтируется
const LazyPieChart = dynamic(
  () => import('./_PieChartInner'),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full" /> }
)

export function AnalyticsPieSection() {
  const t = useTranslations('analytics')
  const tc = useTranslations('common')
  const tcat = useTranslations('categories')
  const { family } = useFamily()
  // точный селектор — не подписываемся на весь стор
  const activePeriod = useUIStore(s => s.activePeriod)

  const { data: breakdown, isLoading } = useCategoryBreakdown(
    family?.id ?? '',
    activePeriod.month,
    activePeriod.year
  )

  const pieData = (breakdown ?? []).slice(0, 8).map(c => ({
    key: c.name_key,
    name: tcat(c.name_key, { defaultValue: c.name_key }),
    value: c.total,
    icon: c.icon,
  }))

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        {t('by_category')}
      </h2>
      <div className="rounded-2xl border bg-card p-4">
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : pieData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{tc('empty')}</p>
        ) : (
          <LazyPieChart data={pieData} formatValue={formatAmount} />
        )}
      </div>
    </section>
  )
}
