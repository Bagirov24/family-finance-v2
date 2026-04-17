'use client'
import { useTranslations } from 'next-intl'
import { useTransactions } from '@/hooks/useTransactions'
import { useUIStore } from '@/store/ui.store'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

export default function AnalyticsPage() {
  const t = useTranslations()
  const { activePeriod, setActivePeriod } = useUIStore()
  const { transactions } = useTransactions({
    from: `${activePeriod.year}-${String(activePeriod.month).padStart(2,'0')}-01`,
    to:   `${activePeriod.year}-${String(activePeriod.month).padStart(2,'0')}-31`
  })

  const prevMonth = () => {
    if (activePeriod.month === 1) setActivePeriod({ month: 12, year: activePeriod.year - 1 })
    else setActivePeriod({ month: activePeriod.month - 1, year: activePeriod.year })
  }
  const nextMonth = () => {
    if (activePeriod.month === 12) setActivePeriod({ month: 1, year: activePeriod.year + 1 })
    else setActivePeriod({ month: activePeriod.month + 1, year: activePeriod.year })
  }

  const expenses = transactions.filter(t => t.type === 'expense')
  const totalExp = expenses.reduce((s, t) => s + Number(t.amount), 0)
  const totalInc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)

  // By category
  const catMap: Record<string, { name: string; color: string; total: number }> = {}
  for (const tx of expenses) {
    if (!tx.category) continue
    const k = tx.category.id
    if (!catMap[k]) catMap[k] = { name: tx.category.name_key, color: tx.category.color, total: 0 }
    catMap[k].total += Number(tx.amount)
  }
  const cats = Object.values(catMap).sort((a, b) => b.total - a.total)

  // By weekday (0=Sun)
  const dowMap: Record<number, number> = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0 }
  for (const tx of expenses) {
    const dow = new Date(tx.date).getDay()
    dowMap[dow] += Number(tx.amount)
  }
  const maxDow = Math.max(...Object.values(dowMap), 1)

  // Daily heatmap
  const dayMap: Record<number, number> = {}
  for (const tx of expenses) {
    const d = parseInt(tx.date.split('-')[2])
    dayMap[d] = (dayMap[d] ?? 0) + Number(tx.amount)
  }
  const maxDay = Math.max(...Object.values(dayMap), 1)
  const daysInMonth = new Date(activePeriod.year, activePeriod.month, 0).getDate()

  return (
    <div className="p-4 space-y-5 max-w-xl mx-auto">
      {/* Period selector */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
        <h1 className="font-bold text-lg w-40 text-center">{MONTHS_RU[activePeriod.month - 1]} {activePeriod.year}</h1>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Income vs Expense */}
      <div className="bg-card border rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t('analytics.income_expense')}</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs w-16 text-green-600">{t('common.income')}</span>
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, totalInc > 0 ? 100 : 0)}%` }} />
            </div>
            <span className="text-xs font-semibold w-24 text-right">{formatAmount(totalInc)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs w-16 text-red-500">{t('common.expense')}</span>
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, totalInc > 0 ? (totalExp / totalInc) * 100 : 100)}%` }} />
            </div>
            <span className="text-xs font-semibold w-24 text-right">{formatAmount(totalExp)}</span>
          </div>
        </div>
      </div>

      {/* Spending by category */}
      {cats.length > 0 && (
        <div className="bg-card border rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t('analytics.by_category')}</h2>
          <div className="space-y-3">
            {cats.map(cat => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">{formatAmount(cat.total)} · {totalExp > 0 ? Math.round((cat.total / totalExp)*100) : 0}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${(cat.total/totalExp)*100}%`, background: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekday chart */}
      <div className="bg-card border rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4">{t('analytics.by_weekday')}</h2>
        <div className="flex items-end gap-2 h-24">
          {[1,2,3,4,5,6,0].map(dow => (
            <div key={dow} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-muted rounded-t-lg" style={{ height: `${(dowMap[dow] / maxDow) * 80}px`, background: '#6366F1', borderRadius: 6, minHeight: dowMap[dow] > 0 ? 4 : 0 }} />
              <span className="text-[10px] text-muted-foreground">{DAYS_RU[dow === 0 ? 6 : dow - 1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily heatmap */}
      <div className="bg-card border rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t('analytics.heatmap')}</h2>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const v = dayMap[day] ?? 0
            const opacity = v > 0 ? 0.2 + (v / maxDay) * 0.8 : 0.05
            return (
              <div
                key={day}
                className="aspect-square rounded-md flex items-center justify-center"
                style={{ background: `rgba(99,102,241,${opacity})` }}
                title={v > 0 ? formatAmount(v) : ''}
              >
                <span className="text-[9px] text-muted-foreground">{day}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
