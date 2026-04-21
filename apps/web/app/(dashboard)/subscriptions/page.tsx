'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useSubscriptions, useDeleteSubscription } from '@/hooks/useSubscriptions'
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard'
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Subscription } from '@/hooks/useSubscriptions'

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

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true) }}>
          <Plus size={16} className="mr-1" />{t('add')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : !subscriptions.length ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-4xl mb-3">📦</p>
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {subscriptions.map(s => (
            <SubscriptionCard
              key={s.id}
              subscription={s}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
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
