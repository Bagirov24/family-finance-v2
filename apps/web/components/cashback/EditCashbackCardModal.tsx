'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DEFAULT_COLORS = ['#6366f1', '#01696f', '#437a22', '#d97706', '#a855f7', '#e11d48']

interface Props {
  card: CashbackCard
}

interface CategoryRow {
  id?: string
  category_key: string
  percent: string
  monthly_limit_rub: string
  valid_until: string
  toDelete?: boolean
}

const now = new Date()

function buildRows(card: CashbackCard): CategoryRow[] {
  return (card.cashback_categories ?? []).map(c => ({
    id: c.id,
    category_key: c.category_key,
    percent: String(c.percent),
    monthly_limit_rub: String(c.monthly_limit_rub),
    valid_until: c.valid_until ?? '',
  }))
}

export function EditCashbackCardModal({ card }: Props) {
  const t = useTranslations('cashback')
  const tc = useTranslations('common')
  const { updateCard, upsertCategory, deleteCategory } = useCashbackCards()

  const [open, setOpen] = useState(false)
  const [cardName, setCardName] = useState(card.card_name)
  const [bankName, setBankName] = useState(card.bank_name)
  const [cashbackType, setCashbackType] = useState(card.cashback_type)
  const [pointsRate, setPointsRate] = useState(String(card.points_to_rubles_rate))
  const [color, setColor] = useState(card.color ?? DEFAULT_COLORS[0])
  const [rows, setRows] = useState<CategoryRow[]>([])

  const onOpenChange = (next: boolean) => {
    if (next) {
      setCardName(card.card_name)
      setBankName(card.bank_name)
      setCashbackType(card.cashback_type)
      setPointsRate(String(card.points_to_rubles_rate))
      setColor(card.color ?? DEFAULT_COLORS[0])
      setRows(buildRows(card))
    }
    setOpen(next)
  }

  const updateRow = (idx: number, patch: Partial<CategoryRow>) =>
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const addRow = () =>
    setRows(prev => [
      ...prev,
      { category_key: '', percent: '', monthly_limit_rub: '3000', valid_until: '' },
    ])

  const markDelete = (idx: number) =>
    setRows(prev =>
      prev.map((r, i) => (i === idx ? { ...r, toDelete: !r.toDelete } : r))
    )

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    await updateCard.mutateAsync({
      id: card.id,
      payload: {
        card_name: cardName.trim(),
        bank_name: bankName.trim(),
        cashback_type: cashbackType,
        points_to_rubles_rate: Number(pointsRate) || 1,
        color,
      },
    })

    const ops: Promise<void>[] = []

    for (const row of rows) {
      if (row.toDelete && row.id) {
        ops.push(deleteCategory.mutateAsync(row.id))
        continue
      }
      if (row.toDelete) continue

      const key = row.category_key.trim()
      const pct = Number(row.percent)
      if (!key || isNaN(pct) || pct <= 0) continue

      ops.push(
        upsertCategory.mutateAsync({
          card_id: card.id,
          category_key: key,
          percent: pct,
          monthly_limit_rub: Number(row.monthly_limit_rub) || 3000,
          valid_until: row.valid_until || null,
          period_month: currentMonth,
          period_year: currentYear,
        })
      )
    }

    await Promise.all(ops)
    setOpen(false)
  }

  const isPending =
    updateCard.isPending || upsertCategory.isPending || deleteCategory.isPending

  const deletedCount = rows.filter(r => r.toDelete).length

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
          <div className="space-y-2">
            <Label htmlFor="edit-card-name">{t('card_name')}</Label>
            <Input
              id="edit-card-name"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-bank-name">{t('bank')}</Label>
            <Input
              id="edit-bank-name"
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
                <Label htmlFor="edit-points-rate">{t('points_rate')}</Label>
                <Input
                  id="edit-points-rate"
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('category_rates')}</Label>
              <Button type="button" size="sm" variant="outline" onClick={addRow}>
                <Plus size={14} className="mr-1" />
                {t('add_category')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('category_rates_hint')}</p>

            {rows.filter(r => !r.toDelete).length === 0 && (
              <p className="text-sm text-muted-foreground py-2">{t('no_categories')}</p>
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {rows.map((row, idx) => {
                if (row.toDelete) return null
                return (
                  <div key={idx} className="grid grid-cols-[1fr_60px_90px_90px_auto] gap-2 items-end">
                    <div className="space-y-1">
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground">{t('category_key')}</span>
                      )}
                      <Input
                        placeholder="supermarkets"
                        value={row.category_key}
                        onChange={e => updateRow(idx, { category_key: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground">%</span>
                      )}
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="5"
                        value={row.percent}
                        onChange={e => updateRow(idx, { percent: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground">{t('limit_rub')}</span>
                      )}
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="3000"
                        value={row.monthly_limit_rub}
                        onChange={e => updateRow(idx, { monthly_limit_rub: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground">{t('valid_until')}</span>
                      )}
                      <Input
                        type="date"
                        value={row.valid_until}
                        onChange={e => updateRow(idx, { valid_until: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className={idx === 0 ? 'pt-5' : ''}>
                      <button
                        type="button"
                        onClick={() => markDelete(idx)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={tc('delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {deletedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('will_delete_count', { count: deletedCount })}
              </p>
            )}
          </div>

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
