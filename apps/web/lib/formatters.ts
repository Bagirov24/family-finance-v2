export function formatAmount(
  amount: number,
  currency = 'RUB',
  locale = 'ru-RU'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(date: string | Date, locale = 'ru-RU'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short'
  }).format(new Date(date))
}

export function formatFullDate(date: string | Date, locale = 'ru-RU'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

export function formatKm(km: number): string {
  return `${km.toLocaleString('ru-RU')} км`
}

export function formatLper100(value: number): string {
  return `${value.toFixed(1)} л/100 км`
}
