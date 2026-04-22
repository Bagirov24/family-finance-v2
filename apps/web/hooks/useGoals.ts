import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'

export interface Goal {
  id: string
  family_id: string | null
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string | null
  color: string | null
  auto_save_type: string | null
  auto_save_value: number | null
  is_completed: boolean
  created_at: string
}

export interface GoalView extends Goal {
  percent: number
  remaining: number
  completed: boolean
  monthsLeft: number | null
}

async function fetchGoals(familyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const now = new Date()
  return (data as Goal[]).map(goal => {
    const target = Number(goal.target_amount)
    const current = Number(goal.current_amount)
    const remaining = Math.max(0, target - current)
    const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
    const completed = goal.is_completed || current >= target

    let monthsLeft: number | null = null
    if (goal.deadline && !completed) {
      const deadline = new Date(goal.deadline)
      const diffMonths =
        (deadline.getFullYear() - now.getFullYear()) * 12 +
        (deadline.getMonth() - now.getMonth())
      monthsLeft = Math.max(0, diffMonths)
    }

    return { ...goal, target_amount: target, current_amount: current, percent, remaining, completed, monthsLeft }
  })
}

export function useGoals() {
  const { family } = useFamily()

  const query = useQuery({
    queryKey: ['goals', family?.id],
    queryFn: () => fetchGoals(family!.id),
    enabled: !!family?.id,
    staleTime: 5 * 60_000,   // цели меняются редко
    gcTime: 15 * 60_000,
  })

  return { ...query, goals: query.data ?? [] }
}

export function useCreateGoal() {
  const qc = useQueryClient()
  const { family } = useFamily()

  return useMutation({
    mutationFn: async (input: {
      name: string
      target_amount: number
      current_amount?: number
      deadline?: string | null
      icon?: string | null
      color?: string | null
      auto_save_type?: string | null
      auto_save_value?: number | null
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('goals')
        .insert({
          family_id: family?.id,
          name: input.name,
          target_amount: input.target_amount,
          current_amount: input.current_amount ?? 0,
          deadline: input.deadline ?? null,
          icon: input.icon ?? '🎯',
          color: input.color ?? null,
          auto_save_type: input.auto_save_type ?? null,
          auto_save_value: input.auto_save_value ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Goal> & { id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('goals')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

/**
 * Atomic goal contribution via Postgres RPC.
 * Prevents race conditions when multiple family members contribute simultaneously.
 */
export function useContributeGoal() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .rpc('contribute_to_goal', { p_goal_id: id, p_amount: amount })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}
