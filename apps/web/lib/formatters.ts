/**
 * Canonical formatters — single source of truth for all money, date,
 * and unit formatting across the app.
 *
 * Rules:
 *  - All functions accept null/undefined and return '—' gracefully.
 *  - Date-only strings (YYYY-MM-DD) are parsed as LOCAL midnight,
 *    not UTC midnight, to prevent the off-by-one-day bug in UTC+3.
 *  - Money: formatAmount rounds to 0 decimal places (standard RUB display).
 *    formatAmountPrecise keeps up to 2 decimal places for goal/subscription
 *    amounts where kopek precision matters.
 */

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Parse a date value safely, treating bare YYYY-MM-DD strings as LOCAL
 * midnight rather than UTC midnight (which shifts the day in UTC+3 and
 * beyond).
 */
function parseDate(date: string | Date | null | undefined): Date | null {
  if (date == null) return null
  if (date instanceof Date) return isNaN(date.getTime()) ? null : date
  if (date === '') return null
  // Bare date string "YYYY-MM-DD" — append local midnight to avoid UTC shift
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date + 'T00:00:00'
    : date
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? null : d
}

// ─── money ──────────────────────────────────────────────────────────────────

/**
 * Format an amount as currency with NO decimal places.
 * Standard display for RUB throughout the app (₽1 235).
 * Accepts number or string (Supabase returns numeric columns as strings).
 */
export function formatAmount(
  amount: number | string | null | undefined,
  currency = 'RUB',
  locale = 'ru-RU'
): string {
  if (amount == null) return '—'
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (!isFinite(n)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

/**
 * Format an amount with UP TO 2 decimal places.
 * Use for goal progress, subscription costs, and any context where
 * kopek-level precision should be visible (₽1 234,56 → ₽1 234,56;
 * ₽1 234,00 → ₽1 234).
 */
export function formatAmountPrecise(
  amount: number | string | null | undefined,
  currency = 'RUB',
  locale = 'ru-RU'
): string {
  if (amount == null) return '—'
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (!isFinite(n)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

// ─── dates ──────────────────────────────────────────────────────────────────

/**
 * Short date — "15 апр." (day + abbreviated month, no year).
 * Use in transaction lists and tables.
 */
export function formatDate(
  date: string | Date | null | undefined,
  locale = 'ru-RU'
): string {
  const d = parseDate(date)
  if (!d) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(d)
}

/**
 * Full date — "15 апреля 2025 г." (day + full month name + year).
 * Use in detail views, modals, and export labels.
 */
export function formatFullDate(
  date: string | Date | null | undefined,
  locale = 'ru-RU'
): string {
  const d = parseDate(date)
  if (!d) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/**
 * Full date with abbreviated month and year — "15 апр. 2025 г."
 * Use in summaries and charts where horizontal space is limited.
 */
export function formatDateWithYear(
  date: string | Date | null | undefined,
  locale = 'ru-RU'
): string {
  const d = parseDate(date)
  if (!d) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

// ─── percentages ────────────────────────────────────────────────────────────

/**
 * Format a value/total ratio as a percentage string.
 * Returns "0%" for zero, negative, or non-finite totals.
 * Clamps result to [0, 999]% to prevent broken progress bar rendering.
 */
export function formatPercent(value: number, total: number): string {
  if (!isFinite(total) || total <= 0) return '0%'
  const pct = Math.round((value / total) * 100)
  return `${Math.max(0, Math.min(pct, 999))}%`
}

// ─── units ──────────────────────────────────────────────────────────────────

export function formatKm(km: number | null | undefined): string {
  if (km == null || !isFinite(km)) return '—'
  return `${km.toLocaleString('ru-RU')} км`
}

export function formatLper100(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return '—'
  return `${value.toFixed(1)} л/100 км`
}
