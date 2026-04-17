'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTransfers } from '@/hooks/useTransfers'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'
import { toast } from 'sonner'

export function TransferModal() {
  const t = useTranslations('transfers')
  const open = useUIStore(s => s.addTransferOpen)
  const setOpen = useUIStore(s => s.setAddTransferOpen)
  const userId = useUIStore(s => s.userId)

  const { family, members } = useFamily()
  const { createTransfer } = useTransfers()

  const [toUserId, setToUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const otherMembers = (members ?? []).filter(m => m.user_id !== userId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!family || !userId || !toUserId || !amount) return
    setLoading(true)
    try {
      await createTransfer.mutateAsync({
        family_id: family.id,
        from_user_id: userId,
        to_user_id: toUserId,
        amount: parseFloat(amount),
        note: note || undefined,
      })
      toast.success(t('sent'))
      setOpen(false)
      setAmount('')
      setNote('')
      setToUserId('')
    } catch {
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('sendMoney')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>{t('to')}</Label>
            <Select value={toUserId} onValueChange={setToUserId} required>
              <SelectTrigger><SelectValue placeholder={t('selectMember')} /></SelectTrigger>
              <SelectContent>
                {otherMembers.map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.display_name ?? m.user_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('amount')}</Label>
            <Input
              type="number" min="0.01" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" required autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label>{t('note')}</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder={t('notePlaceholder')} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('sending') : t('send')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
