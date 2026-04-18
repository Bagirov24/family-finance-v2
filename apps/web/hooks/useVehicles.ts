import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { calcFuelConsumption } from '@/lib/fuelCalc'

const supabase = createClient()

export function useVehicles() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('created_at')
      if (error) throw error
      return data
    }
  })

  const createVehicle = useMutation({
    mutationFn: async (payload: {
      user_id: string; family_id: string; name: string;
      make: string; model: string; year: number;
      fuel_type?: string; initial_mileage?: number
      vin?: string; license_plate?: string
    }) => {
      const { error } = await supabase.from('vehicles').insert({
        ...payload,
        current_mileage: payload.initial_mileage ?? 0
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] })
  })

  const updateMileage = useMutation({
    mutationFn: async ({ id, mileage }: { id: string; mileage: number }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ current_mileage: mileage })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] })
  })

  return {
    vehicles: query.data ?? [],
    isLoading: query.isLoading,
    createVehicle,
    updateMileage
  }
}

export function useFuelLog(vehicleId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['fuel-log', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_entries')
        .select('*, expense:vehicle_expenses(date, amount_rub, note)')
        .eq('vehicle_id', vehicleId)
        .order('mileage', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
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
      vehicle_id: string; user_id: string; family_id: string;
      account_id: string; liters: number; price_per_liter: number;
      mileage: number; full_tank: boolean; note?: string
    }) => {
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
          vehicle_id: payload.vehicle_id
        })
        .select('id')
        .single()
      if (txError || !transaction) throw txError

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
          note: payload.note
        })
        .select('id')
        .single()
      if (expError || !expense) throw expError

      const { error: fuelError } = await supabase.from('fuel_entries').insert({
        expense_id: expense.id,
        vehicle_id: payload.vehicle_id,
        liters: payload.liters,
        price_per_liter: payload.price_per_liter,
        full_tank: payload.full_tank,
        mileage: payload.mileage
      })
      if (fuelError) throw fuelError

      await supabase
        .from('vehicles')
        .update({ current_mileage: payload.mileage })
        .eq('id', payload.vehicle_id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-log', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle-expenses', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  return { entries, fuelConsumption, isLoading: query.isLoading, addFuelEntry }
}

export function useServiceItems(vehicleId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['service-items', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_items')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at')
      if (error) throw error
      return data
    }
  })

  const updateServiceItem = useMutation({
    mutationFn: async ({ id, last_replaced_date, last_replaced_mileage }: {
      id: string; last_replaced_date: string; last_replaced_mileage: number
    }) => {
      const item = query.data?.find(i => i.id === id)
      if (!item) throw new Error('Not found')
      let next_due_date: string | null = null
      if (item.replace_every_months && last_replaced_date) {
        const d = new Date(last_replaced_date)
        d.setMonth(d.getMonth() + item.replace_every_months)
        next_due_date = d.toISOString().split('T')[0]
      }
      const { error } = await supabase
        .from('service_items')
        .update({ last_replaced_date, last_replaced_mileage, next_due_date })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-items', vehicleId] })
  })

  return { items: query.data ?? [], isLoading: query.isLoading, updateServiceItem }
}

export function useVehicleExpenses(vehicleId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['vehicle-expenses', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_expenses')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('date', { ascending: false })
        .limit(100)
      if (error) throw error
      return data
    }
  })

  const totalByCategory = (query.data ?? []).reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount_rub)
    return acc
  }, {})

  const total = Object.values(totalByCategory).reduce((s, v) => s + v, 0)

  const addExpense = useMutation({
    mutationFn: async (payload: {
      vehicle_id: string; user_id: string; family_id: string;
      account_id: string; category: string;
      amount_rub: number; date: string; note?: string; mileage_at_moment?: number
    }) => {
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
          vehicle_id: payload.vehicle_id
        })
        .select('id')
        .single()
      if (txError || !transaction) throw txError

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
          mileage_at_moment: payload.mileage_at_moment
        })
      if (expError) throw expError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-expenses', vehicleId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  return { expenses: query.data ?? [], totalByCategory, total, isLoading: query.isLoading, addExpense }
}

export function useVehicleFines(vehicleId: string) {
  const query = useQuery({
    queryKey: ['vehicle-fines', vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_fines')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('issued_date', { ascending: false })
        .limit(100)
      if (error) throw error
      return data
    }
  })

  return {
    fines: query.data ?? [],
    isLoading: query.isLoading,
  }
}
