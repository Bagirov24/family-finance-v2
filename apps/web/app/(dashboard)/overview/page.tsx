import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { HeroBalanceCard } from '@/components/overview/HeroBalanceCard'
import { DailyBudgetPulse } from '@/components/overview/DailyBudgetPulse'
import { TopCategories } from '@/components/overview/TopCategories'
import { TransactionList } from '@/components/transactions/TransactionList'

export async function generateMetadata() {
  const t = await getTranslations('overview')
  return { title: t('title') }
}

export default function OverviewPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <HeroBalanceCard />
      <DailyBudgetPulse />

      <section>
        <h2 className="text-base font-semibold mb-3">📅 Топ категорий за месяц</h2>
        <div className="rounded-2xl border bg-card p-4">
          <TopCategories />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-3">🕐 Последние операции</h2>
        <div className="rounded-2xl border bg-card p-4">
          <TransactionList limit={10} />
        </div>
      </section>
    </div>
  )
}
