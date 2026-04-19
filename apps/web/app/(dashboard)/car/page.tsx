'use client'
import { useTranslations } from 'next-intl'
import { useVehicles } from '@/hooks/useVehicles'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Car } from 'lucide-react'
import { AddVehicleModal } from '@/components/car/AddVehicleModal'

export default function CarPage() {
  const t = useTranslations('car')
  const { vehicles, isLoading } = useVehicles()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <AddVehicleModal />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : !vehicles.length ? (
        <div className="py-16 text-center text-muted-foreground">
          <Car size={40} className="mx-auto mb-4 opacity-30" />
          <p>{t('noVehicles')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => (
            <Link
              key={v.id}
              href={`/car/${v.id}`}
              className="block rounded-2xl border bg-card p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-sm text-muted-foreground">{v.make} {v.model} · {v.year}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{t('mileage')}</p>
                  <p className="font-bold tabular-nums">{Number(v.current_mileage).toLocaleString('ru')} km</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
