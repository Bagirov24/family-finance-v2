import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export interface Goal {
  id: string
  user_id: string
  name: string
  emoji: string
  target_amount: number
  current_amount: number
  deadline: string | null
  is_completed: boolean
  created_at: string
}

async function fetchGoals(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Goal[]
}

export function useGoals() {
  const userId = useUIStore(s => s.userId)
  return useQuery({
    queryKey: ['goals', userId],
    queryFn: () => fetchGoals(userId!),
    enabled: !!userId,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)

  return useMutation({
    mutationFn: async (input: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'is_completed'>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...input, user_id: userId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  })
}

export function useContributeGoal() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const supabase = createClient()
      const { data: goal, error: gErr } = await supabase
        .from('goals')
        .select('current_amount, target_amount')
        .eq('id', id)
        .single()
      if (gErr) throw gErr

      const newAmount = goal.current_amount + amount
      const isCompleted = newAmount >= goal.target_amount

      const { data, error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount, is_completed: isCompleted })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', userId] }),
  })
}
