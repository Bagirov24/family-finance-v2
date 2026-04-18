'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUIStore } from '@/store/ui.store'
import { useAccounts } from '@/hooks/useAccounts'
import { useFamily } from '@/hooks/useFamily'
import { useTransfers } from '@/hooks/useTransfers'

export function TransferModal() {
  const t = useTranslations('transfers')
  const tc = useTranslations('common')
  const { addTransferOpen, setAddTransferOpen } = useUIStore()
  const { family, members, currentUserId } = useFamily()
  const { accounts } = useAccounts()
  const { createTransfer } = useTransfers()

  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [toUserId, setToUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const otherMembers = members.filter(m => m.user_id !== currentUserId)

  function reset() {
    setFromAccountId('')
    setToAccountId('')
    setToUserId('')
    setAmount('')
    setNote('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromAccountId || !toAccountId || !toUserId || !amount || !family?.id) return
    try {
      await createTransfer.mutateAsync({
        family_id: family.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        to_user_id: toUserId,
        amount: parseFloat(amount),
        note: note || undefined,
      })
      toast.success(t('created'))
      setAddTransferOpen(false)
      reset()
    } catch {
      toast.error(tc('error'))
    }
  }

  return (
    <Dialog open={addTransferOpen} onOpenChange={setAddTransferOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{tc('amount')}</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="text-lg font-semibold tabular-nums"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('from_account')}</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId} required>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
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

          {otherMembers.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t('recipient')}</Label>
              <Select value={toUserId} onValueChange={setToUserId} required>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {otherMembers.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.display_name ?? m.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{tc('note')}</Label>
            <Input
              placeholder={tc('note')}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddTransferOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={createTransfer.isPending}>
              {createTransfer.isPending ? tc('loading') : t('send')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
