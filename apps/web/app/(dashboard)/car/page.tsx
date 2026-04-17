'use client'
import { useTranslations } from 'next-intl'
import { useVehicles } from '@/hooks/useVehicles'
import { useFamily } from '@/hooks/useFamily'
import { formatAmount, formatKm } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import Link from 'next/link'
import { Plus, Car, Fuel, Wrench, AlertTriangle } from 'lucide-react'
import { useVehicleExpenses, useServiceItems } from '@/hooks/useVehicles'

function VehicleCard({ vehicle }: { vehicle: { id: string; name: string; make: string; model: string; year: number; current_mileage: number; fuel_type: string } }) {
  const t = useTranslations()
  const { total, totalByCategory } = useVehicleExpenses(vehicle.id)
  const { items } = useServiceItems(vehicle.id)

  const urgentServices = items.filter(item => {
    if (!item.next_due_date) return false
    const days = Math.ceil((new Date(item.next_due_date).getTime() - Date.now()) / 86400000)
    return days <= 30
  })

  return (
    <Link href={`/car/${vehicle.id}`}>
      <div className="bg-card border rounded-2xl p-4 space-y-3 hover:border-primary transition-colors cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{vehicle.name}</h3>
            <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model} · {vehicle.year}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Пробег</p>
            <p className="font-semibold">{formatKm(vehicle.current_mileage)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <Fuel className="w-4 h-4 mx-auto text-blue-500 mb-0.5" />
            <p className="text-xs font-medium">{formatAmount(totalByCategory['fuel'] ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground">{t('car.categories.fuel')}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <Wrench className="w-4 h-4 mx-auto text-amber-500 mb-0.5" />
            <p className="text-xs font-medium">{formatAmount(totalByCategory['service'] ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground">{t('car.categories.service')}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-2 text-center">
            <Car className="w-4 h-4 mx-auto text-indigo-500 mb-0.5" />
            <p className="text-xs font-medium">{formatAmount(total)}</p>
            <p className="text-[10px] text-muted-foreground">Всего</p>
          </div>
        </div>
        {urgentServices.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950 rounded-xl p-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {urgentServices.length} техобслуживания скоро подходят
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function CarPage() {
  const t = useTranslations()
  const { vehicles, isLoading, createVehicle } = useVehicles()
  const { family, currentUserId } = useFamily()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', make: '', model: '', year: '', fuel_type: 'gasoline', initial_mileage: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!family || !currentUserId || !form.name || !form.make || !form.model || !form.year) return
    await createVehicle.mutateAsync({
      user_id: currentUserId,
      family_id: family.id,
      name: form.name,
      make: form.make,
      model: form.model,
      year: parseInt(form.year),
      fuel_type: form.fuel_type,
      initial_mileage: parseInt(form.initial_mileage) || 0
    })
    setOpen(false)
  }

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('car.title')}</h1>
        <Button size="sm" className="gap-1 rounded-xl" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />{t('car.add')}
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">{t('common.loading')}</p>}

      <div className="space-y-4">
        {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
      </div>

      {!isLoading && vehicles.length === 0 && (
        <div className="text-center py-16">
          <Car className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">{t('common.empty')}</p>
          <Button className="mt-4 rounded-xl" onClick={() => setOpen(true)}>{t('car.add')}</Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader><DialogTitle>{t('car.add')}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1"><Label>Название (напр. Моя Лада)</Label><Input className="rounded-xl" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Марка</Label><Input className="rounded-xl" value={form.make} onChange={e => set('make', e.target.value)} placeholder="Toyota" /></div>
              <div className="space-y-1"><Label>Модель</Label><Input className="rounded-xl" value={form.model} onChange={e => set('model', e.target.value)} placeholder="Camry" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Год</Label><Input type="number" className="rounded-xl" value={form.year} onChange={e => set('year', e.target.value)} placeholder="2020" /></div>
              <div className="space-y-1"><Label>Пробег</Label><Input type="number" className="rounded-xl" value={form.initial_mileage} onChange={e => set('initial_mileage', e.target.value)} placeholder="0" /></div>
            </div>
            <div className="space-y-1">
              <Label>Топливо</Label>
              <Select value={form.fuel_type} onValueChange={v => set('fuel_type', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['gasoline','diesel','gas','electric','hybrid'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full rounded-xl" disabled={createVehicle.isPending} onClick={handleCreate}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
