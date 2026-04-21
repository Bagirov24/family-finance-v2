import { getDayOfYear, getDaysInMonth, getMonthName } from './utils'

describe('getDayOfYear', () => {
  it('returns 1 for January 1', () => {
    expect(getDayOfYear(new Date(2025, 0, 1))).toBe(1)
  })

  it('returns 365 for December 31 (non-leap year 2025)', () => {
    expect(getDayOfYear(new Date(2025, 11, 31))).toBe(365)
  })

  it('returns 366 for December 31 (leap year 2024)', () => {
    expect(getDayOfYear(new Date(2024, 11, 31))).toBe(366)
  })

  it('returns 105 for April 15 2025 (31+28+31+15)', () => {
    expect(getDayOfYear(new Date(2025, 3, 15))).toBe(105)
  })

  it('is not zero-indexed (day 1 = Jan 1, not 0)', () => {
    expect(getDayOfYear(new Date(2025, 0, 1))).toBe(1)
    expect(getDayOfYear(new Date(2025, 0, 2))).toBe(2)
  })

  it('regression: old impl used Jan 0 (Dec 31 prev year) as start — new result must be +1 vs naive diff', () => {
    // Old: start = Dec 31 prev year → diff for Jan 1 = 1 day → floor(86400000/86400000) = 1 ✓
    // But for Dec 31: old gave floor((365*86400000 + timezone_offset) / 86400000)
    //   which is wrong on DST days. New UTC impl is deterministic.
    const jan1 = getDayOfYear(new Date(2025, 0, 1))
    const dec31 = getDayOfYear(new Date(2025, 11, 31))
    expect(dec31 - jan1).toBe(364) // 365 days total, jan1=1, dec31=365 → diff=364
  })
})

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => expect(getDaysInMonth(1, 2025)).toBe(31))
  it('returns 28 for February in non-leap year', () => expect(getDaysInMonth(2, 2025)).toBe(28))
  it('returns 29 for February in leap year 2024', () => expect(getDaysInMonth(2, 2024)).toBe(29))
  it('returns 30 for April', () => expect(getDaysInMonth(4, 2025)).toBe(30))
  it('returns 31 for December', () => expect(getDaysInMonth(12, 2025)).toBe(31))
})

describe('getMonthName', () => {
  it('returns a non-empty string for each month', () => {
    for (let m = 1; m <= 12; m++) {
      expect(getMonthName(m).length).toBeGreaterThan(0)
    }
  })

  it('returns Russian month names by default', () => {
    const jan = getMonthName(1)
    expect(jan).toMatch(/январ/i)
  })
})
