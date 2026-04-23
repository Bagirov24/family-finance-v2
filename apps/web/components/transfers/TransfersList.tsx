'use client'
import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useTransfers } from '@/hooks/useTransfers'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'
import { TransferCard } from './TransferCard'
import { TransferHistoryFilters, EMPTY_FILTERS } from './TransferHistoryFilters'
import type { TransferFilters } from './TransferHistoryFilters'
import { Skeleton } from '@/components/ui/skeleton'

export function TransfersList() {
  const t = useTranslations('transfers')
  const { userId } = useUIStore()
  const { history, isLoading } = useTransfers()
  const { members } = useFamily()

  const [filters, setFilters] = useState<TransferFilters>(EMPTY_FILTERS)

  const familyMembers = useMemo(
    () => (members ?? []).map(m => ({ user_id: m.user_id, display_name: m.display_name })),
    [members]
  )

  const filtered = useMemo(() => {
    return history.filter(tx => {
      // Фильтр по участнику — tx должен включать этого участника с любой стороны
      if (filters.memberId) {
        const involves =
          tx.from_user_id === filters.memberId ||
          tx.to_user_id   === filters.memberId
        if (!involves) return false
      }
      // Фильтр по статусу
      if (filters.status && tx.status !== filters.status) return false
      // Дата от
      const txDate = (tx.created_at ?? tx.date ?? '').slice(0, 10)
      if (filters.dateFrom && txDate < filters.dateFrom) return false
      // Дата до
      if (filters.dateTo && txDate > filters.dateTo) return false
      return true
    })
  }, [history, filters])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (!userId || !history.length) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        💸 {t('no_transfers')}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <TransferHistoryFilters
        filters={filters}
        onChange={setFilters}
        members={familyMembers}
        myUserId={userId ?? ''}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {t('filter_empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map(tx => (
            <li key={tx.id}>
              <TransferCard transfer={tx} myUserId={userId!} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
