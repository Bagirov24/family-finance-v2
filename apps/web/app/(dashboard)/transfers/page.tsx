'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTransfers } from '@/hooks/useTransfers'
import { useAccounts } from '@/hooks/useAccounts'
import { useFamily } from '@/hooks/useFamily'
import { formatAmount, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Check, X, ArrowRight, Plus } from 'lucide-react'

export default function TransfersPage() {
  const t = useTranslations()
  const { pending, history, userId, createTransfer, respondTransfer, isLoading } = useTransfers()
  const { accounts } = useAccounts()
  const { members, family } = useFamily()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ to_user_id: '', from_account_id: '', to_account_id: '', amount: '', note: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const recipientMembers = members.filter(m => m.user_id !== userId)

  const handleSend = async () => {
    if (!family || !form.to_user_id || !form.from_account_id || !form.to_account_id || !form.amount) return
    await createTransfer.mutateAsync({
      to_user_id: form.to_user_id,
      from_account_id: form.from_account_id,
      to_account_id: form.to_account_id,
      amount: parseFloat(form.amount),
      note: form.note || undefined,
      family_id: family.id
    })
    setOpen(false)
    setForm({ to_user_id: '', from_account_id: '', to_account_id: '', amount: '', note: '' })
  }

  const statusColor = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-green-100 text-green-700', declined: 'bg-red-100 text-red-700' }
  const statusLabel = { pending: t('transfers.pending'), confirmed: t('transfers.confirmed'), declined: t('transfers.declined') }

  return (
    <div className="p-4 space-y-5 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('transfers.title')}</h1>
        <Button size="sm" className="gap-1 rounded-xl" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />{t('transfers.send')}
        </Button>
      </div>

      {/* Pending incoming */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Входящие</h2>
          {pending.map(tr => (
            <div key={tr.id} className="bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{formatAmount(Number(tr.amount))}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tr.note || 'Перевод от участника семьи'}</p>
                </div>
                <Badge className={cn('text-xs', statusColor.pending)}>{statusLabel.pending}</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="default" className="flex-1 gap-1 rounded-xl"
                  disabled={respondTransfer.isPending}
                  onClick={() => respondTransfer.mutate({ transfer_id: tr.id, action: 'confirmed' })}
                >
                  <Check className="w-4 h-4" />{t('transfers.accept')}
                </Button>
                <Button
                  size="sm" variant="outline" className="flex-1 gap-1 rounded-xl"
                  disabled={respondTransfer.isPending}
                  onClick={() => respondTransfer.mutate({ transfer_id: tr.id, action: 'declined' })}
                >
                  <X className="w-4 h-4" />{t('transfers.decline')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">{t('transfers.history')}</h2>
        {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{t('transfers.no_transfers')}</p>}
        {history.map(tr => {
          const isOutgoing = tr.from_user_id === userId
          return (
            <div key={tr.id} className="bg-card border rounded-2xl p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isOutgoing ? 'bg-red-50' : 'bg-green-50')}>
                <ArrowRight className={cn('w-5 h-5', isOutgoing ? 'text-red-500' : 'text-green-500 rotate-180')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{tr.note || (isOutgoing ? 'Исходящий перевод' : 'Входящий перевод')}</p>
                <p className="text-xs text-muted-foreground">{tr.from_account?.name} → {tr.to_account?.name} · {formatDate(tr.date)}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-semibold', isOutgoing ? 'text-destructive' : 'text-green-600')}>
                  {isOutgoing ? '-' : '+'}{formatAmount(Number(tr.amount))}
                </p>
                <Badge className={cn('text-xs mt-0.5', statusColor[tr.status as keyof typeof statusColor])}>
                  {statusLabel[tr.status as keyof typeof statusLabel]}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>

      {/* New transfer dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{t('transfers.send')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>{t('transfers.recipient')}</Label>
              <Select value={form.to_user_id} onValueChange={v => set('to_user_id', v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Выберите участника" />
                </SelectTrigger>
                <SelectContent>
                  {recipientMembers.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>{m.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('transfers.from_account')}</Label>
              <Select value={form.from_account_id} onValueChange={v => set('from_account_id', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="С какого счёта" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name} · {formatAmount(Number(a.balance))}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('transfers.to_account')}</Label>
              <Select value={form.to_account_id} onValueChange={v => set('to_account_id', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="На какой счёт" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('common.amount')}</Label>
              <Input type="number" placeholder="0" className="rounded-xl" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('common.note')}</Label>
              <Input placeholder="Необязательно" className="rounded-xl" value={form.note} onChange={e => set('note', e.target.value)} />
            </div>
            <Button className="w-full rounded-xl" disabled={createTransfer.isPending} onClick={handleSend}>
              {createTransfer.isPending ? t('common.loading') : t('transfers.send')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
