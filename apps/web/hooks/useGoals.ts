import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useGoals() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const goalsWithProgress = (query.data ?? []).map(g => {
    const percent = Math.min(100, Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100))
    const remaining = Number(g.target_amount) - Number(g.current_amount)
    const completed = percent >= 100

    // Forecast: how many months left at current monthly auto-save
    const monthsLeft = g.auto_save_amount && Number(g.auto_save_amount) > 0 && remaining > 0
      ? Math.ceil(remaining / Number(g.auto_save_amount))
      : null

    return { ...g, percent, remaining, completed, monthsLeft }
  })

  const createGoal = useMutation({
    mutationFn: async (payload: {
      family_id: string; name: string; target_amount: number;
      deadline?: string; icon?: string; color?: string;
      auto_save_amount?: number; auto_save_account_id?: string
    }) => {
      const { error } = await supabase.from('goals').insert(payload)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  })

  const contribute = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const goal = query.data?.find(g => g.id === id)
      if (!goal) throw new Error('Goal not found')
      const newAmount = Math.min(Number(goal.target_amount), Number(goal.current_amount) + amount)
      const { error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount, completed_at: newAmount >= Number(goal.target_amount) ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  })

  return {
    goals: goalsWithProgress,
    isLoading: query.isLoading,
    createGoal,
    contribute
  }
}
