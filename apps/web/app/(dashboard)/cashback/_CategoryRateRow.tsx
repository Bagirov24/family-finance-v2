'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCashbackCards, type CashbackCategory, type UpsertCategoryPayload } from '@/hooks/useCashback'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  cat: CashbackCategory
  categoryLabel: string
  categoryIcon: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

function isExpiringSoon(validUntil: string | null): boolean {
  if (!validUntil) return false
  const d = daysUntil(validUntil)
  return d >= 0 && d <= 7
}

function isExpired(validUntil: string | null): boolean {
  if (!validUntil) return false
  return new Date(validUntil) < new Date()
}

export function CategoryRateRow({ cat, categoryLabel, categoryIcon }: Props) {
  const t = useTranslations('cashback')
  const { upsertCategory, deleteCategory } = useCashbackCards()

  const [editing, setEditing] = useState(false)
  const [percent, setPercent] = useState(String(cat.percent))
  const [limit, setLimit] = useState(String(cat.monthly_limit_rub))
  const [validUntil, setValidUntil] = useState(cat.valid_until ?? '')

  const expired = isExpired(cat.valid_until)
  const expiringSoon = isExpiringSoon(cat.valid_until)
  const daysLeft = cat.valid_until && !expired ? daysUntil(cat.valid_until) : null

  const now = new Date()
  const isCurrentPeriod = cat.period_month === now.getMonth() + 1 && cat.period_year === now.getFullYear()
  // monthly_limit_rub is nullable in the DB schema — default to 0 for arithmetic
  const limitRub = cat.monthly_limit_rub ?? 0
  const remaining = isCurrentPeriod
    ? limitRub - cat.spent_this_month_rub
    : limitRub
  const usedPct = isCurrentPeriod && limitRub > 0
    ? Math.min(100, Math.round((cat.spent_this_month_rub / limitRub) * 100))
    : 0

  async function handleSave() {
    const payload: UpsertCategoryPayload = {
      card_id: cat.card_id,
      category_key: cat.category_key,
      percent: parseFloat(percent) || 0,
      monthly_limit_rub: parseFloat(limit) || 3000,
      valid_until: validUntil || null,
      period_month: cat.period_month,
      period_year: cat.period_year,
    }
    await upsertCategory.mutateAsync(payload)
    setEditing(false)
  }

  function handleCancel() {
    setPercent(String(cat.percent))
    setLimit(String(cat.monthly_limit_rub))
    setValidUntil(cat.valid_until ?? '')
    setEditing(false)
  }

  return (
    <div className={cn(
      'rounded-xl border bg-card p-3 space-y-2 transition-colors',
      expired && 'opacity-50 border-dashed',
      expiringSoon && 'border-yellow-400/60'
    )}>
      {/* Заголовок строки */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{categoryIcon}</span>
          <span className="text-sm font-medium truncate">{categoryLabel}</span>
          {expired && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
              {t('cat_expired')}
            </Badge>
          )}
          {expiringSoon && !expired && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400/60 gap-1">
              <AlertTriangle size={10} />
              {daysLeft === 0
                ? t('cat_expires_today')
                : t('cat_expires_in_days', { count: daysLeft })}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!editing ? (
            <>
              <span className="text-sm font-bold text-primary">{cat.percent}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
                <Pencil size={13} />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                onClick={() => deleteCategory.mutate(cat.id)}
              >
                <Trash2 size={13} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={handleSave}>
                <Check size={13} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
                <X size={13} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Форма редактирования */}
      {editing && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('cat_percent')}</label>
            <div className="relative">
              <Input
                type="number" min={0} max={100} step={0.5}
                value={percent}
                onChange={e => setPercent(e.target.value)}
                className="pr-6 h-8 text-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('cat_limit')}</label>
            <div className="relative">
              <Input
                type="number" min={0} step={100}
                value={limit}
                onChange={e => setLimit(e.target.value)}
                className="pr-6 h-8 text-sm"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₽</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('cat_valid_until')}</label>
            <Input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Прогресс лимита */}
      {!editing && isCurrentPeriod && limitRub > 0 && (
        <div className="space-y-0.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('cat_spent')}: {cat.spent_this_month_rub.toLocaleString('ru-RU')} ₽</span>
            <span>{t('cat_remaining')}: {remaining.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usedPct >= 100 ? 'bg-destructive' : usedPct >= 80 ? 'bg-yellow-500' : 'bg-primary'
              )}
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      )}

      {/* valid_until в режиме просмотра */}
      {!editing && cat.valid_until && (
        <p className={cn(
          'text-xs',
          expired ? 'text-destructive' : expiringSoon ? 'text-yellow-600' : 'text-muted-foreground'
        )}>
          {t('cat_valid_until')}: {formatDate(cat.valid_until)}
        </p>
      )}
    </div>
  )
}
