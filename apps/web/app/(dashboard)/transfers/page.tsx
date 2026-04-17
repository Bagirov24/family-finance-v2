import { getTranslations } from 'next-intl/server'
import { PendingTransferBanner } from '@/components/transfers/PendingTransferBanner'
import { TransfersList } from '@/components/transfers/TransfersList'

export async function generateMetadata() {
  const t = await getTranslations('transfers')
  return { title: t('title') }
}

export default function TransfersPage() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <PendingTransferBanner />
      <section>
        <h2 className="text-base font-semibold mb-3">{'🔄 История переводов'}</h2>
        <div className="rounded-2xl border bg-card p-4">
          <TransfersList />
        </div>
      </section>
    </div>
  )
}
