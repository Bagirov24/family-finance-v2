import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { calcFuelConsumption } from '@/lib/fuelCalc'

export type FuelType = 'gasoline' | 'diesel' | 'gas' | 'electric' | 'hybrid'

export type VehicleExpenseCategory =
  | 'fuel'
  | 'service'
  | 'insurance'
  | 'documents'
  | 'parking'
  | 'wash'
  | 'tires'
  | 'fine'
  | 'equipment'
  | 'other'

export type Vehicle = {
  id: string
  user_id: string | null
  family_id: string | null
  name: string
  make: string
  model: string
  year: number
  vin: string | null
  license_plate: string | null
  photo_url: string | null
  purchase_date: string | null
  initial_mileage: number
  current_mileage: number
  fuel_type: FuelType | null
  is_active: boolean | null
  created_at: string | null
}

export type FuelEntry = {
  id: string
  expense_id: string | null
  vehicle_id: string | null
  liters: number | string
  price_per_liter: number | string
  full_tank: boolean
  mileage: number
  fuel_consumption_calculated: number | string | null
  created_at: string | null
  expense?: {
    date: string
    amount_rub: number | string
    note: string | null
  } | null
}

export type ServiceItemNameKey =
  | 'motor_oil'
  | 'air_filter'
  | 'brake_pads'
  | 'timing_belt'
  | 'coolant'
  | 'osago'
  | 'tech_inspection'

export type ServiceItem = {
  id: string
  vehicle_id: string | null
  name_key: ServiceItemNameKey
  last_replaced_date: string | null
  last_replaced_mileage: number | null
  replace_every_km: number | null
  replace_every_months: number | null
  next_due_date: string | null
  notes: string | null
  created_at: string | null
}

export type VehicleExpense = {
  id: string
  vehicle_id: string | null
  user_id: string | null
  transaction_id: string | null
  category: VehicleExpenseCategory
  amount_rub: number | string
  date: string
  mileage_at_moment: number | null
  note: string | null
  photo_url: string | null
  created_at: string | null
}

export type FineStatus = 'unpaid' | 'paid' | 'disputed'

export type VehicleFine = {
  id: string
  vehicle_id: string | null
  user_id: string | null
  external_id: string | null
  amount_rub: number | string
  discount_amount_rub: number | string | null
  discount_until: string | null
  issued_date: string | null
  description: string | null
  status: FineStatus
  paid_at: string | null
  transaction_id: string | null
  created_at: string | null
}

export type VehicleUpdateInput = {
  id: string
  name?: string
  make?: string
  model?: string
  year?: number
  fuel_type?: FuelType | null
  license_plate?: string | null
  vin?: string | null
  current_mileage?: number
}

type ServiceItemInput = {
  vehicle_id: string
  name_key: ServiceItemNameKey
  last_replaced_date?: string | null
  last_replaced_mileage?: number | null
  replace_every_km?: number | null
  replace_every_months?: number | null
  notes?: string | null
}

type FineInput = {
  vehicle_id: string
  user_id: string
  family_id?: string | null
  account_id?: string | null
  external_id?: string | null
  amount_rub: number
  discount_amount_rub?: number | null
  discount_until?: string | null
  issued_date?: string | null
  description?: string | null
  status?: FineStatus
}

function calcNextDueDate(lastReplacedDate?: string | null, replaceEveryMonths?: number | null) {
  if (!lastReplacedDate || !replaceEveryMonths) return null
  const d = new Date(lastReplacedDate)
  d.setMonth(d.getMonth() + replaceEveryMonths)
  return d.toISOString().split('T')[0]
}

export function useVehicles() {
  const queryClient = useQueryClient()
  const userId = useUIStore(s => s.userId)

  const query = useQuery<Vehicle[]>({
    queryKey: ['vehicles', userId],
    enabled: !!userId,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId!)
        .eq('is_active', true)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as Vehicle[]
    }
  })

  const createVehicle = useMutation({
    mutationFn: async (payload: {
      family_id: string | null
      name: string
      make: string
      model: string
      year: number
      fuel_type?: FuelType
      initial_mileage?: number
      vin?: string
      license_plate?: string
    }) => {
      const supabase = createClient()
      const initialMileage = payload.initial_mileage ?? 0
      const { error } = await supabase.from('vehicles').insert({
        user_id: userId,
        family_id: payload.family_id,
        name: payload.name,
        make: payload.make,
        model: payload.model,
        year: payload.year,
        fuel_type: payload.fuel_type,
        vin: payload.vin,
        license_plate: payload.license_plate,
        initial_mileage: initialMileage,
        current_mileage: initialMileage,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', userId] })
  })

  // Update vehicle fields (name, make, model, year, fuel_type, license_plate, vin, mileage)
  const updateVehicle = useMutation({
    mutationFn: async ({ id, ...patch }: VehicleUpdateInput) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicles')
        .update(patch)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', userId] })
  })

  // Soft-delete: set is_active = false, vehicle stays in DB for history
  const archiveVehicle = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', userId] })
  })

  // Hard-delete: remove vehicle and all related data (cascades in DB)
  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', userId] })
  })

  const updateMileage = useMutation({
    mutationFn: async ({ id, mileage }: { id: string; mileage: number }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicles')
        .update({ current_mileage: mileage })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', userId] })
  })

  return {
    vehicles: query.data ?? [],
    isLoading: query.isLoading,
    createVehicle,
    updateVehicle,
    archiveVehicle,
    deleteVehicle,
    updateMileage
  }
}

export function useFuelLog(vehicleId: string) {
  const queryClient = useQueryClient()
  const userId = useUIStore(s => s.userId)

  const query = useQuery<FuelEntry[]>({
    queryKey: ['fuel-log', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*, expense:vehicle_expenses(date, amount_rub, note)')
        .eq('vehicle_id', vehicleId)
        .order('mileage', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as FuelEntry[]
    }
  })

  const entries = query.data ?? []
  const fuelConsumption = calcFuelConsumption(
    entries.map(e => ({
      mileage: e.mileage,
      liters: Number(e.liters),
      full_tank: e.full_tank,
      date: e.expense?.date ?? ''
    }))
  )

  const addFuelEntry = useMutation({
    mutationFn: async (payload: {
      vehicle_id: string
      user_id: string
      family_id: string
      account_id: string
      liters: number
      price_per_liter: number
      mileage: number
      full_tank: boolean
      note?: string
    }) => {
      const supabase = createClient()
      const amount = payload.liters * payload.price_per_liter

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          family_id: payload.family_id,
          account_id: payload.account_id,
          user_id: payload.user_id,
          type: 'expense',
          amount,
          note: payload.note ?? `Топливо ${payload.liters}л`,
          date: new Date().toISOString().split('T')[0],
          source: 'vehicle',
          vehicle_id: payload.vehicle_id,
        })
        .select('id')
        .single()
      if (txError || !transaction) throw txError ?? new Error('Failed to create transaction')

      const { data: expense, error: expError } = await supabase
        .from('vehicle_expenses')
        .insert({
          vehicle_id: payload.vehicle_id,
          user_id: payload.user_id,
          transaction_id: transaction.id,
          category: 'fuel',
          amount_rub: amount,
          date: new Date().toISOString().split('T')[0],
          mileage_at_moment: payload.mileage,
          note: payload.note,
        })
        .select('id')
        .single()
      if (expError || !expense) throw expError ?? new Error('Failed to create vehicle expense')

      const { error: fuelError } = await supabase.from('fuel_entries').insert({
        expense_id: expense.id,
        vehicle_id: payload.vehicle_id,
        liters: payload.liters,
        price_per_liter: payload.price_per_liter,
        full_tank: payload.full_tank,
        mileage: payload.mileage,
      })
      if (fuelError) throw fuelError

      await supabase
        .from('vehicles')
        .update({ current_mileage: payload.mileage })
        .eq('id', payload.vehicle_id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-log', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['vehicles', userId] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-expenses', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  return { entries, fuelConsumption, isLoading: query.isLoading, addFuelEntry }
}

export function useServiceItems(vehicleId: string) {
  const queryClient = useQueryClient()

  const query = useQuery<ServiceItem[]>({
    queryKey: ['service-items', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at')
      if (error) throw error
      return (data ?? []) as ServiceItem[]
    }
  })

  const createServiceItem = useMutation({
    mutationFn: async (payload: ServiceItemInput) => {
      const supabase = createClient()
      const next_due_date = calcNextDueDate(payload.last_replaced_date, payload.replace_every_months)
      const { error } = await supabase.from('service_items').insert({
        ...payload,
        next_due_date,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-items', vehicleId] })
  })

  const updateServiceItem = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ServiceItemInput> & { id: string }) => {
      const supabase = createClient()
      const current = query.data?.find((i) => i.id === id)
      if (!current) throw new Error('Service item not found')
      const last_replaced_date = patch.last_replaced_date ?? current.last_replaced_date
      const replace_every_months = patch.replace_every_months ?? current.replace_every_months
      const next_due_date = calcNextDueDate(last_replaced_date, replace_every_months)

      const { error } = await supabase
        .from('service_items')
        .update({ ...patch, next_due_date })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-items', vehicleId] })
  })

  const deleteServiceItem = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('service_items')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-items', vehicleId] })
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    createServiceItem,
    updateServiceItem,
    deleteServiceItem,
  }
}

export function useVehicleExpenses(vehicleId: string) {
  const queryClient = useQueryClient()

  const query = useQuery<VehicleExpense[]>({
    queryKey: ['vehicle-expenses', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicle_expenses')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as VehicleExpense[]
    }
  })

  const totalByCategory = (query.data ?? []).reduce<Record<VehicleExpenseCategory, number>>(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount_rub)
      return acc
    },
    {} as Record<VehicleExpenseCategory, number>
  )

  const total = Object.values(totalByCategory).reduce((s, v) => s + v, 0)

  const addExpense = useMutation({
    mutationFn: async (payload: {
      vehicle_id: string
      user_id: string
      family_id: string
      account_id: string
      category: VehicleExpenseCategory
      amount_rub: number
      date: string
      note?: string
      mileage_at_moment?: number
    }) => {
      const supabase = createClient()
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          family_id: payload.family_id,
          account_id: payload.account_id,
          user_id: payload.user_id,
          type: 'expense',
          amount: payload.amount_rub,
          note: payload.note ?? payload.category,
          date: payload.date,
          source: 'vehicle',
          vehicle_id: payload.vehicle_id,
        })
        .select('id')
        .single()
      if (txError || !transaction) throw txError ?? new Error('Failed to create transaction')

      const { error: expError } = await supabase
        .from('vehicle_expenses')
        .insert({
          vehicle_id: payload.vehicle_id,
          user_id: payload.user_id,
          transaction_id: transaction.id,
          category: payload.category,
          amount_rub: payload.amount_rub,
          date: payload.date,
          note: payload.note,
          mileage_at_moment: payload.mileage_at_moment,
        })
      if (expError) throw expError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-expenses', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  return {
    expenses: query.data ?? [],
    totalByCategory,
    total,
    isLoading: query.isLoading,
    addExpense,
  }
}

export function useVehicleFines(vehicleId: string) {
  const queryClient = useQueryClient()

  const query = useQuery<VehicleFine[]>({
    queryKey: ['vehicle-fines', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('vehicle_fines')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('issued_date', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []) as VehicleFine[]
    }
  })

  const createFine = useMutation({
    mutationFn: async (payload: FineInput) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicle_fines')
        .insert({
          vehicle_id: payload.vehicle_id,
          user_id: payload.user_id,
          external_id: payload.external_id,
          amount_rub: payload.amount_rub,
          discount_amount_rub: payload.discount_amount_rub,
          discount_until: payload.discount_until,
          issued_date: payload.issued_date,
          description: payload.description,
          status: payload.status ?? 'unpaid',
        })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicle-fines', vehicleId] })
  })

  const updateFine = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<FineInput> & { id: string }) => {
      const supabase = createClient()
      const data: Record<string, unknown> = { ...patch }
      if (patch.status === 'paid') {
        data.paid_at = new Date().toISOString()
      }
      if (patch.status && patch.status !== 'paid') {
        data.paid_at = null
      }

      const { error } = await supabase
        .from('vehicle_fines')
        .update(data)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicle-fines', vehicleId] })
  })

  const deleteFine = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('vehicle_fines')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicle-fines', vehicleId] })
  })

  return {
    fines: query.data ?? [],
    isLoading: query.isLoading,
    createFine,
    updateFine,
    deleteFine,
  }
}
