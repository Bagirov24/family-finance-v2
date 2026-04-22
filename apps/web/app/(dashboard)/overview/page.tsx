import { getTranslations } from 'next-intl/server'
import { HeroBalanceCard } from '@/components/overview/HeroBalanceCard'
import { DailyBudgetPulse } from '@/components/overview/DailyBudgetPulse'
import { TopCategories } from '@/components/overview/TopCategories'
import { PeriodSwitcher } from '@/components/overview/PeriodSwitcher'
import { UpcomingSubscriptions } from '@/components/overview/UpcomingSubscriptions'
import { PendingTransferBanner } from '@/components/transfers/PendingTransferBanner'
import { TransactionList } from '@/components/transactions/TransactionList'

export async function generateMetadata() {
  const t = await getTranslations('overview')
  return { title: t('title') }
}

export default async function OverviewPage() {
  const t = await getTranslations('overview')

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Period selector */}
      <PeriodSwitcher />

      {/* Hero: total balance + income/expense for period */}
      <HeroBalanceCard />

      {/* Daily spending limit based on remaining budgets */}
      <DailyBudgetPulse />

      {/* Pending transfers: incoming (accept/decline) + outgoing (cancel) */}
      <PendingTransferBanner />

      {/* Subscriptions due in next 7 days */}
      <UpcomingSubscriptions />

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
