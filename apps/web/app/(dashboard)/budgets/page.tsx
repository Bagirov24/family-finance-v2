'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useBudgets } from '@/hooks/useBudgets'
import { useUIStore } from '@/store/ui.store'
import { useFamily } from '@/hooks/useFamily'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

export default function BudgetsPage() {
  const t = useTranslations()
  const { activePeriod, setActivePeriod } = useUIStore()
  const { budgets, isLoading, upsertBudget } = useBudgets(activePeriod.month, activePeriod.year)
  const { family } = useFamily()
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const prevMonth = () => {
    if (activePeriod.month === 1) setActivePeriod({ month: 12, year: activePeriod.year - 1 })
    else setActivePeriod({ month: activePeriod.month - 1, year: activePeriod.year })
  }
  const nextMonth = () => {
    if (activePeriod.month === 12) setActivePeriod({ month: 1, year: activePeriod.year + 1 })
    else setActivePeriod({ month: activePeriod.month + 1, year: activePeriod.year })
  }

  const handleSave = async (b: typeof budgets[number]) => {
    if (!family) return
    await upsertBudget.mutateAsync({
      family_id: family.id,
      category_id: b.category_id,
      amount: parseFloat(editValue),
      period_month: activePeriod.month,
      period_year: activePeriod.year
    })
    setEditing(null)
  }

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      {/* Period selector */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
        <h1 className="font-bold text-lg w-40 text-center">{MONTHS_RU[activePeriod.month - 1]} {activePeriod.year}</h1>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Summary */}
      <div className="bg-card border rounded-2xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Всего бюджет</span>
          <span className="font-semibold">{formatAmount(totalBudget)}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-muted-foreground">Потрачено</span>
          <span className={cn('font-semibold', totalSpent > totalBudget ? 'text-destructive' : '')}>{formatAmount(totalSpent)}</span>
        </div>
        <div className="h-2 bg-muted rounded-full">
          <div
            className={cn('h-full rounded-full transition-all', totalSpent > totalBudget ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${Math.min(100, totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}%` }}
          />
        </div>
      </div>

      {/* Budget list */}
      {isLoading && <p className="text-center text-muted-foreground">{t('common.loading')}</p>}
      <div className="space-y-3">
        {budgets.map(b => (
          <div key={b.id} className="bg-card border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: (b.category?.color ?? '#aaa') + '25' }}>
                  <span style={{ color: b.category?.color ?? '#aaa' }}>●</span>
                </div>
                <span className="text-sm font-medium">{b.category?.name_key}</span>
              </div>
              {editing === b.id ? (
                <div className="flex gap-1">
                  <Input className="w-24 h-7 text-sm rounded-lg" value={editValue} onChange={e => setEditValue(e.target.value)} type="number" />
                  <Button size="sm" className="h-7 rounded-lg" onClick={() => handleSave(b)}>✓</Button>
                  <Button size="sm" variant="ghost" className="h-7 rounded-lg" onClick={() => setEditing(null)}>✕</Button>
                </div>
              ) : (
                <button onClick={() => { setEditing(b.id); setEditValue(String(b.amount)) }} className="text-xs text-primary hover:underline">
                  {formatAmount(Number(b.amount))}
                </button>
              )}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{formatAmount(b.spent)} потрачено</span>
              <span className={cn(b.remaining < 0 ? 'text-destructive' : '')}>
                {b.remaining < 0 ? `перебор ${formatAmount(Math.abs(b.remaining))}` : `${formatAmount(b.remaining)} осталось`}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full">
              <div
                className={cn('h-full rounded-full transition-all', b.percent >= 100 ? 'bg-destructive' : b.percent >= 80 ? 'bg-amber-400' : 'bg-primary')}
                style={{ width: `${b.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
