'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCashbackCards } from '@/hooks/useCashback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const DEFAULT_COLORS = ['#6366f1', '#01696f', '#437a22', '#d97706', '#a855f7', '#e11d48']

export function AddCashbackCardModal() {
  const t = useTranslations('cashback')
  const tc = useTranslations('common')
  const { createCard } = useCashbackCards()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [bank, setBank] = useState('')
  const [cardType, setCardType] = useState('debit')
  const [color, setColor] = useState(DEFAULT_COLORS[0])
  const [defaultCashbackPercent, setDefaultCashbackPercent] = useState('1')

  const reset = () => {
    setName('')
    setBank('')
    setCardType('debit')
    setColor(DEFAULT_COLORS[0])
    setDefaultCashbackPercent('1')
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    await createCard.mutateAsync({
      name: name.trim(),
      bank: bank.trim(),
      card_type: cardType.trim(),
      color,
      default_cashback_percent: Number(defaultCashbackPercent) || 0,
    })

    reset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t('add_card')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('add_card')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cashback-name">{t('card_name')}</Label>
            <Input id="cashback-name" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cashback-bank">{t('bank')}</Label>
            <Input id="cashback-bank" value={bank} onChange={e => setBank(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cashback-type">{t('card_type')}</Label>
              <Input id="cashback-type" value={cardType} onChange={e => setCardType(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashback-percent">{t('default_cashback')}</Label>
              <Input
                id="cashback-percent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={defaultCashbackPercent}
                onChange={e => setDefaultCashbackPercent(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('card_color')}</Label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className="h-8 w-8 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: preset,
                    borderColor: color === preset ? 'hsl(var(--foreground))' : 'transparent',
                    transform: color === preset ? 'scale(1.05)' : 'scale(1)',
                  }}
                  aria-label={preset}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={createCard.isPending}>
              {createCard.isPending ? tc('loading') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
