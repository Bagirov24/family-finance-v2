'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'
import { toast } from 'sonner'

export function AddTransactionModal() {
  const t = useTranslations('transactions')
  const open = useUIStore(s => s.addTransactionOpen)
  const setOpen = useUIStore(s => s.setAddTransactionOpen)
  const userId = useUIStore(s => s.userId)

  const { family } = useFamily()
  const { accounts } = useAccounts()
  const { data: categories } = useCategories()
  const { create } = useTransactions({})

  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const filteredCategories = (categories ?? []).filter(c => c.type === type || c.type === 'both')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!family || !userId || !accountId || !amount) return
    setLoading(true)
    try {
      await create.mutateAsync({
        family_id: family.id,
        user_id: userId,
        account_id: accountId,
        category_id: categoryId || undefined,
        type,
        amount: parseFloat(amount),
        note: note || undefined,
        date,
        source: 'manual',
      })
      toast.success(t('added'))
      setOpen(false)
      setAmount('')
      setNote('')
      setCategoryId('')
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
          <DialogTitle>{t('add')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={type} onValueChange={v => setType(v as 'expense' | 'income')}>
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">{t('expense')}</TabsTrigger>
              <TabsTrigger value="income" className="flex-1">{t('income')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-1">
            <Label>{t('amount')}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label>{t('account')}</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger><SelectValue placeholder={t('selectAccount')} /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('category')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
              <SelectContent>
                {filteredCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {t(`categories.${c.name_key}`, { defaultValue: c.name_key })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('date')}</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>{t('note')}</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder={t('notePlaceholder')} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('saving') : t('save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
