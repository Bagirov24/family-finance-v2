'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Pencil, Trash2, ArchiveX, X, Check } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccounts } from '@/hooks/useAccounts'
import {
  useFuelLog,
  useServiceItems,
  useVehicleExpenses,
  useVehicleFines,
  useVehicles,
  type FineStatus,
  type FuelType,
  type ServiceItem,
  type ServiceItemNameKey,
  type VehicleExpenseCategory,
  type VehicleFine,
} from '@/hooks/useVehicles'
import { VehicleHealthScore } from '@/components/car/VehicleHealthScore'
import { formatAmount, formatDate, formatKm, formatLper100 } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const serviceItemIcons: Record<ServiceItemNameKey, string> = {
  motor_oil: '🛢️',
  air_filter: '🌬️',
  brake_pads: '🛑',
  timing_belt: '⚙️',
  coolant: '🧊',
  osago: '📄',
  tech_inspection: '🔎',
}

const serviceItemKeys: readonly ServiceItemNameKey[] = [
  'motor_oil',
  'air_filter',
  'brake_pads',
  'timing_belt',
  'coolant',
  'osago',
  'tech_inspection',
] as const

const fuelTypes: readonly FuelType[] = ['gasoline', 'diesel', 'gas', 'electric', 'hybrid'] as const
const fineStatuses: readonly FineStatus[] = ['unpaid', 'paid', 'disputed'] as const

const expenseCategories: readonly VehicleExpenseCategory[] = [
  'service',
  'insurance',
  'documents',
  'parking',
  'wash',
  'tires',
  'fine',
  'equipment',
  'other',
] as const

function isFuelType(value: string): value is FuelType {
  return fuelTypes.includes(value as FuelType)
}

function isExpenseCategory(value: string): value is VehicleExpenseCategory {
  return expenseCategories.includes(value as VehicleExpenseCategory)
}

// ── Edit Vehicle Form ────────────────────────────────────────────────────────
function EditVehicleForm({
  vehicle,
  onClose,
}: {
  vehicle: NonNullable<ReturnType<typeof useVehicles>['vehicles'][number]>
  onClose: () => void
}) {
  const t = useTranslations('car')
  const common = useTranslations('common')
  const { updateVehicle } = useVehicles()

  const [name, setName] = useState(vehicle.name)
  const [make, setMake] = useState(vehicle.make)
  const [model, setModel] = useState(vehicle.model)
  const [year, setYear] = useState(String(vehicle.year))
  const [fuelType, setFuelType] = useState<FuelType | ''>(vehicle.fuel_type ?? '')
  const [licensePlate, setLicensePlate] = useState(vehicle.license_plate ?? '')
  const [vin, setVin] = useState(vehicle.vin ?? '')
  const [currentMileage, setCurrentMileage] = useState(String(vehicle.current_mileage ?? ''))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await updateVehicle.mutateAsync({
      id: vehicle.id,
      name,
      make,
      model,
      year: Number(year),
      fuel_type: fuelType || null,
      license_plate: licensePlate || null,
      vin: vin || null,
      current_mileage: currentMileage ? Number(currentMileage) : undefined,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {common('edit')}
        </h2>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm text-muted-foreground">{t('vehicle')}</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">Make</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={make}
            onChange={e => setMake(e.target.value)}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">Model</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={model}
            onChange={e => setModel(e.target.value)}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">Year</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            type="number"
            min={1900}
            max={new Date().getFullYear() + 1}
            value={year}
            onChange={e => setYear(e.target.value)}
            required
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">{t('mileage')}</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            type="number"
            min={0}
            value={currentMileage}
            onChange={e => setCurrentMileage(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">{t('licensePlate')}</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={licensePlate}
            onChange={e => setLicensePlate(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">VIN</span>
          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={vin}
            onChange={e => setVin(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-muted-foreground">{t('fuel')}</span>
          <select
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={fuelType}
            onChange={e => setFuelType(e.target.value as FuelType | '')}
          >
            <option value="">—</option>
            {fuelTypes.map(ft => (
              <option key={ft} value={ft}>{t(`fuelTypes.${ft}` as const)}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border px-4 py-2 text-sm"
        >
          {common('cancel')}
        </button>
        <button
          type="submit"
          disabled={updateVehicle.isPending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 flex items-center gap-1"
        >
          <Check size={14} />
          {updateVehicle.isPending ? common('loading') : common('save')}
        </button>
      </div>
    </form>
  )
}

// ── Archive / Delete confirmation dialog ─────────────────────────────────────
type DangerAction = 'archive' | 'delete'

function DangerDialog({
  action,
  vehicleName,
  isPending,
  onConfirm,
  onClose,
}: {
  action: DangerAction
  vehicleName: string
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const [confirmText, setConfirmText] = useState('')
  const isDelete = action === 'delete'
  const canConfirm = isDelete ? confirmText === vehicleName : true

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-5 space-y-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {isDelete
              ? <Trash2 size={18} className="text-red-500 shrink-0" />
              : <ArchiveX size={18} className="text-amber-500 shrink-0" />}
            <h2 className="font-semibold">
              {isDelete ? 'Удалить автомобиль?' : 'Архивировать автомобиль?'}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {isDelete
            ? 'Все данные (топливо, ТО, расходы, штрафы) будут удалены безвозвратно.'
            : 'Автомобиль скроется из списка. Все данные сохранятся — вы сможете восстановить его позже.'}
        </p>

        {isDelete && (
          <label className="space-y-1 block">
            <span className="text-sm text-muted-foreground">
              Введите <span className="font-medium text-foreground">{vehicleName}</span> для подтверждения
            </span>
            <input
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={vehicleName}
            />
          </label>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isPending}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-40',
              isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
            )}
          >
            {isPending
              ? 'Подождите...'
              : isDelete ? 'Удалить навсегда' : 'Архивировать'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VehicleDetailPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const router = useRouter()
  const t = useTranslations('car')
  const common = useTranslations('common')
  const { vehicles, isLoading: vehicleLoading, archiveVehicle, deleteVehicle } = useVehicles()
  const { data: accounts = [] } = useAccounts()
  const vehicle = vehicles.find((v) => v.id === vehicleId)

  const [isEditing, setIsEditing] = useState(false)
  const [dangerAction, setDangerAction] = useState<DangerAction | null>(null)

  const [fuelAccountId, setFuelAccountId] = useState('')
  const [fuelLiters, setFuelLiters] = useState('')
  const [fuelPrice, setFuelPrice] = useState('')
  const [fuelMileage, setFuelMileage] = useState('')
  const [fuelNote, setFuelNote] = useState('')
  const [fuelFullTank, setFuelFullTank] = useState(true)

  const [expenseAccountId, setExpenseAccountId] = useState('')
  const [expenseCategory, setExpenseCategory] = useState<VehicleExpenseCategory>('service')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [expenseMileage, setExpenseMileage] = useState('')
  const [expenseNote, setExpenseNote] = useState('')

  const [serviceNameKey, setServiceNameKey] = useState<ServiceItemNameKey>('motor_oil')
  const [serviceLastDate, setServiceLastDate] = useState('')
  const [serviceLastMileage, setServiceLastMileage] = useState('')
  const [serviceEveryKm, setServiceEveryKm] = useState('')
  const [serviceEveryMonths, setServiceEveryMonths] = useState('')
  const [serviceNotes, setServiceNotes] = useState('')
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)

  const [fineAmount, setFineAmount] = useState('')
  const [fineDiscountAmount, setFineDiscountAmount] = useState('')
  const [fineDiscountUntil, setFineDiscountUntil] = useState('')
  const [fineIssuedDate, setFineIssuedDate] = useState(new Date().toISOString().split('T')[0])
  const [fineDescription, setFineDescription] = useState('')
  const [fineExternalId, setFineExternalId] = useState('')
  const [fineStatus, setFineStatus] = useState<FineStatus>('unpaid')
  const [editingFineId, setEditingFineId] = useState<string | null>(null)

  const { entries, fuelConsumption, isLoading: fuelLoading, addFuelEntry } = useFuelLog(vehicleId)
  const {
    items: serviceItems,
    isLoading: svcLoading,
    createServiceItem,
    updateServiceItem,
    deleteServiceItem,
  } = useServiceItems(vehicleId)
  const { expenses, totalByCategory, total, isLoading: expLoading, addExpense } = useVehicleExpenses(vehicleId)
  const {
    fines,
    isLoading: finesLoading,
    createFine,
    updateFine,
    deleteFine,
  } = useVehicleFines(vehicleId)

  const unpaidFinesTotal = useMemo(
    () => fines.filter((f) => f.status === 'unpaid').reduce((sum, f) => sum + Number(f.discount_amount_rub ?? f.amount_rub), 0),
    [fines]
  )

  const totalKm = vehicle
    ? Number(vehicle.current_mileage ?? 0) - Number(vehicle.initial_mileage ?? 0)
    : 0
  const costPerKm = total > 0 && totalKm > 0 ? (total / totalKm).toFixed(1) : null

  const isVehicleReady = !!vehicle
  const defaultMileage = String(vehicle?.current_mileage ?? '')

  function resetServiceForm() {
    setServiceNameKey('motor_oil')
    setServiceLastDate('')
    setServiceLastMileage('')
    setServiceEveryKm('')
    setServiceEveryMonths('')
    setServiceNotes('')
    setEditingServiceId(null)
  }

  function fillServiceForm(item: ServiceItem) {
    setEditingServiceId(item.id)
    setServiceNameKey(item.name_key)
    setServiceLastDate(item.last_replaced_date ?? '')
    setServiceLastMileage(item.last_replaced_mileage != null ? String(item.last_replaced_mileage) : '')
    setServiceEveryKm(item.replace_every_km != null ? String(item.replace_every_km) : '')
    setServiceEveryMonths(item.replace_every_months != null ? String(item.replace_every_months) : '')
    setServiceNotes(item.notes ?? '')
  }

  function resetFineForm() {
    setFineAmount('')
    setFineDiscountAmount('')
    setFineDiscountUntil('')
    setFineIssuedDate(new Date().toISOString().split('T')[0])
    setFineDescription('')
    setFineExternalId('')
    setFineStatus('unpaid')
    setEditingFineId(null)
  }

  function fillFineForm(fine: VehicleFine) {
    setEditingFineId(fine.id)
    setFineAmount(String(fine.amount_rub ?? ''))
    setFineDiscountAmount(fine.discount_amount_rub != null ? String(fine.discount_amount_rub) : '')
    setFineDiscountUntil(fine.discount_until ?? '')
    setFineIssuedDate(fine.issued_date ?? '')
    setFineDescription(fine.description ?? '')
    setFineExternalId(fine.external_id ?? '')
    setFineStatus(fine.status)
  }

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

  async function handleSaveServiceItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!vehicle) return
    const payload = {
      vehicle_id: vehicle.id,
      name_key: serviceNameKey,
      last_replaced_date: serviceLastDate || null,
      last_replaced_mileage: serviceLastMileage ? Number(serviceLastMileage) : null,
      replace_every_km: serviceEveryKm ? Number(serviceEveryKm) : null,
      replace_every_months: serviceEveryMonths ? Number(serviceEveryMonths) : null,
      notes: serviceNotes || null,
    }
    if (editingServiceId) {
      await updateServiceItem.mutateAsync({ id: editingServiceId, ...payload })
    } else {
      await createServiceItem.mutateAsync(payload)
    }
    resetServiceForm()
  }

  async function handleDeleteServiceItem(id: string) {
    await deleteServiceItem.mutateAsync(id)
    if (editingServiceId === id) resetServiceForm()
  }

  async function handleSaveFine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!vehicle?.user_id) return
    const payload = {
      vehicle_id: vehicle.id,
      user_id: vehicle.user_id,
      family_id: vehicle.family_id,
      amount_rub: Number(fineAmount),
      discount_amount_rub: fineDiscountAmount ? Number(fineDiscountAmount) : null,
      discount_until: fineDiscountUntil || null,
      issued_date: fineIssuedDate || null,
      description: fineDescription || null,
      external_id: fineExternalId || null,
      status: fineStatus,
    }
    if (editingFineId) {
      await updateFine.mutateAsync({ id: editingFineId, ...payload })
    } else {
      await createFine.mutateAsync(payload)
    }
    resetFineForm()
  }

  async function handleDeleteFine(id: string) {
    await deleteFine.mutateAsync(id)
    if (editingFineId === id) resetFineForm()
  }

  async function handleDangerConfirm() {
    if (!vehicle || !dangerAction) return
    if (dangerAction === 'archive') {
      await archiveVehicle.mutateAsync(vehicle.id)
    } else {
      await deleteVehicle.mutateAsync(vehicle.id)
    }
    router.push('/car')
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
      {dangerAction && (
        <DangerDialog
          action={dangerAction}
          vehicleName={vehicle.name}
          isPending={archiveVehicle.isPending || deleteVehicle.isPending}
          onConfirm={handleDangerConfirm}
          onClose={() => setDangerAction(null)}
        />
      )}

      <Link href="/car" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← {t('backToCars')}
      </Link>

      {/* Vehicle header */}
      {isEditing ? (
        <EditVehicleForm vehicle={vehicle} onClose={() => setIsEditing(false)} />
      ) : (
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
                {vehicle.fuel_type ? <span>• {t(`fuelTypes.${vehicle.fuel_type}` as const)}</span> : null}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                title={common('edit')}
                className="rounded-xl border p-2 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setDangerAction('archive')}
                title="Архивировать"
                className="rounded-xl border p-2 text-muted-foreground hover:text-amber-500 hover:border-amber-400 transition-colors"
              >
                <ArchiveX size={15} />
              </button>
              <button
                onClick={() => setDangerAction('delete')}
                title={common('delete')}
                className="rounded-xl border p-2 text-muted-foreground hover:text-red-500 hover:border-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Health Score ───────────────────────────────────────────── */}
      {!svcLoading && serviceItems.length > 0 && (
        <VehicleHealthScore vehicle={vehicle} serviceItems={serviceItems} />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('avgConsumption')}</p>
          <p className="font-bold tabular-nums">{fuelConsumption != null ? formatLper100(fuelConsumption) : '—'}</p>
        </div>
        <div className="rounded-2xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('costPerKm')}</p>
          <p className="font-bold tabular-nums">
            {costPerKm != null ? `${costPerKm} ₽` : '—'}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('totalExpenses')}</p>
          <p className="font-bold tabular-nums">{formatAmount(total)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('unpaidFines')}</p>
          <p className={cn('font-bold tabular-nums', unpaidFinesTotal > 0 && 'text-red-500')}>
            {formatAmount(unpaidFinesTotal)}
          </p>
        </div>
      </div>

      <Tabs defaultValue="fuel">
        <TabsList className="w-full">
          <TabsTrigger value="fuel" className="flex-1">{t('fuel')}</TabsTrigger>
          <TabsTrigger value="service" className="flex-1">{t('service')}</TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1">{t('expenses')}</TabsTrigger>
          <TabsTrigger value="fines" className="flex-1">{t('fines')}</TabsTrigger>
        </TabsList>

        {/* ── FUEL ── */}
        <TabsContent value="fuel" className="space-y-4 mt-4">
          <form onSubmit={handleAddFuel} className="rounded-2xl border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('addFuelEntry')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('account')}</span>
                <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={fuelAccountId} onChange={(e) => setFuelAccountId(e.target.value)} required>
                  <option value="">{t('selectAccount')}</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('mileage')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min={0} value={fuelMileage} onChange={(e) => setFuelMileage(e.target.value)} placeholder={defaultMileage} required />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('liters')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min="0" step="0.1" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} required />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('pricePerLiter')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min="0" step="0.01" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} required />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-sm text-muted-foreground">{common('note')}</span>
              <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={fuelNote} onChange={(e) => setFuelNote(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={fuelFullTank} onChange={(e) => setFuelFullTank(e.target.checked)} />
              <span>{t('fullTank')}</span>
            </label>
            <button type="submit" disabled={addFuelEntry.isPending || !isVehicleReady} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {addFuelEntry.isPending ? common('loading') : t('addFuelEntry')}
            </button>
          </form>

          {fuelLoading ? <Skeleton className="h-32 w-full" /> : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('noFuelEntries')}</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.id} className="rounded-xl border bg-card p-3 flex justify-between items-center gap-4">
                  <div>
                    <p className="text-sm font-medium">{e.liters} L · {Number(e.price_per_liter).toFixed(1)} ₽/L</p>
                    <p className="text-xs text-muted-foreground">
                      {formatKm(Number(e.mileage))}
                      {e.expense?.date ? ` • ${formatDate(e.expense.date)}` : ''}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-sm">{formatAmount(Number(e.liters) * Number(e.price_per_liter))}</p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* ── SERVICE ── */}
        <TabsContent value="service" className="space-y-4 mt-4">
          <form onSubmit={handleSaveServiceItem} className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {editingServiceId ? t('editServiceItem') : t('addServiceItem')}
              </h2>
              {editingServiceId ? (
                <button type="button" onClick={resetServiceForm} className="text-sm text-muted-foreground hover:text-foreground">
                  {common('cancel')}
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('category')}</span>
                <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={serviceNameKey} onChange={(e) => setServiceNameKey(e.target.value as ServiceItemNameKey)}>
                  {serviceItemKeys.map((key) => (
                    <option key={key} value={key}>{t(`serviceItems.${key}` as const)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('lastReplaced')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="date" value={serviceLastDate} onChange={(e) => setServiceLastDate(e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('mileage')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min={0} value={serviceLastMileage} onChange={(e) => setServiceLastMileage(e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('replaceEveryKm')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min={0} value={serviceEveryKm} onChange={(e) => setServiceEveryKm(e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('replaceEveryMonths')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min={0} value={serviceEveryMonths} onChange={(e) => setServiceEveryMonths(e.target.value)} />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-sm text-muted-foreground">{common('note')}</span>
              <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} />
            </label>
            <button type="submit" disabled={createServiceItem.isPending || updateServiceItem.isPending} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {editingServiceId ? common('save') : t('addServiceItem')}
            </button>
          </form>

          {svcLoading ? <Skeleton className="h-32 w-full" /> : serviceItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('noServiceItems')}</p>
          ) : (
            <ul className="space-y-2">
              {serviceItems.map((item) => {
                const isDueByDate = item.next_due_date ? new Date(item.next_due_date) <= new Date() : false
                const isDueByMileage = item.replace_every_km && item.last_replaced_mileage != null
                  ? Number(vehicle.current_mileage ?? 0) >= item.last_replaced_mileage + item.replace_every_km
                  : false
                const isDue = Boolean(isDueByDate || isDueByMileage)
                const nextMileage = item.replace_every_km && item.last_replaced_mileage != null
                  ? item.last_replaced_mileage + item.replace_every_km
                  : null

                const kmProgress = (() => {
                  if (!item.replace_every_km || item.last_replaced_mileage == null) return null
                  const driven = Number(vehicle.current_mileage ?? 0) - item.last_replaced_mileage
                  const pct = Math.min(100, Math.round((driven / item.replace_every_km) * 100))
                  return { pct, driven, total: item.replace_every_km }
                })()

                return (
                  <li key={item.id} className={cn('rounded-xl border bg-card p-3', isDue && 'border-red-300 dark:border-red-700')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{serviceItemIcons[item.name_key]} {t(`serviceItems.${item.name_key}` as const)}</p>
                        <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                          <p>{item.last_replaced_date ? `${t('lastReplaced')}: ${formatDate(item.last_replaced_date)}` : t('neverReplaced')}</p>
                          {item.next_due_date ? <p>{t('nextDue')}: {formatDate(item.next_due_date)}</p> : null}
                          {nextMileage ? <p>{t('nextDueMileage')}: {formatKm(nextMileage)}</p> : null}
                          {item.notes ? <p>{item.notes}</p> : null}
                        </div>
                        {kmProgress ? (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>{formatKm(kmProgress.driven)} / {formatKm(kmProgress.total)}</span>
                              <span>{kmProgress.pct}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  kmProgress.pct >= 100 ? 'bg-red-500' :
                                  kmProgress.pct >= 80 ? 'bg-amber-400' : 'bg-green-500'
                                )}
                                style={{ width: `${kmProgress.pct}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isDue ? <span className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">{t('due')}</span> : null}
                        <div className="flex gap-2">
                          <button type="button" onClick={() => fillServiceForm(item)} className="rounded-lg border px-3 py-1 text-xs">{common('edit')}</button>
                          <button type="button" onClick={() => handleDeleteServiceItem(item.id)} className="rounded-lg border px-3 py-1 text-xs text-red-600">{common('delete')}</button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </TabsContent>

        {/* ── EXPENSES ── */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <form onSubmit={handleAddExpense} className="rounded-2xl border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('addExpense')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('account')}</span>
                <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={expenseAccountId} onChange={(e) => setExpenseAccountId(e.target.value)} required>
                  <option value="">{t('selectAccount')}</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('category')}</span>
                <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value as VehicleExpenseCategory)} required>
                  {expenseCategories.map((category) => (
                    <option key={category} value={category}>{t(`expenseCategories.${category}` as const)}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('amount')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min="0" step="0.01" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} required />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('date')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('mileageOptional')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min={0} value={expenseMileage} onChange={(e) => setExpenseMileage(e.target.value)} placeholder={defaultMileage} />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-sm text-muted-foreground">{common('note')}</span>
              <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} />
            </label>
            <button type="submit" disabled={addExpense.isPending || !isVehicleReady} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {addExpense.isPending ? common('loading') : t('addExpense')}
            </button>
          </form>

          {expLoading ? <Skeleton className="h-32 w-full" /> : (
            <>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {Object.entries(totalByCategory).map(([cat, sum]) => {
                  if (!isExpenseCategory(cat)) return null
                  return (
                    <div key={cat} className="rounded-xl border bg-card p-3">
                      <p className="text-xs text-muted-foreground capitalize">{t(`expenseCategories.${cat}` as const)}</p>
                      <p className="font-bold tabular-nums">{formatAmount(sum)}</p>
                    </div>
                  )
                })}
              </div>
              {expenses.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">{t('noExpenses')}</p> : (
                <ul className="space-y-2">
                  {expenses.slice(0, 20).map((e) => (
                    <li key={e.id} className="rounded-xl border bg-card p-3 flex justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium capitalize">{t(`expenseCategories.${e.category}` as const)}</p>
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

        {/* ── FINES ── */}
        <TabsContent value="fines" className="space-y-4 mt-4">
          <form onSubmit={handleSaveFine} className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {editingFineId ? t('editFine') : t('addFine')}
              </h2>
              {editingFineId ? (
                <button type="button" onClick={resetFineForm} className="text-sm text-muted-foreground hover:text-foreground">
                  {common('cancel')}
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{common('amount')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min="0" step="0.01" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} required />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('discountedAmount')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="number" min="0" step="0.01" value={fineDiscountAmount} onChange={(e) => setFineDiscountAmount(e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('issuedDate')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="date" value={fineIssuedDate} onChange={(e) => setFineIssuedDate(e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('discountUntil')}</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" type="date" value={fineDiscountUntil} onChange={(e) => setFineDiscountUntil(e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">ID</span>
                <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={fineExternalId} onChange={(e) => setFineExternalId(e.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('status')}</span>
                <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={fineStatus} onChange={(e) => setFineStatus(e.target.value as FineStatus)}>
                  {fineStatuses.map((status) => (
                    <option key={status} value={status}>{t(`fineStatuses.${status}` as const)}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-sm text-muted-foreground">{common('note')}</span>
              <input className="w-full rounded-xl border bg-background px-3 py-2 text-sm" value={fineDescription} onChange={(e) => setFineDescription(e.target.value)} />
            </label>
            <button type="submit" disabled={createFine.isPending || updateFine.isPending} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {editingFineId ? common('save') : t('addFine')}
            </button>
          </form>

          {finesLoading ? <Skeleton className="h-32 w-full" /> : fines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('noFines')}</p>
          ) : (
            <ul className="space-y-2">
              {fines.map((fine) => {
                const discountedAmount = Number(fine.discount_amount_rub ?? fine.amount_rub)
                const hasDiscount = fine.discount_amount_rub != null && Number(fine.discount_amount_rub) < Number(fine.amount_rub)
                const discountDaysLeft = fine.discount_until && fine.status === 'unpaid'
                  ? Math.ceil((new Date(fine.discount_until).getTime() - Date.now()) / 86_400_000)
                  : null

                return (
                  <li key={fine.id} className="rounded-xl border bg-card p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{fine.description || t('fine')}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fine.issued_date ? `${t('issuedDate')}: ${formatDate(fine.issued_date)}` : t('issuedDateUnknown')}
                          {fine.external_id ? ` • ID: ${fine.external_id}` : ''}
                        </p>
                        {discountDaysLeft != null && discountDaysLeft >= 0 ? (
                          <p className={cn('text-xs mt-1 font-medium', discountDaysLeft <= 3 ? 'text-red-500' : 'text-amber-500')}>
                            ⏰ Скидка истекает через {discountDaysLeft === 0 ? 'сегодня' : `${discountDaysLeft} дн.`}
                          </p>
                        ) : discountDaysLeft != null && discountDaysLeft < 0 ? (
                          <p className="text-xs mt-1 text-muted-foreground">Скидка истекла</p>
                        ) : null}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold tabular-nums">{formatAmount(discountedAmount)}</p>
                        {hasDiscount ? <p className="text-xs text-muted-foreground line-through">{formatAmount(Number(fine.amount_rub))}</p> : null}
                        <span className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold mt-1',
                          fine.status === 'paid' && 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
                          fine.status === 'disputed' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
                          fine.status === 'unpaid' && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        )}>
                          {t(`fineStatuses.${fine.status}` as const)}
                        </span>
                        <div className="mt-2 flex justify-end gap-2">
                          <button type="button" onClick={() => fillFineForm(fine)} className="rounded-lg border px-3 py-1 text-xs">{common('edit')}</button>
                          <button type="button" onClick={() => handleDeleteFine(fine.id)} className="rounded-lg border px-3 py-1 text-xs text-red-600">{common('delete')}</button>
                        </div>
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
