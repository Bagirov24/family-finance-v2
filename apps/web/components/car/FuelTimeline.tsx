'use client'

import { useMemo } from 'react'
import type { FuelEntry } from '@/hooks/useVehicles'
import { formatAmount, formatDate, formatKm } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface Props {
  entries: FuelEntry[]
}

type MonthGroup = {
  label: string       // «Апрель 2026»
  items: FuelEntry[]
  totalLiters: number
  totalCost: number
}

const MONTHS_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
]

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`
}

function consumptionColor(l100: number | null): string {
  if (l100 == null) return 'text-muted-foreground'
  if (l100 < 8) return 'text-green-500'
  if (l100 < 12) return 'text-amber-500'
  return 'text-red-500'
}

export function FuelTimeline({ entries }: Props) {
  // entries приходят отсортированными по mileage DESC
  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, FuelEntry[]>()
    for (const e of entries) {
      const date = e.expense?.date ?? ''
      const label = date ? getMonthLabel(date) : 'Дата неизвестна'
      const arr = map.get(label) ?? []
      arr.push(e)
      map.set(label, arr)
    }
    return Array.from(map.entries()).map(([label, items]) => ({
      label,
      items,
      totalLiters: items.reduce((s, e) => s + Number(e.liters), 0),
      totalCost: items.reduce((s, e) => s + Number(e.liters) * Number(e.price_per_liter), 0),
    }))
  }, [entries])

  if (entries.length === 0) return null

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => (
        <div key={group.label}>
          {/* Month header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </h3>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{group.totalLiters.toFixed(1)} л</span>
              <span className="font-semibold text-foreground">{formatAmount(Math.round(group.totalCost))}</span>
            </div>
          </div>

          {/* Timeline items */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

            <ul className="space-y-3">
              {group.items.map((e, idx) => {
                const cost = Number(e.liters) * Number(e.price_per_liter)
                const l100 = e.fuel_consumption_calculated != null
                  ? Number(e.fuel_consumption_calculated)
                  : null
                const date = e.expense?.date ?? ''
                const isFirst = gi === 0 && idx === 0

                return (
                  <li key={e.id} className="flex gap-3 items-start">
                    {/* Dot */}
                    <div className={cn(
                      'relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full border-2 shrink-0',
                      isFirst
                        ? 'border-primary bg-primary'
                        : e.full_tank
                          ? 'border-blue-400 bg-blue-400/20'
                          : 'border-muted-foreground/40 bg-background'
                    )} />

                    {/* Content */}
                    <div className="flex-1 min-w-0 rounded-xl border bg-card px-3 py-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Left: date + mileage */}
                        <div className="flex items-center gap-2 flex-wrap text-sm">
                          {date && (
                            <span className="text-muted-foreground text-xs">
                              {formatDate(date)}
                            </span>
                          )}
                          <span className="font-medium">
                            {formatKm(Number(e.mileage))}
                          </span>
                          {e.full_tank && (
                            <span className="text-xs text-blue-500">⛽ полный</span>
                          )}
                        </div>

                        {/* Right: cost */}
                        <span className="font-semibold tabular-nums text-sm">
                          {formatAmount(Math.round(cost))}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{Number(e.liters).toFixed(1)} л</span>
                        <span>{Number(e.price_per_liter).toFixed(2)} ₽/л</span>
                        {l100 != null && (
                          <span className={cn('font-semibold', consumptionColor(l100))}>
                            {l100.toFixed(1)} л/100км
                          </span>
                        )}
                        {e.expense?.note && (
                          <span className="text-muted-foreground/70 italic truncate max-w-[160px]">
                            {e.expense.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
