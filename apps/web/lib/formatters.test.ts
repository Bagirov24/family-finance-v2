import {
  formatAmount,
  formatAmountPrecise,
  formatDate,
  formatFullDate,
  formatDateWithYear,
  formatPercent,
  formatKm,
  formatLper100,
} from './formatters'

// ─── formatAmount ────────────────────────────────────────────────────────────

describe('formatAmount', () => {
  it('formats a whole-number amount in RUB with no decimals', () => {
    const result = formatAmount(1000)
    expect(result).toContain('1')
    expect(result).toContain('000')
  })

  it('rounds to 0 decimal places', () => {
    const result = formatAmount(1234.56)
    expect(result).not.toContain(',56')
    expect(result).not.toContain('.56')
  })

  it('accepts string input from Supabase numeric columns', () => {
    const result = formatAmount('1234.56' as unknown as number)
    expect(result).not.toBe('—')
    expect(result).not.toContain('NaN')
  })

  it('returns — for null', () => {
    expect(formatAmount(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatAmount(undefined)).toBe('—')
  })

  it('returns — for NaN', () => {
    expect(formatAmount(NaN)).toBe('—')
  })

  it('returns — for Infinity', () => {
    expect(formatAmount(Infinity)).toBe('—')
  })

  it('formats negative amounts (expense display)', () => {
    const result = formatAmount(-5000)
    expect(result).toContain('5')
    expect(result).toContain('000')
  })
})

// ─── formatAmountPrecise ─────────────────────────────────────────────────────

describe('formatAmountPrecise', () => {
  it('omits decimals when amount is whole', () => {
    const result = formatAmountPrecise(1000)
    expect(result).not.toContain(',00')
    expect(result).not.toContain('.00')
  })

  it('handles null gracefully', () => {
    expect(formatAmountPrecise(null)).toBe('—')
  })

  it('handles string input', () => {
    const result = formatAmountPrecise('999.99' as unknown as number)
    expect(result).not.toBe('—')
    expect(result).not.toContain('NaN')
  })
})

// ─── formatDate — CRITICAL: timezone correctness ─────────────────────────────

describe('formatDate — timezone safety', () => {
  it('does NOT shift a YYYY-MM-DD date to the previous day (UTC+3 regression)', () => {
    // Bug: new Date("2025-04-15") in UTC+3 = "2025-04-14 03:00 local"
    // which Intl formats as "14 апр." — one day early.
    // Fix: parse "2025-04-15" as "2025-04-15T00:00:00" (local midnight).
    const result = formatDate('2025-04-15')
    expect(result).toContain('15')
    expect(result).not.toMatch(/^14/)
  })

  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns — for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('returns — for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('accepts a Date object', () => {
    const d = new Date(2025, 3, 15) // April 15 local
    const result = formatDate(d)
    expect(result).toContain('15')
  })

  it('handles year boundary — Jan 1 should not become Dec 31', () => {
    const result = formatDate('2025-01-01')
    expect(result).toContain('1')
    // Should NOT contain '31' (which would indicate UTC shift to Dec 31)
    expect(result).not.toMatch(/31/)
  })
})

describe('formatFullDate', () => {
  it('includes year in output', () => {
    const result = formatFullDate('2025-04-15')
    expect(result).toContain('2025')
  })

  it('does not shift date for UTC offset dates', () => {
    const result = formatFullDate('2025-01-01')
    expect(result).toContain('2025')
  })

  it('returns — for null', () => {
    expect(formatFullDate(null)).toBe('—')
  })
})

describe('formatDateWithYear', () => {
  it('includes abbreviated month and year', () => {
    const result = formatDateWithYear('2025-04-15')
    expect(result).toContain('2025')
    expect(result).toContain('15')
  })

  it('returns — for null', () => {
    expect(formatDateWithYear(null)).toBe('—')
  })
})

// ─── formatPercent ───────────────────────────────────────────────────────────

describe('formatPercent', () => {
  it('calculates correct percentage', () => {
    expect(formatPercent(1, 2)).toBe('50%')
    expect(formatPercent(1, 3)).toBe('33%')
    expect(formatPercent(3, 3)).toBe('100%')
  })

  it('returns 0% for zero total', () => {
    expect(formatPercent(100, 0)).toBe('0%')
  })

  it('returns 0% for negative total (regression: was returning "-20%")', () => {
    expect(formatPercent(100, -500)).toBe('0%')
  })

  it('returns 0% for Infinity total', () => {
    expect(formatPercent(100, Infinity)).toBe('0%')
  })

  it('clamps overbudget percent to 999% max', () => {
    expect(formatPercent(10000, 1)).toBe('999%')
  })

  it('returns 0% for 0 value with positive total', () => {
    expect(formatPercent(0, 1000)).toBe('0%')
  })

  it('never returns a negative percentage string', () => {
    const result = formatPercent(-100, 500)
    expect(result).toBe('0%')
  })
})

// ─── formatKm ────────────────────────────────────────────────────────────────

describe('formatKm', () => {
  it('formats kilometers with km suffix', () => {
    const result = formatKm(12345)
    expect(result).toContain('км')
    expect(result).toContain('12')
  })

  it('returns — for null', () => {
    expect(formatKm(null)).toBe('—')
  })

  it('returns — for NaN', () => {
    expect(formatKm(NaN)).toBe('—')
  })
})

// ─── formatLper100 ───────────────────────────────────────────────────────────

describe('formatLper100', () => {
  it('formats with 1 decimal place and unit', () => {
    expect(formatLper100(8.5)).toBe('8.5 л/100 км')
    expect(formatLper100(10)).toBe('10.0 л/100 км')
  })

  it('returns — for null', () => {
    expect(formatLper100(null)).toBe('—')
  })

  it('returns — for NaN', () => {
    expect(formatLper100(NaN)).toBe('—')
  })
})
