'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCashbackCards, type UpsertCategoryPayload } from '@/hooks/useCashback'
import { useCategories } from '@/hooks/useCategories'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface Props {
  cardId: string
  open: boolean
  onClose: () => void
}

export function AddCategoryModal({ cardId, open, onClose }: Props) {
  const t = useTranslations('cashback')
  const tcat = useTranslations('categories')
  const { categories } = useCategories()
  const { upsertCategory } = useCashbackCards()

  const now = new Date()

  const [categoryKey, setCategoryKey] = useState('')
  const [percent, setPercent] = useState('')
  const [limit, setLimit] = useState('3000')
  const [validUntil, setValidUntil] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryKey || !percent) return

    const payload: UpsertCategoryPayload = {
      card_id: cardId,
      category_key: categoryKey,
      percent: parseFloat(percent),
      monthly_limit_rub: parseFloat(limit) || 3000,
      valid_until: validUntil || null,
      period_month: now.getMonth() + 1,
      period_year: now.getFullYear(),
    }

    await upsertCategory.mutateAsync(payload)
    setCategoryKey('')
    setPercent('')
    setLimit('3000')
    setValidUntil('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('add_category_rate')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Категория */}
          <div className="space-y-1">
            <Label>{t('cat_category')}</Label>
            <Select value={categoryKey} onValueChange={setCategoryKey}>
              <SelectTrigger>
                <SelectValue placeholder={t('cat_category_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map(cat => (
                  <SelectItem key={cat.key} value={cat.key}>
                    {cat.icon} {tcat(cat.key, { defaultValue: cat.key })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Процент + лимит */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('cat_percent')}</Label>
              <div className="relative">
                <Input
                  type="number" min={0} max={100} step={0.5}
                  placeholder="5"
                  value={percent}
                  onChange={e => setPercent(e.target.value)}
                  className="pr-6"
                  required
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('cat_limit')}</Label>
              <div className="relative">
                <Input
                  type="number" min={0} step={100}
                  placeholder="3000"
                  value={limit}
                  onChange={e => setLimit(e.target.value)}
                  className="pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₽</span>
              </div>
            </div>
          </div>

          {/* Срок действия */}
          <div className="space-y-1">
            <Label>
              {t('cat_valid_until')}
              <span className="text-muted-foreground font-normal ml-1">({t('cat_valid_until_hint')})</span>
            </Label>
            <Input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('common_cancel')}</Button>
            <Button type="submit" disabled={upsertCategory.isPending}>
              {upsertCategory.isPending ? '...' : t('add_category_rate_save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
