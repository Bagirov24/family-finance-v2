'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useVehicles, type FuelType } from '@/hooks/useVehicles'
import { useFamily } from '@/hooks/useFamily'

const FUEL_TYPES: FuelType[] = ['gasoline', 'diesel', 'gas', 'electric', 'hybrid']

export function AddVehicleModal() {
  const t = useTranslations('car')
  const tc = useTranslations('common')
  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [fuelType, setFuelType] = useState<FuelType>('gasoline')
  const [initialMileage, setInitialMileage] = useState('0')
  const [licensePlate, setLicensePlate] = useState('')
  const [vin, setVin] = useState('')
  const [loading, setLoading] = useState(false)

  const { createVehicle } = useVehicles()
  const { family } = useFamily()

  function reset() {
    setName(''); setMake(''); setModel('')
    setYear(String(new Date().getFullYear()))
    setFuelType('gasoline'); setInitialMileage('0')
    setLicensePlate(''); setVin('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !make.trim() || !model.trim()) return
    setLoading(true)
    try {
      await createVehicle.mutateAsync({
        family_id: family?.id ?? null,
        name: name.trim(),
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year),
        fuel_type: fuelType,
        initial_mileage: parseInt(initialMileage) || 0,
        license_plate: licensePlate.trim() || undefined,
        vin: vin.trim() || undefined,
      })
      toast.success(tc('success'))
      reset()
      setOpen(false)
    } catch {
      toast.error(tc('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={15} className="mr-1" />{t('add')}
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!v) { reset(); setOpen(false) } else setOpen(true) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('add')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>{tc('name') ?? 'Название'}</Label>
              <Input
                placeholder="Моя машина"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Марка</Label>
                <Input placeholder="Toyota" value={make} onChange={e => setMake(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Модель</Label>
                <Input placeholder="Camry" value={model} onChange={e => setModel(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Год</Label>
                <Input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  required
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Топливо</Label>
                <Select value={fuelType} onValueChange={v => setFuelType(v as FuelType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FUEL_TYPES.map(ft => (
                      <SelectItem key={ft} value={ft}>{t(`fuelTypes.${ft}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Начальный пробег, км</Label>
              <Input
                type="number"
                min="0"
                value={initialMileage}
                onChange={e => setInitialMileage(e.target.value)}
                className="tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Гос. номер</Label>
                <Input
                  placeholder="А123ВС77"
                  value={licensePlate}
                  onChange={e => setLicensePlate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>VIN</Label>
                <Input
                  placeholder="необязательно"
                  value={vin}
                  onChange={e => setVin(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { reset(); setOpen(false) }}
              >
                {tc('cancel')}
              </Button>
              <Button type="submit" className="flex-1" disabled={loading || createVehicle.isPending}>
                {tc('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
