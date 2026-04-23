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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DEFAULT_COLORS = ['#6366f1', '#01696f', '#437a22', '#d97706', '#a855f7', '#e11d48']

export function AddCashbackCardModal() {
  const t = useTranslations('cashback')
  const tc = useTranslations('common')
  const { createCard } = useCashbackCards()
  const [open, setOpen] = useState(false)
  const [cardName, setCardName] = useState('')
  const [bankName, setBankName] = useState('')
  const [cashbackType, setCashbackType] = useState<'rubles' | 'points' | 'miles'>('rubles')
  const [pointsRate, setPointsRate] = useState('1')
  const [color, setColor] = useState(DEFAULT_COLORS[0])

  const reset = () => {
    setCardName('')
    setBankName('')
    setCashbackType('rubles')
    setPointsRate('1')
    setColor(DEFAULT_COLORS[0])
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await createCard.mutateAsync({
      card_name: cardName.trim(),
      bank_name: bankName.trim(),
      cashback_type: cashbackType,
      points_to_rubles_rate: Number(pointsRate) || 1,
      color,
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
            <Label htmlFor="cashback-card-name">{t('card_name')}</Label>
            <Input
              id="cashback-card-name"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cashback-bank-name">{t('bank')}</Label>
            <Input
              id="cashback-bank-name"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('cashback_type')}</Label>
              <Select
                value={cashbackType}
                onValueChange={v => setCashbackType(v as typeof cashbackType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rubles">{t('type_rubles')}</SelectItem>
                  <SelectItem value="points">{t('type_points')}</SelectItem>
                  <SelectItem value="miles">{t('type_miles')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cashbackType !== 'rubles' && (
              <div className="space-y-2">
                <Label htmlFor="cashback-rate">{t('points_rate')}</Label>
                <Input
                  id="cashback-rate"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={pointsRate}
                  onChange={e => setPointsRate(e.target.value)}
                />
              </div>
            )}
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
