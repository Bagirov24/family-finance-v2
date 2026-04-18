'use client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateTransaction, Transaction } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'

interface Props {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

export function EditTransactionModal({ transaction: tx, open, onClose }: Props) {
  const t = useTranslations('transactions')
  const tc = useTranslations('common')
  const tcat = useTranslations('categories')

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')

  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories(type)
  const { mutateAsync, isPending } = useUpdateTransaction()

  useEffect(() => {
    if (!tx) return
    setType(tx.type)
    setAmount(String(tx.amount))
    setAccountId(tx.account_id)
    setCategoryId(tx.category_id ?? '')
    setDate(tx.date)
    setNote(tx.note ?? '')
  }, [tx])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tx || !amount || !accountId) return
    try {
      await mutateAsync({
        id: tx.id,
        account_id: accountId,
        category_id: categoryId || null,
        amount: parseFloat(amount),
        type,
        date,
        note: note || null,
      })
      toast.success(t('updated'))
      onClose()
    } catch {
      toast.error(tc('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('edit')}</DialogTitle>
        </DialogHeader>

        <div className="flex rounded-xl overflow-hidden border border-border">
          {(['expense', 'income'] as const).map(currentType => (
            <button
              key={currentType}
              type="button"
              onClick={() => { setType(currentType); setCategoryId('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === currentType
                  ? currentType === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                  : 'hover:bg-accent text-muted-foreground'
              }`}
            >
              {currentType === 'expense' ? `− ${t('expense')}` : `+ ${t('income')}`}
            </button>
          ))}
        </div>

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
            />
          </div>

          <div className="space-y-1.5">
            <Label>{tc('account')}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder={tc('account')} /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{tc('category')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder={tc('category')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">{tc('all')}</SelectItem>
                {categories?.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {tcat(c.name_key as Parameters<typeof tcat>[0], { defaultValue: c.name_key })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{tc('date')}</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>{tc('note')}</Label>
            <Input
              placeholder={tc('note')}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
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
