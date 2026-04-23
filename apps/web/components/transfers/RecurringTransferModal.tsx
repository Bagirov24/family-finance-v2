'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useFamily } from '@/hooks/useFamily'
import { useAccounts } from '@/hooks/useAccounts'
import { useRecurringTransfers, type RecurrenceRule } from '@/hooks/useRecurringTransfers'

const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

const RULES: { value: RecurrenceRule; labelKey: string }[] = [
  { value: 'daily',   labelKey: 'rule_daily' },
  { value: 'weekly',  labelKey: 'rule_weekly' },
  { value: 'monthly', labelKey: 'rule_monthly' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function RecurringTransferModal({ open, onClose }: Props) {
  const t  = useTranslations('transfers')
  const tc = useTranslations('common')
  const { family, members, currentUserId } = useFamily()
  const { accounts } = useAccounts()
  const { create } = useRecurringTransfers()

  const [toUserId,       setToUserId]       = useState('')
  const [fromAccountId,  setFromAccountId]  = useState('')
  const [toAccountId,    setToAccountId]    = useState('')
  const [amount,         setAmount]         = useState('')
  const [rule,           setRule]           = useState<RecurrenceRule>('monthly')
  const [nextRunAt,      setNextRunAt]      = useState('')
  const [note,           setNote]           = useState('')

  const otherMembers = members.filter(
    m => m.user_id != null && m.user_id !== currentUserId,
  ) as (typeof members[number] & { user_id: string })[]

  function reset() {
    setToUserId(''); setFromAccountId(''); setToAccountId('')
    setAmount(''); setRule('monthly'); setNextRunAt(''); setNote('')
  }

  function handleClose() { onClose(); reset() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!family?.id) { toast.error(t('no_family')); return }
    if (!amount || !toUserId || !fromAccountId || !toAccountId) return
    if (!note.trim()) { toast.error(t('errors.noteRequired')); return }

    try {
      await create.mutateAsync({
        family_id:       family.id,
        to_user_id:      toUserId,
        from_account_id: fromAccountId,
        to_account_id:   toAccountId,
        amount:          parseFloat(amount),
        note:            note.trim(),
        recurrence_rule: rule,
        next_run_at:     nextRunAt || undefined,
      })
      toast.success(t('recurring_created'))
      handleClose()
    } catch {
      toast.error(tc('error'))
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('recurring_title')}</SheetTitle>
        </SheetHeader>

        {!family?.id || otherMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('no_family')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">

            {/* Сумма */}
            <div className="space-y-1.5">
              <Label>{tc('amount')}</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0.01" step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="text-lg font-semibold tabular-nums h-12"
                autoFocus
              />
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_AMOUNTS.map(v => (
                  <button
                    key={v} type="button"
                    onClick={() => setAmount(String(v))}
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                      amount === String(v)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {v.toLocaleString('ru')}
                  </button>
                ))}
              </div>
            </div>

            {/* Счета */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('from_account')}</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId} required>
                  <SelectTrigger className="h-11"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id} disabled={a.id === toAccountId}>
                        {a.icon ?? '💳'} {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('to_account')}</Label>
                <Select value={toAccountId} onValueChange={setToAccountId} required>
                  <SelectTrigger className="h-11"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id} disabled={a.id === fromAccountId}>
                        {a.icon ?? '💳'} {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Получатель */}
            <div className="space-y-1.5">
              <Label>{t('recipient')}</Label>
              <Select value={toUserId} onValueChange={setToUserId} required>
                <SelectTrigger className="h-11"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {otherMembers.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.display_name ?? m.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Периодичность */}
            <div className="space-y-1.5">
              <Label>{t('recurrence_rule')}</Label>
              <Select value={rule} onValueChange={v => setRule(v as RecurrenceRule)} required>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RULES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{t(r.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Дата первого запуска */}
            <div className="space-y-1.5">
              <Label>{t('first_run_at')}</Label>
              <Input
                type="date"
                value={nextRunAt}
                onChange={e => setNextRunAt(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">{t('first_run_hint')}</p>
            </div>

            {/* Заметка */}
            <div className="space-y-1.5">
              <Label>
                {tc('note')}
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Textarea
                placeholder={t('note_placeholder')}
                value={note}
                onChange={e => setNote(e.target.value)}
                required rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={handleClose}>
                {tc('cancel')}
              </Button>
              <Button type="submit" className="flex-1 h-11" disabled={create.isPending}>
                {create.isPending ? tc('loading') : t('recurring_save')}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
