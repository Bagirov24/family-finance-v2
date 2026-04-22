'use client'

import { useMemo } from 'react'
import type { FuelEntry } from '@/hooks/useVehicles'

interface Props {
  entries: FuelEntry[]
}

const W = 600
const H = 160
const PAD = { top: 16, right: 16, bottom: 32, left: 44 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

function niceMax(v: number) {
  const step = Math.pow(10, Math.floor(Math.log10(v)))
  return Math.ceil(v / step) * step
}

export function FuelChart({ entries }: Props) {
  // только полные баки с рассчитанным расходом, сортируем по пробегу asc
  const points = useMemo(() => {
    return entries
      .filter(e => e.full_tank && e.fuel_consumption_calculated != null)
      .map(e => ({
        km: e.mileage,
        l100: Number(e.fuel_consumption_calculated),
        date: e.expense?.date ?? '',
        liters: Number(e.liters),
        pricePerL: Number(e.price_per_liter),
      }))
      .sort((a, b) => a.km - b.km)
  }, [entries])

  if (points.length < 2) {
    return (
      <div className="rounded-2xl border bg-card p-4 text-center text-sm text-muted-foreground">
        Недостаточно данных для графика — нужно минимум 2 полных бака
      </div>
    )
  }

  const maxL = niceMax(Math.max(...points.map(p => p.l100)) * 1.1)
  const minL = 0
  const avgL = points.reduce((s, p) => s + p.l100, 0) / points.length

  const xScale = (km: number) => {
    const minKm = points[0].km
    const maxKm = points[points.length - 1].km
    if (maxKm === minKm) return PAD.left + INNER_W / 2
    return PAD.left + ((km - minKm) / (maxKm - minKm)) * INNER_W
  }
  const yScale = (l: number) =>
    PAD.top + INNER_H - ((l - minL) / (maxL - minL)) * INNER_H

  const polyline = points.map(p => `${xScale(p.km)},${yScale(p.l100)}`).join(' ')
  const area = [
    `${xScale(points[0].km)},${PAD.top + INNER_H}`,
    ...points.map(p => `${xScale(p.km)},${yScale(p.l100)}`),
    `${xScale(points[points.length - 1].km)},${PAD.top + INNER_H}`,
  ].join(' ')

  // Y ticks: 4 steps
  const yTicks = Array.from({ length: 5 }, (_, i) => +(minL + (i / 4) * (maxL - minL)).toFixed(1))

  // X labels: first, last, maybe 2 middle
  const xLabels = (() => {
    if (points.length <= 4) return points
    const step = Math.floor((points.length - 1) / 3)
    return [0, step, step * 2, points.length - 1].map(i => points[i])
  })()

  const avgY = yScale(avgL)

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">⛽ Расход топлива</p>
        <p className="text-xs text-muted-foreground">
          Среднее: <span className="font-bold text-foreground">{avgL.toFixed(1)} л/100км</span>
        </p>
      </div>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ minWidth: 280 }}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {yTicks.map(v => (
            <line
              key={v}
              x1={PAD.left} y1={yScale(v)}
              x2={PAD.left + INNER_W} y2={yScale(v)}
              stroke="currentColor" strokeOpacity={0.08} strokeWidth={1}
            />
          ))}

          {/* Average line */}
          <line
            x1={PAD.left} y1={avgY}
            x2={PAD.left + INNER_W} y2={avgY}
            stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" strokeOpacity={0.7}
          />
          <text
            x={PAD.left + INNER_W + 4} y={avgY + 4}
            fontSize={9} fill="#f59e0b" opacity={0.9}
          >
            avg
          </text>

          {/* Area fill */}
          <polygon
            points={area}
            fill="hsl(221,83%,53%)"
            fillOpacity={0.08}
          />

          {/* Line */}
          <polyline
            points={polyline}
            fill="none"
            stroke="hsl(221,83%,53%)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={xScale(p.km)} cy={yScale(p.l100)}
              r={3}
              fill="hsl(221,83%,53%)"
              stroke="white" strokeWidth={1.5}
            >
              <title>{p.date ? `${p.date} · ` : ''}{p.l100.toFixed(1)} л/100км · {p.liters}л · {p.pricePerL.toFixed(1)} ₽/л</title>
            </circle>
          ))}

          {/* Y axis labels */}
          {yTicks.map(v => (
            <text
              key={v}
              x={PAD.left - 6} y={yScale(v) + 4}
              textAnchor="end"
              fontSize={9}
              fill="currentColor"
              opacity={0.5}
            >
              {v}
            </text>
          ))}

          {/* X axis labels */}
          {xLabels.map((p, i) => (
            <text
              key={i}
              x={xScale(p.km)}
              y={PAD.top + INNER_H + 18}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              opacity={0.5}
            >
              {(p.km / 1000).toFixed(0)}k
            </text>
          ))}

          {/* Axes */}
          <line
            x1={PAD.left} y1={PAD.top}
            x2={PAD.left} y2={PAD.top + INNER_H}
            stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
          />
          <line
            x1={PAD.left} y1={PAD.top + INNER_H}
            x2={PAD.left + INNER_W} y2={PAD.top + INNER_H}
            stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
          />

          {/* Y axis unit */}
          <text
            x={PAD.left - 6} y={PAD.top - 4}
            textAnchor="end" fontSize={8}
            fill="currentColor" opacity={0.4}
          >
            л/100
          </text>
        </svg>
      </div>

      {/* Summary row */}
      <div className="flex gap-4 text-xs text-muted-foreground pt-1">
        <span>Мин: <b className="text-green-500">{Math.min(...points.map(p => p.l100)).toFixed(1)}</b></span>
        <span>Макс: <b className="text-red-500">{Math.max(...points.map(p => p.l100)).toFixed(1)}</b></span>
        <span>Заправок: <b className="text-foreground">{points.length}</b></span>
      </div>
    </div>
  )
}
