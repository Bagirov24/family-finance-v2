'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAccounts } from '@/hooks/useAccounts'
import { useFamily } from '@/hooks/useFamily'
import { formatAmount } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Wallet, CreditCard, PiggyBank, TrendingUp } from 'lucide-react'

const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  cash: Wallet, card: CreditCard, savings: PiggyBank, investment: TrendingUp
}

export default function AccountsPage() {
  const t = useTranslations()
  const { accounts, totalBalance, isLoading, createAccount } = useAccounts()
  const { family, currentUserId } = useFamily()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'card', balance: '', color: '#6366F1' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!family || !currentUserId || !form.name) return
    await createAccount.mutateAsync({
      name: form.name,
      type: form.type,
      balance: parseFloat(form.balance) || 0,
      color: form.color,
      family_id: family.id,
      owner_user_id: currentUserId
    })
    setOpen(false)
    setForm({ name: '', type: 'card', balance: '', color: '#6366F1' })
  }

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('accounts.title')}</h1>
        <Button size="sm" className="gap-1 rounded-xl" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />{t('accounts.add')}
        </Button>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-5">
        <p className="text-indigo-200 text-sm">{t('common.balance')}</p>
        <p className="text-3xl font-bold mt-1">{formatAmount(totalBalance)}</p>
      </div>

      {isLoading && <p className="text-center text-muted-foreground">{t('common.loading')}</p>}

      <div className="space-y-3">
        {accounts.map(acc => {
          const Icon = ACCOUNT_ICONS[acc.type] ?? Wallet
          return (
            <div key={acc.id} className="bg-card border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: (acc.color ?? '#6366F1') + '25' }}>
                <Icon className="w-6 h-6" style={{ color: acc.color ?? '#6366F1' }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{acc.name}</p>
                <p className="text-xs text-muted-foreground">{t(`accounts.types.${acc.type}` as 'accounts.types.card')}</p>
              </div>
              <p className="font-bold text-lg">{formatAmount(Number(acc.balance))}</p>
            </div>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader><DialogTitle>{t('accounts.add')}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1"><Label>Название</Label><Input className="rounded-xl" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Тип</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['cash','card','savings','investment'].map(t_ => (
                    <SelectItem key={t_} value={t_}>{t(`accounts.types.${t_}` as 'accounts.types.card')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Начальный баланс</Label><Input type="number" className="rounded-xl" value={form.balance} onChange={e => set('balance', e.target.value)} /></div>
            <div className="space-y-1"><Label>Цвет</Label><Input type="color" className="rounded-xl h-10" value={form.color} onChange={e => set('color', e.target.value)} /></div>
            <Button className="w-full rounded-xl" disabled={createAccount.isPending} onClick={handleCreate}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
