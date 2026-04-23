'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pencil } from 'lucide-react'
import { useCashbackCards, type CashbackCard } from '@/hooks/useCashback'
import { useCategories } from '@/hooks/useCategories'
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
  const tcat = useTranslations('categories')
  const { updateCard, upsertCategoryRate } = useCashbackCards()
  const { categories } = useCategories()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(card.name)
  const [bank, setBank] = useState(card.bank)
  const [cardType, setCardType] = useState(card.card_type)
  const [color, setColor] = useState(card.color ?? DEFAULT_COLORS[0])
  const [defaultCashbackPercent, setDefaultCashbackPercent] = useState(
    String(card.default_cashback_percent)
  )

  // Map categoryId → percent string for category-specific rates
  const [categoryRates, setCategoryRates] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const cc of card.cashback_card_categories ?? []) {
      map[cc.category_id] = String(cc.cashback_percent)
    }
    return map
  })

  const onOpenChange = (next: boolean) => {
    if (next) {
      setName(card.name)
      setBank(card.bank)
      setCardType(card.card_type)
      setColor(card.color ?? DEFAULT_COLORS[0])
      setDefaultCashbackPercent(String(card.default_cashback_percent))

      const map: Record<string, string> = {}
      for (const cc of card.cashback_card_categories ?? []) {
        map[cc.category_id] = String(cc.cashback_percent)
      }
      setCategoryRates(map)
    }
    setOpen(next)
  }

  const expenseCategories = (categories ?? []).filter(
    c => c.type === 'expense' || c.type === 'both'
  )

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 1. Update card base fields
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

    // 2. Upsert category rates that have a value
    const upserts = Object.entries(categoryRates)
      .filter(([, val]) => val !== '' && !isNaN(Number(val)))
      .map(([category_id, val]) =>
        upsertCategoryRate.mutateAsync({
          card_id: card.id,
          category_id,
          cashback_percent: Number(val),
        })
      )
    await Promise.all(upserts)

    setOpen(false)
  }

  const isPending = updateCard.isPending || upsertCategoryRate.isPending

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

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('edit_card')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Base fields */}
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

          {/* Category-specific rates */}
          {expenseCategories.length > 0 && (
            <div className="space-y-3">
              <Label>{t('category_rates')}</Label>
              <p className="text-xs text-muted-foreground">{t('category_rates_hint')}</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {expenseCategories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">{cat.icon}</span>
                    <span className="text-sm flex-1 truncate">
                      {tcat(cat.name_key, { defaultValue: cat.name_key })}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="—"
                        className="w-20 h-8 text-sm"
                        value={categoryRates[cat.id] ?? ''}
                        onChange={e =>
                          setCategoryRates(prev => ({
                            ...prev,
                            [cat.id]: e.target.value,
                          }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? tc('loading') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
