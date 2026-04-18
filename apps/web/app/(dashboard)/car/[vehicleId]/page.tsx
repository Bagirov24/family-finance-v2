'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccounts } from '@/hooks/useAccounts'
import {
  useFuelLog,
  useServiceItems,
  useVehicleExpenses,
  useVehicleFines,
  useVehicles,
} from '@/hooks/useVehicles'
import { formatAmount, formatDate, formatKm, formatLper100 } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const serviceItemIcons: Record<string, string> = {
  motor_oil: '🛢️',
  air_filter: '🌬️',
  brake_pads: '🛑',
  timing_belt: '⚙️',
  coolant: '🧊',
  osago: '📄',
  tech_inspection: '🔎',
}

export default function VehicleDetailPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const t = useTranslations('car')
  const common = useTranslations('common')
  const { vehicles, isLoading: vehicleLoading } = useVehicles()
  const { data: accounts = [] } = useAccounts()
  const vehicle = vehicles.find(v => v.id === vehicleId)

  const [fuelAccountId, setFuelAccountId] = useState('')
  const [fuelLiters, setFuelLiters] = useState('')
  const [fuelPrice, setFuelPrice] = useState('')
  const [fuelMileage, setFuelMileage] = useState('')
  const [fuelNote, setFuelNote] = useState('')
  const [fuelFullTank, setFuelFullTank] = useState(true)

  const [expenseAccountId, setExpenseAccountId] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('service')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [expenseMileage, setExpenseMileage] = useState('')
  const [expenseNote, setExpenseNote] = useState('')

  const { entries, fuelConsumption, isLoading: fuelLoading, addFuelEntry } = useFuelLog(vehicleId)
  const { items: serviceItems, isLoading: svcLoading } = useServiceItems(vehicleId)
  const { expenses, totalByCategory, total, isLoading: expLoading, addExpense } = useVehicleExpenses(vehicleId)
  const { fines, isLoading: finesLoading } = useVehicleFines(vehicleId)

  const unpaidFinesTotal = useMemo(
    () => fines.filter(f => f.status === 'unpaid').reduce((sum, f) => sum + Number(f.discount_amount_rub ?? f.amount_rub), 0),
    [fines]
  )

  const isVehicleReady = !!vehicle
  const defaultMileage = String(vehicle?.current_mileage ?? '')

  async function handleAddFuel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!vehicle?.user_id || !vehicle?.family_id || !fuelAccountId) return

    await addFuelEntry.mutateAsync({
      vehicle_id: vehicle.id,
      user_id: vehicle.user_id,
      family_id: vehicle.family_id,
      account_id: fuelAccountId,
      liters: Number(fuelLiters),
      price_per_liter: Number(fuelPrice),
      mileage: Number(fuelMileage),
      full_tank: fuelFullTank,
      note: fuelNote || undefined,
    })

    setFuelLiters('')
    setFuelPrice('')
    setFuelMileage(String(vehicle.current_mileage ?? ''))
    setFuelNote('')
    setFuelFullTank(true)
  }

  async function handleAddExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!vehicle?.user_id || !vehicle?.family_id || !expenseAccountId) return

    await addExpense.mutateAsync({
      vehicle_id: vehicle.id,
      user_id: vehicle.user_id,
      family_id: vehicle.family_id,
      account_id: expenseAccountId,
      category: expenseCategory,
      amount_rub: Number(expenseAmount),
      date: expenseDate,
      note: expenseNote || undefined,
      mileage_at_moment: expenseMileage ? Number(expenseMileage) : undefined,
    })

    setExpenseAmount('')
    setExpenseDate(new Date().toISOString().split('T')[0])
    setExpenseMileage(String(vehicle.current_mileage ?? ''))
    setExpenseNote('')
    setExpenseCategory('service')
  }

  if (vehicleLoading && !vehicle) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Link href="/car" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← {t('backToCars')}
        </Link>
        <div className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">
          {t('vehicleNotFound')}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link href="/car" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← {t('backToCars')}
      </Link>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{vehicle.name}</h1>
            <p className="text-sm text-muted-foreground">
              {vehicle.make} {vehicle.model} · {vehicle.year}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{t('mileage')}: {formatKm(Number(vehicle.current_mileage ?? 0))}</span>
              {vehicle.license_plate ? <span>• {t('licensePlate')}: {vehicle.license_plate}</span> : null}
              {vehicle.fuel_type ? <span>• {t(`fuelTypes.${vehicle.fuel_type}`, { defaultValue: vehicle.fuel_type })}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('avgConsumption')}</p>
          <p className="font-bold tabular-nums">{fuelConsumption ? formatLper100(fuelConsumption.avgLper100) : '—'}</p>
        </div>
        <div className="rounded-2xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('costPerKm')}</p>
          <p className="font-bold tabular-nums">
            {fuelConsumption ? `${fuelConsumption.costPerKm.toFixed(1)} ₽` : '—'}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('totalExpenses')}</p>
          <p className="font-bold tabular-nums">{formatAmount(total)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('unpaidFines')}</p>
          <p className="font-bold tabular-nums">{formatAmount(unpaidFinesTotal)}</p>
        </div>
      </div>

      <Tabs defaultValue="fuel">
        <TabsList className="w-full">
          <TabsTrigger value="fuel" className="flex-1">{t('fuel')}</TabsTrigger>
          <TabsTrigger value="service" className="flex-1">{t('service')}</TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1">{t('expenses')}</TabsTrigger>
          <TabsTrigger value="fines" className="flex-1">{t('fines')}</TabsTrigger>
        </TabsList>

        <TabsContent value="fuel" className="space-y-4 mt-4">
          <form onSubmit={handleAddFuel} className="rounded-2xl border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('addFuelEntry')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('account')}</span>
                <select
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  value={fuelAccountId}
                  onChange={(e) => setFuelAccountId(e.target.value)}
                  required
                >
                  <option value="">{t('selectAccount')}</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('mileage')}</span>
                <input
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  value={fuelMileage}
                  onChange={(e) => setFuelMileage(e.target.value)}
                  placeholder={defaultMileage}
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('liters')}</span>
                <input
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  type="number"
                  min="0"
                  step="0.1"
                  value={fuelLiters}
                  onChange={(e) => setFuelLiters(e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('pricePerLiter')}</span>
                <input
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  required
                />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-sm text-muted-foreground">{common('note')}</span>
              <input
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                value={fuelNote}
                onChange={(e) => setFuelNote(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={fuelFullTank} onChange={(e) => setFuelFullTank(e.target.checked)} />
              <span>{t('fullTank')}</span>
            </label>
            <button
              type="submit"
              disabled={addFuelEntry.isPending || !isVehicleReady}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {addFuelEntry.isPending ? common('loading') : t('addFuelEntry')}
            </button>
          </form>

          {fuelLoading ? <Skeleton className="h-32 w-full" /> : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('noFuelEntries')}</p>
          ) : (
            <ul className="space-y-2">
              {entries.map(e => (
                <li key={e.id} className="rounded-xl border bg-card p-3 flex justify-between items-center gap-4">
                  <div>
                    <p className="text-sm font-medium">{e.liters} L · {Number(e.price_per_liter).toFixed(1)} ₽/L</p>
                    <p className="text-xs text-muted-foreground">
                      {formatKm(Number(e.mileage))}
                      {e.expense?.date ? ` • ${formatDate(e.expense.date)}` : ''}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-sm">
                    {formatAmount(Number(e.liters) * Number(e.price_per_liter))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="service" className="space-y-2 mt-4">
          {svcLoading ? <Skeleton className="h-32 w-full" /> : serviceItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('noServiceItems')}</p>
          ) : (
            <ul className="space-y-2">
              {serviceItems.map(item => {
                const isDueByDate = item.next_due_date && new Date(item.next_due_date) <= new Date()
                const isDueByMileage = item.replace_every_km && item.last_replaced_mileage != null
                  ? Number(vehicle.current_mileage ?? 0) >= item.last_replaced_mileage + item.replace_every_km
                  : false
                const isDue = Boolean(isDueByDate || isDueByMileage)
                const nextMileage = item.replace_every_km && item.last_replaced_mileage != null
                  ? item.last_replaced_mileage + item.replace_every_km
                  : null

                return (
                  <li
                    key={item.id}
                    className={cn(
                      'rounded-xl border bg-card p-3',
                      isDue && 'border-red-300 dark:border-red-700'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        {serviceItemIcons[item.name_key] ?? '🔧'} {t(`serviceItems.${item.name_key}`, { defaultValue: item.name_key })}
                      </p>
                      {isDue && (
                        <span className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
                          {t('due')}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                      <p>
                        {item.last_replaced_date
                          ? `${t('lastReplaced')}: ${formatDate(item.last_replaced_date)}`
                          : t('neverReplaced')}
                      </p>
                      {item.next_due_date ? <p>{t('nextDue')}: {formatDate(item.next_due_date)}</p> : null}
                      {nextMileage ? <p>{t('nextDueMileage')}: {formatKm(nextMileage)}</p> : null}
                      {item.notes ? <p>{item.notes}</p> : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4 mt-4">
          <form onSubmit={handleAddExpense} className="rounded-2xl border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('addExpense')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('account')}</span>
                <select
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  value={expenseAccountId}
                  onChange={(e) => setExpenseAccountId(e.target.value)}
                  required
                >
                  <option value="">{t('selectAccount')}</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('category')}</span>
                <select
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  required
                >
                  {['service', 'insurance', 'documents', 'parking', 'wash', 'tires', 'fine', 'equipment', 'other'].map(category => (
                    <option key={category} value={category}>
                      {t(`expenseCategories.${category}`, { defaultValue: category })}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('amount')}</span>
                <input
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('date')}</span>
                <input
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('mileageOptional')}</span>
                <input
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                  type="number"
                  min={0}
                  value={expenseMileage}
                  onChange={(e) => setExpenseMileage(e.target.value)}
                  placeholder={defaultMileage}
                />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-sm text-muted-foreground">{common('note')}</span>
              <input
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={addExpense.isPending || !isVehicleReady}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {addExpense.isPending ? common('loading') : t('addExpense')}
            </button>
          </form>

          {expLoading ? <Skeleton className="h-32 w-full" /> : (
            <>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {Object.entries(totalByCategory).map(([cat, sum]) => (
                  <div key={cat} className="rounded-xl border bg-card p-3">
                    <p className="text-xs text-muted-foreground capitalize">{t(`expenseCategories.${cat}`, { defaultValue: cat })}</p>
                    <p className="font-bold tabular-nums">{formatAmount(sum)}</p>
                  </div>
                ))}
              </div>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('noExpenses')}</p>
              ) : (
                <ul className="space-y-2">
                  {expenses.slice(0, 20).map(e => (
                    <li key={e.id} className="rounded-xl border bg-card p-3 flex justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {t(`expenseCategories.${e.category}`, { defaultValue: e.category })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(e.date)}
                          {e.mileage_at_moment ? ` • ${formatKm(Number(e.mileage_at_moment))}` : ''}
                          {e.note ? ` • ${e.note}` : ''}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums text-sm">{formatAmount(Number(e.amount_rub))}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="fines" className="space-y-3 mt-4">
          {finesLoading ? <Skeleton className="h-32 w-full" /> : fines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('noFines')}</p>
          ) : (
            <ul className="space-y-2">
              {fines.map(fine => {
                const discountedAmount = Number(fine.discount_amount_rub ?? fine.amount_rub)
                const hasDiscount = fine.discount_amount_rub != null && Number(fine.discount_amount_rub) < Number(fine.amount_rub)
                return (
                  <li key={fine.id} className="rounded-xl border bg-card p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{fine.description || t('fine')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fine.issued_date ? `${t('issuedDate')}: ${formatDate(fine.issued_date)}` : t('issuedDateUnknown')}
                          {fine.discount_until ? ` • ${t('discountUntil')}: ${formatDate(fine.discount_until)}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">{formatAmount(discountedAmount)}</p>
                        {hasDiscount ? (
                          <p className="text-xs text-muted-foreground line-through">{formatAmount(Number(fine.amount_rub))}</p>
                        ) : null}
                        <span className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold mt-1',
                          fine.status === 'paid' && 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
                          fine.status === 'disputed' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
                          fine.status === 'unpaid' && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        )}>
                          {t(`fineStatuses.${fine.status}`, { defaultValue: fine.status })}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
