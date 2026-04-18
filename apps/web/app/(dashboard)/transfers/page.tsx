import { getTranslations } from 'next-intl/server'
import { PendingTransferBanner } from '@/components/transfers/PendingTransferBanner'
import { TransfersList } from '@/components/transfers/TransfersList'
import { TransferModal } from '@/components/transfers/TransferModal'
import { SendTransferButton } from '@/components/transfers/SendTransferButton'

export async function generateMetadata() {
  const t = await getTranslations('transfers')
  return { title: t('title') }
}

export default async function TransfersPage() {
  const t = await getTranslations('transfers')
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <SendTransferButton />
      </div>

      <PendingTransferBanner />

      <section>
        <h2 className="text-base font-semibold mb-3">{t('history')}</h2>
        <div className="rounded-2xl border bg-card p-4">
          <TransfersList />
        </div>
      </section>

      <TransferModal />
    </div>
  )
}
