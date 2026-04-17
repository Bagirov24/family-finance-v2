'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useFuelLog, useServiceItems, useVehicleExpenses, useVehicles } from '@/hooks/useVehicles'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export default function VehicleDetailPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const t = useTranslations('car')
  const { vehicles } = useVehicles()
  const vehicle = vehicles.find(v => v.id === vehicleId)

  const { entries, fuelConsumption, isLoading: fuelLoading } = useFuelLog(vehicleId)
  const { items: serviceItems, isLoading: svcLoading } = useServiceItems(vehicleId)
  const { expenses, totalByCategory, total, isLoading: expLoading } = useVehicleExpenses(vehicleId)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold">{vehicle?.name ?? t('vehicle')}</h1>
        <p className="text-sm text-muted-foreground">
          {vehicle?.make} {vehicle?.model} · {vehicle?.year} · {Number(vehicle?.current_mileage ?? 0).toLocaleString('ru')} km
        </p>
      </div>

      {/* Fuel stats */}
      {fuelConsumption && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('avgConsumption')}</p>
            <p className="font-bold tabular-nums">{fuelConsumption.avgLper100.toFixed(1)} L</p>
          </div>
          <div className="rounded-2xl border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('costPerKm')}</p>
            <p className="font-bold tabular-nums">{fuelConsumption.costPerKm.toFixed(1)} ₽</p>
          </div>
          <div className="rounded-2xl border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{t('totalExpenses')}</p>
            <p className="font-bold tabular-nums">{formatAmount(total)}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="fuel">
        <TabsList className="w-full">
          <TabsTrigger value="fuel" className="flex-1">{t('fuel')}</TabsTrigger>
          <TabsTrigger value="service" className="flex-1">{t('service')}</TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1">{t('expenses')}</TabsTrigger>
        </TabsList>

        {/* Fuel log */}
        <TabsContent value="fuel" className="space-y-2 mt-4">
          {fuelLoading ? <Skeleton className="h-32 w-full" /> : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('noFuelEntries')}</p>
          ) : (
            <ul className="space-y-2">
              {entries.map(e => (
                <li key={e.id} className="rounded-xl border bg-card p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{e.liters} L · {Number(e.price_per_liter).toFixed(1)} ₽/L</p>
                    <p className="text-xs text-muted-foreground">{Number(e.mileage).toLocaleString('ru')} km</p>
                  </div>
                  <p className="font-semibold tabular-nums text-sm">
                    {formatAmount(Number(e.liters) * Number(e.price_per_liter))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Service book */}
        <TabsContent value="service" className="space-y-2 mt-4">
          {svcLoading ? <Skeleton className="h-32 w-full" /> : (
            <ul className="space-y-2">
              {serviceItems.map(item => {
                const isDue = item.next_due_date && new Date(item.next_due_date) <= new Date()
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'rounded-xl border bg-card p-3',
                      isDue && 'border-red-300 dark:border-red-700'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {item.icon} {t(`serviceItems.${item.name_key}`, { defaultValue: item.name_key })}
                      </p>
                      {isDue && (
                        <span className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
                          {t('due')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.last_replaced_date
                        ? `${t('lastReplaced')}: ${item.last_replaced_date}`
                        : t('neverReplaced')}
                      {item.next_due_date && ` • ${t('nextDue')}: ${item.next_due_date}`}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </TabsContent>

        {/* Expenses */}
        <TabsContent value="expenses" className="space-y-3 mt-4">
          {expLoading ? <Skeleton className="h-32 w-full" /> : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(totalByCategory).map(([cat, sum]) => (
                  <div key={cat} className="rounded-xl border bg-card p-3">
                    <p className="text-xs text-muted-foreground capitalize">{t(`expenseCategories.${cat}`, { defaultValue: cat })}</p>
                    <p className="font-bold tabular-nums">{formatAmount(sum)}</p>
                  </div>
                ))}
              </div>
              <ul className="space-y-2">
                {expenses.slice(0, 20).map(e => (
                  <li key={e.id} className="rounded-xl border bg-card p-3 flex justify-between">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {t(`expenseCategories.${e.category}`, { defaultValue: e.category })}
                      </p>
                      <p className="text-xs text-muted-foreground">{e.date}{e.note ? ` · ${e.note}` : ''}</p>
                    </div>
                    <p className="font-semibold tabular-nums text-sm">{formatAmount(Number(e.amount_rub))}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
