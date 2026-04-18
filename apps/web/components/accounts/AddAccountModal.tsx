'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateAccount } from '@/hooks/useAccounts'

const ACCOUNT_TYPES = ['cash', 'card', 'savings', 'investment', 'credit'] as const
const ACCOUNT_ICONS: Record<string, string> = {
  cash: '💵',
  card: '💳',
  savings: '🐷',
  investment: '📈',
  credit: '💸',
}

interface Props {
  open: boolean
  onClose: () => void
}

export function AddAccountModal({ open, onClose }: Props) {
  const t = useTranslations('accounts')
  const tc = useTranslations('common')
  const [name, setName] = useState('')
  const [type, setType] = useState<typeof ACCOUNT_TYPES[number]>('card')
  const [balance, setBalance] = useState('0')
  const [currency, setCurrency] = useState('RUB')
  const [icon, setIcon] = useState(ACCOUNT_ICONS['card'])

  const { mutateAsync, isPending } = useCreateAccount()

  function reset() {
    setName('')
    setType('card')
    setBalance('0')
    setCurrency('RUB')
    setIcon(ACCOUNT_ICONS['card'])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await mutateAsync({
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        currency,
        icon,
      })
      toast.success(t('added'))
      reset()
      onClose()
    } catch {
      toast.error(tc('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('add')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{tc('name') ?? t('name')}</Label>
            <Input
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('type')}</Label>
            <Select
              value={type}
              onValueChange={v => {
                const val = v as typeof ACCOUNT_TYPES[number]
                setType(val)
                setIcon(ACCOUNT_ICONS[val])
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map(tp => (
                  <SelectItem key={tp} value={tp}>
                    {ACCOUNT_ICONS[tp]} {t(`types.${tp}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('initialBalance')}</Label>
            <Input
              type="number"
              step="0.01"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              className="tabular-nums"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{tc('currency')}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['RUB', 'USD', 'EUR', 'GBP', 'CNY', 'AED'].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? tc('loading') : tc('add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
