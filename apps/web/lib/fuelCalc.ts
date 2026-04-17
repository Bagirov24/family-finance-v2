export interface FuelEntry {
  mileage: number
  liters: number
  full_tank: boolean
  date: string
}

export function calcFuelConsumption(entries: FuelEntry[]): number | null {
  const fullTankEntries = entries
    .filter(e => e.full_tank)
    .sort((a, b) => a.mileage - b.mileage)

  if (fullTankEntries.length < 2) return null

  const last = fullTankEntries[fullTankEntries.length - 1]
  const prev = fullTankEntries[fullTankEntries.length - 2]

  const kmDriven = last.mileage - prev.mileage
  if (kmDriven <= 0) return null

  const litersSpent = entries
    .filter(e => e.date >= prev.date && e.date <= last.date)
    .reduce((sum, e) => sum + e.liters, 0)

  return parseFloat(((litersSpent / kmDriven) * 100).toFixed(2))
}

export function calcCostPerKm(
  totalExpenses: number,
  totalKm: number
): number | null {
  if (totalKm <= 0) return null
  return parseFloat((totalExpenses / totalKm).toFixed(2))
}

export function calcNextServiceKm(
  lastMileage: number,
  intervalKm: number,
  currentMileage: number
): { remaining: number; overdue: boolean } {
  const nextDue = lastMileage + intervalKm
  const remaining = nextDue - currentMileage
  return { remaining, overdue: remaining <= 0 }
}
