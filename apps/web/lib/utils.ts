import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  formatAmountPrecise,
  formatDate as _formatDate,
  formatDateWithYear as _formatDateWithYear,
} from './formatters'

// ─── class merging ───────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── deprecated aliases — migrate imports to lib/formatters.ts ───────────────
// These shims preserve backwards-compatibility for any component that currently
// imports formatCurrency / formatDate / formatDateShort from lib/utils.
// They will be removed once all call sites are updated to import from formatters.

/** @deprecated Import formatAmountPrecise from lib/formatters instead */
export const formatCurrency = formatAmountPrecise

/** @deprecated Import formatDateWithYear from lib/formatters instead */
export function formatDate(
  date: string | Date | null | undefined,
  locale = 'ru-RU'
): string {
  return _formatDateWithYear(date, locale)
}

/** @deprecated Import formatDate from lib/formatters instead */
export function formatDateShort(
  date: string | Date | null | undefined,
  locale = 'ru-RU'
): string {
  return _formatDate(date, locale)
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
 *
 * Previous implementation used new Date(year, 0, 0) which equals Dec 31
 * of the previous year, making the starting point 1 day too early and
 * producing wrong results on DST transition days (October/March in Russia).
 */
export function getDayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1)
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((current - start) / 86_400_000) + 1
}
