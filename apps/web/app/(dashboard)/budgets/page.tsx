'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useBudgets } from '@/hooks/useBudgets'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { UpsertBudgetModal } from '@/components/budgets/UpsertBudgetModal'
import { Skeleton } from '@/components/ui/skeleton'
import { useUIStore } from '@/store/ui.store'

export default function BudgetsPage() {
  const t = useTranslations('budgets')
  const locale = useLocale()
  const { activePeriod } = useUIStore()
  const { budgets, isLoading } = useBudgets()

  const date = new Date(activePeriod.year, activePeriod.month - 1, 1)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <span className="text-sm text-muted-foreground">
            {date.toLocaleString(locale, { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <UpsertBudgetModal />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : !budgets.length ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-4xl mb-3">📊</p>
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {budgets.map(b => (
            <BudgetCard key={b.id} budget={b} />
          ))}
        </div>
      )}
    </div>
  )
}
