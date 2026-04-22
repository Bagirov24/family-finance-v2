'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSubscription, useUpdateSubscription } from '@/hooks/useSubscriptions'
import type { Subscription } from '@/hooks/useSubscriptions'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Subscription | null
}

const today = () => new Date().toISOString().split('T')[0]

const EMPTY = {
  name: '',
  amount: '',
  billing_cycle: 'monthly' as Subscription['billing_cycle'],
  next_billing_date: today(),   // NOT NULL — default to today
  icon: '📦',
  color: '#6366F1',
  is_active: true,
  currency: 'RUB',
}

export function SubscriptionForm({ open, onOpenChange, initial }: Props) {
  const t = useTranslations('subscriptions')
  const tc = useTranslations('common')
  const create = useCreateSubscription()
  const update = useUpdateSubscription()

  const [form, setForm] = useState(EMPTY)
  const isEdit = !!initial

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        amount: String(initial.amount),
        billing_cycle: initial.billing_cycle,
        next_billing_date: initial.next_billing_date ?? today(),
        icon: initial.icon ?? '📦',
        color: initial.color ?? '#6366F1',
        is_active: initial.is_active,
        currency: initial.currency,
      })
    } else {
      setForm({ ...EMPTY, next_billing_date: today() })
    }
  }, [initial, open])

  function set(field: keyof typeof EMPTY, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.amount || !form.next_billing_date) return
    const payload = {
      name: form.name.trim(),
      amount: parseFloat(form.amount),
      billing_cycle: form.billing_cycle,
      next_billing_date: form.next_billing_date,  // always a valid date string
      icon: form.icon || '📦',
      color: form.color || '#6366F1',
      is_active: form.is_active,
      currency: form.currency || 'RUB',
    }
    try {
      if (isEdit) {
        await update.mutateAsync({ id: initial!.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      toast.success(isEdit ? tc('success') : t('created'))
      onOpenChange(false)
    } catch {
      toast.error(tc('error'))
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit') : t('add')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t('name_label')}</Label>
            <Input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder={t('name_placeholder')}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{tc('amount')}</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('billing_cycle')}</Label>
              <select
                value={form.billing_cycle}
                onChange={e => set('billing_cycle', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="monthly">{t('monthly')}</option>
                <option value="yearly">{t('yearly')}</option>
                <option value="weekly">{t('weekly')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('next_billing')} *</Label>
            <Input
              type="date"
              value={form.next_billing_date}
              onChange={e => set('next_billing_date', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('icon')}</Label>
              <Input
                value={form.icon}
                onChange={e => set('icon', e.target.value)}
                placeholder="📦"
                maxLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tc('currency')}</Label>
              <Input
                value={form.currency}
                onChange={e => set('currency', e.target.value)}
                placeholder="RUB"
                maxLength={3}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? tc('loading') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
