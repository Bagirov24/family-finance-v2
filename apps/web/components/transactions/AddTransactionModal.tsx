'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useUIStore } from '@/store/ui.store'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useFamily } from '@/hooks/useFamily'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

const supabase = createClient()

export function AddTransactionModal() {
  const t = useTranslations()
  const { addTransactionOpen, setAddTransactionOpen } = useUIStore()
  const { create } = useTransactions()
  const { accounts } = useAccounts()
  const { family, currentUserId } = useFamily()
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [form, setForm] = useState({ amount: '', account_id: '', category_id: '', note: '', date: new Date().toISOString().split('T')[0] })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: categories } = useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', type)
        .order('name_key')
      if (error) throw error
      return data
    }
  })

  const handleSubmit = async () => {
    if (!family || !currentUserId || !form.amount || !form.account_id) return
    await create.mutateAsync({
      family_id: family.id,
      account_id: form.account_id,
      user_id: currentUserId,
      type,
      amount: parseFloat(form.amount),
      category_id: form.category_id || undefined,
      note: form.note || undefined,
      date: form.date,
      source: 'manual'
    })
    setAddTransactionOpen(false)
    setForm({ amount: '', account_id: '', category_id: '', note: '', date: new Date().toISOString().split('T')[0] })
  }

  return (
    <Dialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen}>
      <DialogContent className="rounded-2xl max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>{t('transactions.add')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Type selector */}
          <div className="flex gap-1 bg-muted p-1 rounded-xl">
            {(['expense', 'income'] as const).map(tp => (
              <button
                key={tp}
                onClick={() => { setType(tp); set('category_id', '') }}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  type === tp ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                )}
              >
                {tp === 'expense' ? t('common.expense') : t('common.income')}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <Label>{t('common.amount')}</Label>
            <Input type="number" className="rounded-xl text-lg" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>{t('common.account')}</Label>
            <Select value={form.account_id} onValueChange={v => set('account_id', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Выберите счёт" /></SelectTrigger>
              <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t('common.category')}</Label>
            <Select value={form.category_id} onValueChange={v => set('category_id', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Выберите" /></SelectTrigger>
              <SelectContent>
                {(categories ?? []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{t(`categories.${c.name_key}` as 'categories.groceries')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>{t('common.date')}</Label>
              <Input type="date" className="rounded-xl" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('common.note')}</Label>
              <Input className="rounded-xl" placeholder="Необязательно" value={form.note} onChange={e => set('note', e.target.value)} />
            </div>
          </div>

          <Button className="w-full rounded-xl" disabled={create.isPending} onClick={handleSubmit}>
            {create.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
