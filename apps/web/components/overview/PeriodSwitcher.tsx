'use client'
import { useUIStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS_RU = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
]

function buildPeriods(count = 6) {
  const now = new Date()
  const result: { month: number; year: number }[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() })
  }
  return result
}

export function PeriodSwitcher() {
  const { activePeriod, setActivePeriod } = useUIStore()
  const periods = buildPeriods(6)
  const currentYear = new Date().getFullYear()

  function shift(dir: -1 | 1) {
    const d = new Date(activePeriod.year, activePeriod.month - 1 + dir, 1)
    setActivePeriod(d.getMonth() + 1, d.getFullYear())
  }

  const isCurrentMonth =
    activePeriod.month === new Date().getMonth() + 1 &&
    activePeriod.year === currentYear

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => shift(-1)}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        aria-label="Предыдущий месяц"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1 justify-center">
        {periods.map(p => {
          const active = p.month === activePeriod.month && p.year === activePeriod.year
          // Всегда показываем год если он отличается от текущего —
          // без этого при навигации назад кнопки «Янв» «Фев» выглядят одинаково
          const showYear = p.year !== currentYear
          return (
            <button
              key={`${p.year}-${p.month}`}
              onClick={() => setActivePeriod(p.month, p.year)}
              className={cn(
                'shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {MONTHS_RU[p.month - 1]}{showYear ? ` ${p.year}` : ''}
            </button>
          )
        })}
      </div>

      {/* Активная кнопка «вперёд» — показывает период вне видимого списка */}
      <button
        onClick={() => shift(1)}
        disabled={isCurrentMonth}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Следующий месяц"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
