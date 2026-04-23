'use client'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useTransactions } from '@/hooks/useTransactions'
import { useFamily } from '@/hooks/useFamily'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Разбивка расходов по членам семьи за активный период.
 * Данные берутся из кеша useTransactions — нулевой RTT, без дополнительных запросов.
 * Показывается только если в семье больше одного участника.
 */
export function WhoSpentWhat() {
  const t = useTranslations('overview')
  const { family, members } = useFamily()
  const { transactions, isLoading } = useTransactions({ familyId: family?.id })
  const currency = family?.currency ?? 'RUB'

  const rows = useMemo(() => {
    if (!members?.length) return []

    // Суммируем расходы по user_id из уже закешированных транзакций
    const map: Record<string, number> = {}
    for (const tx of transactions) {
      if (tx.type !== 'expense') continue
      map[tx.user_id] = (map[tx.user_id] ?? 0) + Number(tx.amount)
    }

    const total = Object.values(map).reduce((s, v) => s + v, 0)
    if (total === 0) return []

    return members
      .filter(m => m.user_id != null)
      .map(m => {
        const uid = m.user_id!
        return {
          userId: uid,
          name: m.display_name ?? uid.slice(0, 8),
          avatar: m.avatar_url ?? null,
          amount: map[uid] ?? 0,
          pct: total > 0 ? Math.round(((map[uid] ?? 0) / total) * 100) : 0,
        }
      })
      .filter(r => r.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, members])

  // Не рендерим если семья одиночная — нет смысла показывать одного
  if (!isLoading && (rows.length <= 1 || !members || members.length <= 1)) return null

  return (
    <section>
      <h2 className="text-base font-semibold mb-3">{t('who_spent_what')}</h2>
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))
        ) : (
          rows.map((row, i) => (
            <div key={row.userId} className="flex items-center gap-3">
              {/* Аватар или инициал */}
              <div className="h-8 w-8 rounded-full shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {row.avatar
                  ? <img src={row.avatar} alt={row.name} className="h-full w-full object-cover" />
                  : row.name[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{row.name}</span>
                  <span className="text-sm font-semibold tabular-nums shrink-0 ml-2 text-muted-foreground">
                    {row.pct}%
                  </span>
                </div>
                {/* Прогресс-бар: у лидера полная ширина, остальные пропорционально */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${row.pct}%`,
                      backgroundColor: 'var(--color-primary, hsl(var(--primary)))',
                      opacity: i === 0 ? 1 : 0.55,
                    }}
                  />
                </div>
              </div>

              <span className="text-sm font-semibold tabular-nums shrink-0">
                {formatAmount(row.amount, currency)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
