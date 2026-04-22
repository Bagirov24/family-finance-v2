'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCategoryBreakdown } from '@/hooks/useAnalytics'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight } from 'lucide-react'

export function TopCategories() {
  const t = useTranslations('overview')
  const tc = useTranslations('categories')
  const tCommon = useTranslations('common')
  const { family } = useFamily()
  const { activePeriod } = useUIStore()
  const currency = family?.currency ?? 'RUB'

  const { data, isLoading } = useCategoryBreakdown(
    family?.id ?? '',
    activePeriod.month,
    activePeriod.year
  )

  const top = (data ?? []).slice(0, 5)
  const maxVal = top[0]?.total ?? 1

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1"><Skeleton className="h-3 w-full rounded-full" /></div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    )
  }

  if (!top.length) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{tCommon('empty')}</p>
  }

  return (
    <div>
      <ul className="space-y-3">
        {top.map(cat => (
          <li key={cat.name_key} className="flex items-center gap-3">
            <span className="text-xl w-8 text-center shrink-0">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium truncate">
                  {tc(cat.name_key, { defaultValue: cat.name_key })}
                </span>
                <span className="text-sm font-semibold tabular-nums shrink-0 ml-2">
                  {formatAmount(cat.total, currency)}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((cat.total / maxVal) * 100)}%`,
                    backgroundColor: cat.color ?? 'var(--primary)',
                  }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      {(data ?? []).length > 5 && (
        <Link
          href="/analytics"
          className="mt-4 flex items-center justify-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          {t('view_all')} <ChevronRight size={13} />
        </Link>
      )}
    </div>
  )
}
