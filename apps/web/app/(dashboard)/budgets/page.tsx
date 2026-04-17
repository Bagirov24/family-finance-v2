'use client'
import { useTranslations } from 'next-intl'
import { useBudgets } from '@/hooks/useBudgets'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { Skeleton } from '@/components/ui/skeleton'

export default function BudgetsPage() {
  const t = useTranslations('budgets')
  const now = new Date()
  const { budgets, isLoading } = useBudgets(now.getMonth() + 1, now.getFullYear())

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <span className="text-sm text-muted-foreground">
          {now.toLocaleString('ru', { month: 'long', year: 'numeric' })}
        </span>
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
            <BudgetCard key={b.id} budget={b as Parameters<typeof BudgetCard>[0]['budget']} />
          ))}
        </div>
      )}
    </div>
  )
}
