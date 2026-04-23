'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ArrowRightLeft, HandCoins } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { useAccounts } from '@/hooks/useAccounts'
import { useFamily } from '@/hooks/useFamily'
import { useTransfers } from '@/hooks/useTransfers'

type Mode = 'send' | 'request'

const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

export function TransferModal() {
  const t = useTranslations('transfers')
  const tc = useTranslations('common')
  const { addTransferOpen, setAddTransferOpen } = useUIStore()
  const { family, members, currentUserId } = useFamily()
  const { accounts } = useAccounts()
  const { createTransfer, createRequest } = useTransfers()

  const [mode, setMode] = useState<Mode>('send')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [toUserId, setToUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const otherMembers = members
    .filter(m => m.user_id != null && m.user_id !== currentUserId) as (typeof members[number] & { user_id: string })[]
  const hasFamily = !!family?.id && otherMembers.length > 0

  function reset() {
    setMode('send')
    setFromAccountId('')
    setToAccountId('')
    setToUserId('')
    setAmount('')
    setNote('')
  }

  function handleClose() {
    setAddTransferOpen(false)
    reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !toUserId) return
    if (!family?.id) { toast.error(t('no_family')); return }
    if (toUserId === currentUserId) { toast.error(t('errors.selfTransfer')); return }

    if (!note.trim()) { toast.error(t('errors.noteRequired')); return }

    if (mode === 'request') {
      try {
        await createRequest.mutateAsync({
          family_id: family.id,
          to_user_id: toUserId,
          amount: parseFloat(amount),
          note: note.trim(),
        })
        toast.success(t('requested'))
        handleClose()
      } catch {
        toast.error(tc('error'))
      }
      return
    }

    if (!fromAccountId || !toAccountId) return
    try {
      await createTransfer.mutateAsync({
        family_id: family.id,
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        to_user_id: toUserId,
        amount: parseFloat(amount),
        note: note.trim(),
        transfer_type: 'send',
      })
      toast.success(t('created'))
      handleClose()
    } catch {
      toast.error(tc('error'))
    }
  }

  const isPending = createTransfer.isPending || createRequest.isPending

  return (
    <Sheet open={addTransferOpen} onOpenChange={setAddTransferOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === 'send' ? t('title') : t('request_title')}</SheetTitle>
        </SheetHeader>

        {!hasFamily ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('no_family')}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">

            <div className="flex gap-2 p-1 rounded-xl bg-muted">
              <button
                type="button"
                onClick={() => setMode('send')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === 'send'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ArrowRightLeft size={14} />
                {t('send')}
              </button>
              <button
                type="button"
                onClick={() => setMode('request')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === 'request'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <HandCoins size={14} />
                {t('request')}
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>{tc('amount')}</Label>
              <Input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
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
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className={cn(
                      'px-3 py-1 rounded-full border text-xs font-medium transition-colors',
                      amount === String(v)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    {v.toLocaleString('ru')}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'send' && (
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
            )}

            <div className="space-y-1.5">
              <Label>{mode === 'send' ? t('recipient') : t('request_from')}</Label>
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

            <div className="space-y-1.5">
              <Label>
                {mode === 'request' ? t('request_reason') : tc('note')}
                <span className="text-destructive ml-0.5">*</span>
              </Label>
              <Textarea
                placeholder={
                  mode === 'request'
                    ? t('request_reason_placeholder')
                    : t('note_placeholder')
                }
                value={note}
                onChange={e => setNote(e.target.value)}
                required
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={handleClose}
              >
                {tc('cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11"
                disabled={isPending}
              >
                {isPending
                  ? tc('loading')
                  : mode === 'send' ? t('send') : t('request_send')}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
