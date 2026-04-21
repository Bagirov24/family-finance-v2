import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── class merging ───────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── date math utilities ─────────────────────────────────────────────────────

export function getMonthName(month: number, locale = 'ru-RU'): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(
    new Date(2000, month - 1)
  )
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Returns the 1-based day of the year for the given date.
 * Uses UTC arithmetic to avoid DST off-by-one errors on clock-change days.
 */
export function getDayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1)
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((current - start) / 86_400_000) + 1
}
