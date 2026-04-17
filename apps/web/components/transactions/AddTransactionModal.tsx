'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUIStore } from '@/store/ui.store'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'

export function AddTransactionModal() {
  const { addTransactionOpen, setAddTransactionOpen } = useUIStore()
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [comment, setComment] = useState('')

  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories(type)
  const { mutateAsync, isPending } = useCreateTransaction()

  function reset() {
    setAmount('')
    setCategoryId('')
    setComment('')
    setDate(new Date().toISOString().split('T')[0])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !accountId) return
    try {
      await mutateAsync({
        account_id: accountId,
        category_id: categoryId || undefined,
        amount: parseFloat(amount),
        type,
        date,
        comment: comment || undefined,
      })
      toast.success(type === 'income' ? 'Доход добавлен' : 'Расход добавлен')
      setAddTransactionOpen(false)
      reset()
    } catch {
      toast.error('Ошибка при сохранении')
    }
  }

  return (
    <Dialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Добавить транзакцию</DialogTitle>
        </DialogHeader>

        {/* Type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-border">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); setCategoryId('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                type === t
                  ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                  : 'hover:bg-accent text-muted-foreground'
              }`}
            >
              {t === 'expense' ? '− Расход' : '+ Доход'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Сумма</Label>
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

          {/* Account */}
          <div className="space-y-1.5">
            <Label>Счёт</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger>
                <SelectValue placeholder="Выберите счёт" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.emoji} {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Категория</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Без категории" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Дата</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <Label>Комментарий</Label>
            <Input
              placeholder="Необязательно"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddTransactionOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Сохранение...' : 'Добавить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
