'use client'
import { useTransfers } from '@/hooks/useTransfers'
import { useUIStore } from '@/store/ui.store'
import { TransferCard } from './TransferCard'
import { Skeleton } from '@/components/ui/skeleton'

export function TransfersList() {
  const userId = useUIStore(s => s.userId)
  const { transfers, isLoading } = useTransfers()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!userId || !transfers.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">💸 Переводов пока нет</p>
  }

  return (
    <ul className="space-y-2">
      {transfers.map(tx => (
        <li key={tx.id}>
          <TransferCard transfer={tx as Parameters<typeof TransferCard>[0]['transfer']} myUserId={userId} />
        </li>
      ))}
    </ul>
  )
}
