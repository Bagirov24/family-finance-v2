import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'

// M-2: explicit union instead of string | null for type safety
export type AutoSaveType = 'percentage' | 'fixed' | 'monthly_fixed'

export interface Goal {
  id: string
  family_id: string | null
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string | null
  color: string | null
  auto_save_type: AutoSaveType | null
  auto_save_value: number | null
  is_completed: boolean
  created_at: string
}

// L-5: GoalView uses number for already-normalised numeric fields
export interface GoalView extends Omit<Goal, 'target_amount' | 'current_amount'> {
  target_amount: number
  current_amount: number
  percent: number
  remaining: number
  completed: boolean
  monthsLeft: number | null
}

// H-9: separate input type — excludes readonly/server-generated fields from UPDATE payload
export interface CreateGoalInput {
  name: string
  target_amount: number
  current_amount?: number
  deadline?: string | null
  icon?: string | null
  color?: string | null
  auto_save_type?: AutoSaveType | null
  auto_save_value?: number | null
}

export interface UpdateGoalInput {
  id: string
  name?: string
  target_amount?: number
  current_amount?: number
  deadline?: string | null
  icon?: string | null
  color?: string | null
  auto_save_type?: AutoSaveType | null
  auto_save_value?: number | null
  is_completed?: boolean
}

// L-5: named return-type interface for useGoals().
// Callers can import this to type props/context without re-deriving
// the shape via ReturnType<typeof useGoals>.
export interface UseGoalsResult extends UseQueryResult<GoalView[]> {
  goals: GoalView[]
}

async function fetchGoals(familyId: string): Promise<GoalView[]> {
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

    return {
      ...goal,
      target_amount: target,
      current_amount: current,
      percent,
      remaining,
      completed,
      monthsLeft,
    }
  })
}

export function useGoals(): UseGoalsResult {
  const { family } = useFamily()

  const query = useQuery({
    queryKey: ['goals', family?.id],
    // C-6: replaced family!.id non-null assertion with an explicit type guard.
    // `enabled: !!family?.id` prevents execution, but TypeScript does not know
    // that invariant — the guard makes it explicit and eliminates the unsafe cast.
    queryFn: () => {
      if (!family?.id) throw new Error('[useGoals] family.id is required but was nullish')
      return fetchGoals(family.id)
    },
    enabled: !!family?.id,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  })

  return { ...query, goals: query.data ?? [] }
}

// L-5: UseMutationResult generics: <TData, TError, TVariables, TContext>
export function useCreateGoal(): UseMutationResult<Goal, Error, CreateGoalInput> {
  const qc = useQueryClient()
  const { family } = useFamily()

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('goals')
        .insert({
          family_id: family?.id ?? null,
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
      return data as Goal
    },
    // H-4: scoped invalidation — only invalidate goals for this family
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', family?.id] }),
  })
}

export function useUpdateGoal(): UseMutationResult<Goal, Error, UpdateGoalInput> {
  const qc = useQueryClient()
  const { family } = useFamily()

  return useMutation({
    // H-9: UpdateGoalInput instead of Partial<Goal> — readonly fields are excluded
    mutationFn: async ({ id, ...patch }: UpdateGoalInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('goals')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Goal
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', family?.id] }),
  })
}

export function useDeleteGoal(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient()
  const { family } = useFamily()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', family?.id] }),
  })
}

/**
 * Atomic goal contribution via Postgres RPC.
 * Prevents race conditions when multiple family members contribute simultaneously.
 */
export function useContributeGoal(): UseMutationResult<number, Error, { id: string; amount: number }> {
  const qc = useQueryClient()
  const { family } = useFamily()

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const supabase = createClient()
      // M-8: added generic type for rpc return value
      const { data, error } = await supabase
        .rpc<number, { p_goal_id: string; p_amount: number }>(
          'contribute_to_goal',
          { p_goal_id: id, p_amount: amount }
        )
      if (error) throw error
      return data as number
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', family?.id] }),
  })
}
