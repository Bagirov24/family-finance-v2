'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { formatDate, formatKm } from '@/lib/formatters'
import type { ServiceItem, Vehicle } from '@/hooks/useVehicles'

type CheckStatus = 'ok' | 'soon' | 'overdue'

type HealthCheck = {
  key: string
  label: string
  status: CheckStatus
  detail: string
}

const STATUS_ICON: Record<CheckStatus, string> = {
  ok: '✅',
  soon: '⚠️',
  overdue: '🔴',
}

const STATUS_ORDER: Record<CheckStatus, number> = {
  overdue: 0,
  soon: 1,
  ok: 2,
}

function getKmStatus(
  currentMileage: number,
  lastMileage: number | null,
  everyKm: number | null
): CheckStatus | null {
  if (lastMileage == null || everyKm == null) return null
  const driven = currentMileage - lastMileage
  const pct = driven / everyKm
  if (pct >= 1) return 'overdue'
  if (pct >= 0.85) return 'soon'
  return 'ok'
}

function getDateStatus(
  nextDueDate: string | null,
): CheckStatus | null {
  if (!nextDueDate) return null
  const daysLeft = Math.ceil(
    (new Date(nextDueDate).getTime() - Date.now()) / 86_400_000
  )
  if (daysLeft <= 0) return 'overdue'
  if (daysLeft <= 30) return 'soon'
  return 'ok'
}

function mergeStatus(a: CheckStatus | null, b: CheckStatus | null): CheckStatus | null {
  if (a == null && b == null) return null
  const statuses = [a, b].filter(Boolean) as CheckStatus[]
  return statuses.sort((x, y) => STATUS_ORDER[x] - STATUS_ORDER[y])[0] ?? null
}

interface Props {
  vehicle: Vehicle
  serviceItems: ServiceItem[]
}

export function VehicleHealthScore({ vehicle, serviceItems }: Props) {
  const t = useTranslations('car')

  const checks = useMemo<HealthCheck[]>(() => {
    const currentMileage = Number(vehicle.current_mileage ?? 0)

    return serviceItems
      .map((item): HealthCheck | null => {
        const kmStatus = getKmStatus(
          currentMileage,
          item.last_replaced_mileage,
          item.replace_every_km
        )
        const dateStatus = getDateStatus(item.next_due_date)
        const status = mergeStatus(kmStatus, dateStatus)

        if (status == null) return null

        // Build detail string
        const parts: string[] = []
        if (item.last_replaced_date) {
          parts.push(`${t('lastReplaced')}: ${formatDate(item.last_replaced_date)}`)
        }
        if (item.replace_every_km && item.last_replaced_mileage != null) {
          const nextMileage = item.last_replaced_mileage + item.replace_every_km
          const driven = currentMileage - item.last_replaced_mileage
          parts.push(`${formatKm(driven)} / ${formatKm(item.replace_every_km)}`)
          if (status === 'overdue') {
            parts.push(`просрочено на ${formatKm(currentMileage - nextMileage)}`)
          } else if (status === 'soon') {
            parts.push(`осталось ${formatKm(nextMileage - currentMileage)}`)
          }
        }
        if (item.next_due_date) {
          const daysLeft = Math.ceil(
            (new Date(item.next_due_date).getTime() - Date.now()) / 86_400_000
          )
          if (daysLeft <= 0) {
            parts.push(`срок истёк ${Math.abs(daysLeft)} дн. назад`)
          } else if (daysLeft <= 30) {
            parts.push(`до замены ${daysLeft} дн.`)
          }
        }

        return {
          key: item.id,
          label: t(`serviceItems.${item.name_key}` as const),
          status,
          detail: parts.join(' · '),
        }
      })
      .filter((c): c is HealthCheck => c !== null)
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  }, [vehicle, serviceItems, t])

  // Score: 100 - 30 per overdue - 10 per soon, clamp 0..100
  const score = useMemo(() => {
    const overdue = checks.filter(c => c.status === 'overdue').length
    const soon = checks.filter(c => c.status === 'soon').length
    return Math.max(0, 100 - overdue * 30 - soon * 10)
  }, [checks]
  )

  const scoreColor =
    score >= 80 ? 'text-green-500' :
    score >= 50 ? 'text-amber-500' : 'text-red-500'

  const scoreBg =
    score >= 80 ? 'bg-green-500' :
    score >= 50 ? 'bg-amber-500' : 'bg-red-500'

  const scoreLabel =
    score >= 80 ? 'Отличное' :
    score >= 50 ? 'Требует внимания' : 'Критическое'

  // If no service items at all — nothing to show
  if (serviceItems.length === 0) return null

  // If everything is ok and score is 100 — show compact badge
  if (checks.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-4 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-green-500">Состояние: отличное</p>
          <p className="text-xs text-muted-foreground">Все пункты ТО в норме</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      {/* Header row with score */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Состояние авто
          </p>
          <p className={cn('text-xs mt-0.5', scoreColor)}>{scoreLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Circular-ish score */}
          <div className="relative flex items-center justify-center">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle
                cx="26" cy="26" r="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted/30"
              />
              <circle
                cx="26" cy="26" r="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${(score / 100) * 138.2} 138.2`}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
                className={scoreColor}
              />
            </svg>
            <span className={cn('absolute text-sm font-bold tabular-nums', scoreColor)}>
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', scoreBg)}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Problem list */}
      <ul className="space-y-2">
        {checks.map(check => (
          <li key={check.key} className="flex items-start gap-2">
            <span className="text-base leading-snug shrink-0">{STATUS_ICON[check.status]}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{check.label}</p>
              {check.detail ? (
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
