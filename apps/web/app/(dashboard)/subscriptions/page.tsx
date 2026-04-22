'use client'
import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useSubscriptions, useDeleteSubscription } from '@/hooks/useSubscriptions'
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard'
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount } from '@/lib/formatters'
import type { Subscription } from '@/hooks/useSubscriptions'

// Приводим любую подписку к месячной стоимости
function toMonthly(s: Subscription): number {
  if (!s.is_active) return 0
  if (s.billing_cycle === 'yearly') return s.amount / 12
  if (s.billing_cycle === 'weekly') return s.amount * 4.33
  return s.amount
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions')
  const tc = useTranslations('common')
  const { subscriptions, isLoading } = useSubscriptions()
  const deleteSubscription = useDeleteSubscription()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)

  function handleEdit(s: Subscription) {
    setEditing(s)
    setFormOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      await deleteSubscription.mutateAsync(id)
      toast.success(tc('success'))
    } catch {
      toast.error(tc('error'))
    }
  }

  // Суммарные цифры (только активные)
  const { monthlyTotal, yearlyTotal, currency } = useMemo(() => {
    const active = subscriptions.filter(s => s.is_active)
    const monthly = active.reduce((sum, s) => sum + toMonthly(s), 0)
    const cur = active[0]?.currency ?? 'RUB'
    return { monthlyTotal: monthly, yearlyTotal: monthly * 12, currency: cur }
  }, [subscriptions])

  // Секция «Скоро» — активные, ближайшие 7 дней
  const upcoming = useMemo(
    () => subscriptions.filter(s => s.is_active && daysUntil(s.next_billing_date) <= 7),
    [subscriptions]
  )

  // Остальные
  const rest = useMemo(
    () => subscriptions.filter(s => !s.is_active || daysUntil(s.next_billing_date) > 7),
    [subscriptions]
  )

  const hasSubscriptions = subscriptions.length > 0

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Заголовок + кнопка */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus size={16} className="mr-1" />{t('add')}
        </Button>
      </div>

      {/* Шапка с суммарными цифрами */}
      {!isLoading && hasSubscriptions && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{t('per_month')}</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatAmount(monthlyTotal, currency)}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{t('per_year')}</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatAmount(yearlyTotal, currency)}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : !hasSubscriptions ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-4xl mb-3">📦</p>
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Секция «Скоро» */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                🔔 {t('upcoming')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {upcoming.map(s => (
                  <SubscriptionCard
                    key={s.id}
                    subscription={s}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Остальные подписки */}
          {rest.length > 0 && (
            <div className="space-y-3">
              {upcoming.length > 0 && (
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('all')}
                </h2>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {rest.map(s => (
                  <SubscriptionCard
                    key={s.id}
                    subscription={s}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <SubscriptionForm
        open={formOpen}
        onOpenChange={v => { setFormOpen(v); if (!v) setEditing(null) }}
        initial={editing}
      />
    </div>
  )
}
