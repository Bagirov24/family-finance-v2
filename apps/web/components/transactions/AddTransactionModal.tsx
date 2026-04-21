'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUIStore } from '@/store/ui.store'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { useFamily } from '@/hooks/useFamily'

export function AddTransactionModal() {
  const t = useTranslations('transaction')
  const tc = useTranslations('common')
  const tcat = useTranslations('categories')
  const { addTransactionOpen, setAddTransactionOpen } = useUIStore()
  const { family } = useFamily()
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')

  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories(type)
  const { mutateAsync, isPending } = useCreateTransaction()

  function reset() {
    setAmount('')
    setCategoryId('')
    setNote('')
    setDate(new Date().toISOString().split('T')[0])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !accountId || !family?.id) return
    try {
      await mutateAsync({
        family_id: family.id,
        account_id: accountId,
        category_id: categoryId || undefined,
        amount: parseFloat(amount),
        type,
        date,
        note: note || undefined,
      })
      toast.success(type === 'income' ? t('addedIncome') : t('addedExpense'))
      setAddTransactionOpen(false)
      reset()
    } catch {
      toast.error(tc('error'))
    }
  }

  return (
    <Sheet
      open={addTransactionOpen}
      onOpenChange={open => {
        if (!open) { setAddTransactionOpen(false); reset() }
        else setAddTransactionOpen(true)
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('add')}</SheetTitle>
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
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>{tc('account')}</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
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
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11"
              onClick={() => { setAddTransactionOpen(false); reset() }}
            >
              {tc('cancel')}
            </Button>
            <Button type="submit" className="flex-1 h-11" disabled={isPending}>
              {isPending ? tc('loading') : tc('add')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
