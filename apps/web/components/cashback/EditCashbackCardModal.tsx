'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pencil } from 'lucide-react'
import { useCashbackCards, type CashbackCard } from '@/hooks/useCashback'
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

interface Props {
  card: CashbackCard
}

export function EditCashbackCardModal({ card }: Props) {
  const t = useTranslations('cashback')
  const tc = useTranslations('common')
  const { updateCard } = useCashbackCards()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(card.name)
  const [bank, setBank] = useState(card.bank)
  const [cardType, setCardType] = useState(card.card_type)
  const [color, setColor] = useState(card.color ?? DEFAULT_COLORS[0])
  const [defaultCashbackPercent, setDefaultCashbackPercent] = useState(
    String(card.default_cashback_percent)
  )

  const onOpenChange = (next: boolean) => {
    // Сброс к актуальным данным карты при каждом открытии
    if (next) {
      setName(card.name)
      setBank(card.bank)
      setCardType(card.card_type)
      setColor(card.color ?? DEFAULT_COLORS[0])
      setDefaultCashbackPercent(String(card.default_cashback_percent))
    }
    setOpen(next)
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await updateCard.mutateAsync({
      id: card.id,
      payload: {
        name: name.trim(),
        bank: bank.trim(),
        card_type: cardType.trim(),
        color,
        default_cashback_percent: Number(defaultCashbackPercent) || 0,
      },
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
          aria-label={t('edit_card')}
        >
          <Pencil size={14} />
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit_card')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-cashback-name">{t('card_name')}</Label>
            <Input
              id="edit-cashback-name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cashback-bank">{t('bank')}</Label>
            <Input
              id="edit-cashback-bank"
              value={bank}
              onChange={e => setBank(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cashback-type">{t('card_type')}</Label>
              <Input
                id="edit-cashback-type"
                value={cardType}
                onChange={e => setCardType(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cashback-percent">{t('default_cashback')}</Label>
              <Input
                id="edit-cashback-percent"
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
            <Button type="submit" disabled={updateCard.isPending}>
              {updateCard.isPending ? tc('loading') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
