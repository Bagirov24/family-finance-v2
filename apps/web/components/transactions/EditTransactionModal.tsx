'use client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
  const t = useTranslations('transaction')
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
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('edit')}</SheetTitle>
        </SheetHeader>

        <div className="flex rounded-xl overflow-hidden border border-border mb-3">
          {(['expense', 'income'] as const).map(currentType => (
            <button
              key={currentType}
              type="button"
              onClick={() => { setType(currentType); setCategoryId('') }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
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
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="text-lg font-semibold tabular-nums h-12"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{tc('account')}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="h-11"><SelectValue placeholder={t('selectAccount')} /></SelectTrigger>
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
              <SelectTrigger className="h-11"><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('noCategory')}</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {tcat(c.name_key as Parameters<typeof tcat>[0], { defaultValue: c.name_key })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{tc('date')}</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="h-11" />
          </div>

          <div className="space-y-1.5">
            <Label>{tc('note')}</Label>
            <Input
              placeholder={tc('note')}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="h-11"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-11" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button type="submit" className="flex-1 h-11" disabled={isPending}>
              {isPending ? tc('loading') : tc('save')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
