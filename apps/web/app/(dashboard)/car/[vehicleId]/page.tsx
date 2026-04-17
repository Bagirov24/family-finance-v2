'use client'
import { use } from 'react'
import { useTranslations } from 'next-intl'
import { useVehicles, useFuelLog, useServiceItems, useVehicleExpenses } from '@/hooks/useVehicles'
import { useFamily } from '@/hooks/useFamily'
import { useAccounts } from '@/hooks/useAccounts'
import { formatAmount, formatKm, formatLper100, formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Fuel, Wrench, AlertTriangle, Plus, Check } from 'lucide-react'

const EXPENSE_CATEGORIES = ['fuel','service','insurance','documents','parking','wash','tires','fine','equipment','other'] as const

export default function VehicleDetailPage({ params }: { params: Promise<{ vehicleId: string }> }) {
  const { vehicleId } = use(params)
  const t = useTranslations()
  const { vehicles } = useVehicles()
  const { family, currentUserId } = useFamily()
  const { accounts } = useAccounts()
  const { entries, fuelConsumption, addFuelEntry } = useFuelLog(vehicleId)
  const { items, updateServiceItem } = useServiceItems(vehicleId)
  const { expenses, totalByCategory, total, addExpense } = useVehicleExpenses(vehicleId)

  const vehicle = vehicles.find(v => v.id === vehicleId)
  const [fuelOpen, setFuelOpen] = useState(false)
  const [expOpen, setExpOpen] = useState(false)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [serviceForm, setServiceForm] = useState({ date: '', mileage: '' })

  const [fuelForm, setFuelForm] = useState({ liters: '', price_per_liter: '', mileage: '', full_tank: true, note: '', account_id: '' })
  const [expForm, setExpForm] = useState({ category: 'service', amount_rub: '', date: new Date().toISOString().split('T')[0], note: '', mileage_at_moment: '', account_id: '' })
  const setF = (k: string, v: string | boolean) => setFuelForm(f => ({ ...f, [k]: v }))
  const setE = (k: string, v: string) => setExpForm(f => ({ ...f, [k]: v }))

  const handleAddFuel = async () => {
    if (!family || !currentUserId || !fuelForm.liters || !fuelForm.price_per_liter || !fuelForm.mileage || !fuelForm.account_id) return
    await addFuelEntry.mutateAsync({
      vehicle_id: vehicleId,
      user_id: currentUserId,
      family_id: family.id,
      account_id: fuelForm.account_id,
      liters: parseFloat(fuelForm.liters),
      price_per_liter: parseFloat(fuelForm.price_per_liter),
      mileage: parseInt(fuelForm.mileage),
      full_tank: fuelForm.full_tank,
      note: fuelForm.note || undefined
    })
    setFuelOpen(false)
  }

  const handleAddExp = async () => {
    if (!family || !currentUserId || !expForm.amount_rub || !expForm.account_id) return
    await addExpense.mutateAsync({
      vehicle_id: vehicleId,
      user_id: currentUserId,
      family_id: family.id,
      account_id: expForm.account_id,
      category: expForm.category,
      amount_rub: parseFloat(expForm.amount_rub),
      date: expForm.date,
      note: expForm.note || undefined,
      mileage_at_moment: expForm.mileage_at_moment ? parseInt(expForm.mileage_at_moment) : undefined
    })
    setExpOpen(false)
  }

  const handleServiceUpdate = async () => {
    if (!serviceId || !serviceForm.date) return
    await updateServiceItem.mutateAsync({
      id: serviceId,
      last_replaced_date: serviceForm.date,
      last_replaced_mileage: parseInt(serviceForm.mileage) || (vehicle?.current_mileage ?? 0)
    })
    setServiceId(null)
  }

  if (!vehicle) return <p className="p-4 text-muted-foreground">{t('common.loading')}</p>

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      {/* Vehicle header */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-2xl p-5">
        <h1 className="text-2xl font-bold">{vehicle.name}</h1>
        <p className="text-slate-400 text-sm">{vehicle.make} {vehicle.model} · {vehicle.year}</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-slate-400 text-xs">Пробег</p>
            <p className="font-semibold mt-0.5">{formatKm(vehicle.current_mileage)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-slate-400 text-xs">Расход</p>
            <p className="font-semibold mt-0.5">{fuelConsumption ? formatLper100(fuelConsumption) : '—'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <p className="text-slate-400 text-xs">За всё время</p>
            <p className="font-semibold mt-0.5">{formatAmount(total)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1 gap-1 rounded-xl" onClick={() => setFuelOpen(true)}>
          <Fuel className="w-4 h-4" />Заправка
        </Button>
        <Button size="sm" variant="outline" className="flex-1 gap-1 rounded-xl" onClick={() => setExpOpen(true)}>
          <Plus className="w-4 h-4" />Расход
        </Button>
      </div>

      <Tabs defaultValue="fuel">
        <TabsList className="w-full">
          <TabsTrigger value="fuel" className="flex-1">{t('car.fuel_log')}</TabsTrigger>
          <TabsTrigger value="service" className="flex-1">{t('car.service_book')}</TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1">Расходы</TabsTrigger>
        </TabsList>

        {/* Fuel log */}
        <TabsContent value="fuel" className="space-y-2 mt-3">
          {entries.length === 0 && <p className="text-center text-muted-foreground py-6">{t('common.empty')}</p>}
          {entries.map(e => (
            <div key={e.id} className="bg-card border rounded-2xl p-3 flex items-center gap-3">
              <Fuel className="w-8 h-8 text-blue-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{e.liters} л · {Number(e.price_per_liter).toFixed(1)} ₽/л</p>
                <p className="text-xs text-muted-foreground">{formatKm(e.mileage)} · {e.expense?.date ? formatDate(e.expense.date) : ''}</p>
              </div>
              <p className="font-semibold">{formatAmount(Number(e.liters) * Number(e.price_per_liter))}</p>
            </div>
          ))}
        </TabsContent>

        {/* Service book */}
        <TabsContent value="service" className="space-y-2 mt-3">
          {items.map(item => {
            const daysLeft = item.next_due_date
              ? Math.ceil((new Date(item.next_due_date).getTime() - Date.now()) / 86400000)
              : null
            const urgent = daysLeft !== null && daysLeft <= 30
            const overdue = daysLeft !== null && daysLeft < 0
            return (
              <div key={item.id} className={cn(
                'bg-card border rounded-2xl p-3',
                overdue && 'border-destructive/50 bg-destructive/5',
                urgent && !overdue && 'border-amber-300 bg-amber-50 dark:bg-amber-950'
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{t(`car.service_items.${item.name_key}` as 'car.service_items.motor_oil')}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.last_replaced_date ? `Последнее: ${formatDate(item.last_replaced_date)}` : 'Не записано'}
                      {item.replace_every_km ? ` · замена каждые ${(item.replace_every_km/1000).toFixed(0)}т. км` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysLeft !== null && (
                      <span className={cn('text-xs font-medium', overdue ? 'text-destructive' : urgent ? 'text-amber-600' : 'text-green-600')}>
                        {overdue ? `Просрочено ${Math.abs(daysLeft)}д` : `${daysLeft}д`}
                      </span>
                    )}
                    <button
                      onClick={() => { setServiceId(item.id); setServiceForm({ date: '', mileage: String(vehicle.current_mileage) }) }}
                      className="text-xs text-primary hover:underline"
                    >
                      Заменил
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </TabsContent>

        {/* All expenses */}
        <TabsContent value="expenses" className="space-y-2 mt-3">
          {expenses.map(e => (
            <div key={e.id} className="bg-card border rounded-2xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t(`car.categories.${e.category}` as 'car.categories.fuel')}</p>
                <p className="text-xs text-muted-foreground">{formatDate(e.date)}{e.mileage_at_moment ? ` · ${formatKm(e.mileage_at_moment)}` : ''}</p>
              </div>
              <p className="font-semibold">{formatAmount(Number(e.amount_rub))}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Add fuel dialog */}
      <Dialog open={fuelOpen} onOpenChange={setFuelOpen}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Заправка</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Литры</Label><Input type="number" className="rounded-xl" value={fuelForm.liters} onChange={e => setF('liters', e.target.value)} /></div>
              <div className="space-y-1"><Label>Цена/л</Label><Input type="number" className="rounded-xl" value={fuelForm.price_per_liter} onChange={e => setF('price_per_liter', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Пробег</Label><Input type="number" className="rounded-xl" value={fuelForm.mileage} onChange={e => setF('mileage', e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Счёт</Label>
              <Select value={fuelForm.account_id} onValueChange={v => setF('account_id', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={fuelForm.full_tank} onChange={e => setF('full_tank', e.target.checked)} id="full_tank" />
              <Label htmlFor="full_tank">Бак заполнен до краёв</Label>
            </div>
            <Button className="w-full rounded-xl" disabled={addFuelEntry.isPending} onClick={handleAddFuel}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add expense dialog */}
      <Dialog open={expOpen} onOpenChange={setExpOpen}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Расход на авто</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label>Категория</Label>
              <Select value={expForm.category} onValueChange={v => setE('category', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.filter(c => c !== 'fuel').map(c => <SelectItem key={c} value={c}>{t(`car.categories.${c}` as 'car.categories.service')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>{t('common.amount')}</Label><Input type="number" className="rounded-xl" value={expForm.amount_rub} onChange={e => setE('amount_rub', e.target.value)} /></div>
              <div className="space-y-1"><Label>Пробег</Label><Input type="number" className="rounded-xl" value={expForm.mileage_at_moment} onChange={e => setE('mileage_at_moment', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Дата</Label><Input type="date" className="rounded-xl" value={expForm.date} onChange={e => setE('date', e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Счёт</Label>
              <Select value={expForm.account_id} onValueChange={v => setE('account_id', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>{t('common.note')}</Label><Input className="rounded-xl" value={expForm.note} onChange={e => setE('note', e.target.value)} /></div>
            <Button className="w-full rounded-xl" disabled={addExpense.isPending} onClick={handleAddExp}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service mark dialog */}
      <Dialog open={!!serviceId} onOpenChange={() => setServiceId(null)}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Отметить замену</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1"><Label>Дата</Label><Input type="date" className="rounded-xl" value={serviceForm.date} onChange={e => setServiceForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Пробег</Label><Input type="number" className="rounded-xl" value={serviceForm.mileage} onChange={e => setServiceForm(f => ({ ...f, mileage: e.target.value }))} /></div>
            <Button className="w-full rounded-xl" disabled={updateServiceItem.isPending} onClick={handleServiceUpdate}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
