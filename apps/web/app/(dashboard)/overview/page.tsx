import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { prefetchOverviewData } from '@/lib/supabase/prefetch'
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
import type { OverviewInitialData } from '@/types/overview'

export async function generateMetadata() {
  const t = await getTranslations('overview')
  return { title: t('title') }
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
      <WhoSpentWhat />

      {/* Top spend categories for active period */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">{t('top_categories')}</h2>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <TopCategories />
        </div>
      </section>

      {/* Latest transactions */}
      <section>
        <h2 className="text-base font-semibold mb-3">{t('recent_transactions')}</h2>
        <div className="rounded-2xl border bg-card p-4">
          <TransactionList limit={5} />
        </div>
      </section>
    </div>
  )
}
