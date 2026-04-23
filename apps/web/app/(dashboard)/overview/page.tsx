import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { prefetchOverviewData, PREFETCH_TX_LIMIT } from '@/lib/supabase/prefetch'
import { HeroBalanceCard } from '@/components/overview/HeroBalanceCard'
import { NetSavingsBar } from '@/components/overview/NetSavingsBar'
import { DailyBudgetPulse } from '@/components/overview/DailyBudgetPulse'
import { TopCategories } from '@/components/overview/TopCategories'
import { PeriodSwitcher } from '@/components/overview/PeriodSwitcher'
import { UpcomingSubscriptions } from '@/components/overview/UpcomingSubscriptions'
import { WhoSpentWhat } from '@/components/overview/WhoSpentWhat'
import { QuickAdd } from '@/components/overview/QuickAdd'
import { PendingTransferBanner } from '@/components/transfers/PendingTransferBanner'
import { TransactionList } from '@/components/transactions/TransactionList'
import { Skeleton } from '@/components/ui/skeleton'
import type { OverviewInitialData } from '@/types/overview'

export async function generateMetadata() {
  const t = await getTranslations('overview')
  return { title: t('title') }
}

// --- Skeleton fallbacks с фиксированной высотой чтобы не было CLS ---

function WhoSpentWhatSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-10 w-full rounded-2xl" />
    </div>
  )
}

function TopCategoriesSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  )
}

function TransactionListSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export default async function OverviewPage() {
  const t = await getTranslations('overview')

  // Серверный prefetch: данные готовы до первого клиентского рендера
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialData: OverviewInitialData | undefined
  if (user) {
    try {
      const prefetched = await prefetchOverviewData(user.id)
      initialData = prefetched
    } catch {
      // Не падаем — клиент подтянет данные самостоятельно
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Period selector */}
      <PeriodSwitcher />

      {/* Hero: total balance + income/expense for period */}
      <HeroBalanceCard initialData={initialData} />

      {/* Income vs Expense progress bar + net savings */}
      <NetSavingsBar />

      {/* Quick inline add — сумма + категория + note одной строкой */}
      <QuickAdd />

      {/* Daily spending limit based on remaining budgets */}
      <DailyBudgetPulse />

      {/* Pending transfers: incoming (accept/decline) + outgoing (cancel) */}
      <PendingTransferBanner />

      {/* Subscriptions due in next 7 days */}
      <UpcomingSubscriptions />

      {/* Per-member expense breakdown (only shown in family with 2+ members) */}
      <Suspense fallback={<WhoSpentWhatSkeleton />}>
        <WhoSpentWhat />
      </Suspense>

      {/* Top spend categories for active period */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">{t('top_categories')}</h2>
        </div>
        <Suspense fallback={<TopCategoriesSkeleton />}>
          <TopCategories />
        </Suspense>
      </section>

      {/* Latest transactions — limit matches PREFETCH_TX_LIMIT so React Query
          cache is seeded on the server and no extra network request is made */}
      <section>
        <h2 className="text-base font-semibold mb-3">{t('recent_transactions')}</h2>
        <Suspense fallback={<TransactionListSkeleton />}>
          <TransactionList
            limit={PREFETCH_TX_LIMIT}
            initialTransactions={initialData?.transactions}
          />
        </Suspense>
      </section>
    </div>
  )
}
