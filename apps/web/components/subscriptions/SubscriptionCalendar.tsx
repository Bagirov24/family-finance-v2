'use client'
import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatAmount } from '@/lib/formatters'
import type { Subscription } from '@/hooks/useSubscriptions'

interface Props {
  subscriptions: Subscription[]
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfMonth(y: number, m: number) {
  return new Date(y, m, 1)
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate()
}

function weekdayMon(date: Date) {
  return (date.getDay() + 6) % 7
}

const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function SubscriptionCalendar({ subscriptions }: Props) {
  const t = useTranslations('subscriptions')
  const locale = useLocale()
  const isRu = locale === 'ru'
  const WEEKDAYS = isRu ? WEEKDAYS_RU : WEEKDAYS_EN
  const MONTHS = isRu ? MONTHS_RU : MONTHS_EN

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [openDay, setOpenDay] = useState<number | null>(null)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setOpenDay(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setOpenDay(null)
  }

  const dayMap = useMemo(() => {
    const map = new Map<number, Subscription[]>()
    subscriptions.forEach(s => {
      if (!s.is_active) return
      const d = new Date(s.next_billing_date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map.has(day)) map.set(day, [])
        map.get(day)!.push(s)
      }
    })
    return map
  }, [subscriptions, year, month])

  const firstWeekday = weekdayMon(startOfMonth(year, month))
  const totalDays = daysInMonth(year, month)
  const todayDay =
    today.getMonth() === month && today.getFullYear() === year
      ? today.getDate()
      : -1

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm font-semibold">
          {MONTHS[month]} {year}
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
          <ChevronRight size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />
          const subs = dayMap.get(day) ?? []
          const isToday = day === todayDay
          const hasSubs = subs.length > 0

          return (
            <Popover
              key={day}
              open={openDay === day}
              onOpenChange={open => setOpenDay(open ? day : null)}
            >
              <PopoverTrigger asChild>
                <button
                  className={[
                    'relative flex flex-col items-center justify-center rounded-lg h-9 w-full text-sm transition-colors',
                    isToday ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted',
                    hasSubs && !isToday ? 'font-semibold' : '',
                  ].join(' ')}
                >
                  {day}
                  {hasSubs && (
                    <span className="absolute bottom-1 flex gap-[3px]">
                      {subs.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: s.color || '#6366f1' }}
                        />
                      ))}
                    </span>
                  )}
                </button>
              </PopoverTrigger>

              {hasSubs && (
                <PopoverContent className="w-64 p-3 space-y-2" align="center">
                  {subs.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="text-xl leading-none">{s.icon || '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAmount(s.amount, s.currency)}
                        </p>
                      </div>
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color || '#6366f1' }}
                      />
                    </div>
                  ))}
                </PopoverContent>
              )}
            </Popover>
          )
        })}
      </div>
    </div>
  )
}
