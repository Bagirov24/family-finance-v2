'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateSubscription, useUpdateSubscription } from '@/hooks/useSubscriptions'
import { useAccounts } from '@/hooks/useAccounts'
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
  next_billing_date: today(),
  icon: '📦',
  color: '#6366F1',
  is_active: true,
  currency: 'RUB',
  account_id: '',
  reminder_days: '3',
  auto_create_tx: false,
}

export function SubscriptionForm({ open, onOpenChange, initial }: Props) {
  const t = useTranslations('subscriptions')
  const tc = useTranslations('common')
  const create = useCreateSubscription()
  const update = useUpdateSubscription()
  const { accounts } = useAccounts()

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
        account_id: initial.account_id ?? '',
        reminder_days: String(initial.reminder_days ?? 3),
        auto_create_tx: initial.auto_create_tx ?? false,
      })
    } else {
      setForm({ ...EMPTY, next_billing_date: today() })
    }
  }, [initial, open])

  function set<K extends keyof typeof EMPTY>(field: K, value: typeof EMPTY[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.amount || !form.next_billing_date) return
    const payload = {
      name: form.name.trim(),
      amount: parseFloat(form.amount),
      billing_cycle: form.billing_cycle,
      next_billing_date: form.next_billing_date,
      icon: form.icon || '📦',
      color: form.color || '#6366F1',
      is_active: form.is_active,
      currency: form.currency || 'RUB',
      account_id: form.account_id || null,
      reminder_days: parseInt(form.reminder_days, 10) || 3,
      auto_create_tx: form.auto_create_tx,
    }
    try {
      if (initial) {
        // Use proper type guard instead of non-null assertion (initial!.id)
        await update.mutateAsync({ id: initial.id, ...payload })
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
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit') : t('add')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Название */}
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

          {/* Сумма + цикл */}
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
                onChange={e => set('billing_cycle', e.target.value as Subscription['billing_cycle'])}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="monthly">{t('monthly')}</option>
                <option value="yearly">{t('yearly')}</option>
                <option value="weekly">{t('weekly')}</option>
              </select>
            </div>
          </div>

          {/* Дата следующего списания */}
          <div className="space-y-1.5">
            <Label>{t('next_billing')} *</Label>
            <Input
              type="date"
              value={form.next_billing_date}
              onChange={e => set('next_billing_date', e.target.value)}
              required
            />
          </div>

          {/* Счёт списания */}
          <div className="space-y-1.5">
            <Label>{tc('account')}</Label>
            <Select value={form.account_id} onValueChange={v => set('account_id', v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('no_account')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('no_account')}</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.icon ?? '💳'} {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Напоминание */}
          <div className="space-y-1.5">
            <Label>{t('reminder_days')}</Label>
            <select
              value={form.reminder_days}
              onChange={e => set('reminder_days', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="0">{t('no_reminder')}</option>
              <option value="1">1 {t('days_before')}</option>
              <option value="3">3 {t('days_before')}</option>
              <option value="7">7 {t('days_before')}</option>
              <option value="14">14 {t('days_before')}</option>
            </select>
          </div>

          {/* Авто-транзакция */}
          <label className="flex items-center gap-3 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={form.auto_create_tx}
              onChange={e => set('auto_create_tx', e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm">{t('auto_create_tx')}</span>
          </label>

          {/* Иконка + цвет + валюта */}
          <div className="grid grid-cols-3 gap-3">
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
              <Label>{t('color') ?? 'Цвет'}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => set('color', e.target.value)}
                  className="h-9 w-full rounded-md border border-input cursor-pointer p-0.5 bg-background"
                />
              </div>
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
