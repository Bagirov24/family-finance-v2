import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useAccounts() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_archived', false)
        .order('created_at')
      if (error) throw error
      return data
    }
  })

  const totalBalance = (query.data ?? []).reduce((sum, a) => sum + Number(a.balance), 0)

  const createAccount = useMutation({
    mutationFn: async (payload: {
      name: string; type: string; balance: number;
      currency?: string; color?: string; icon?: string
      family_id: string; owner_user_id: string
    }) => {
      const { error } = await supabase.from('accounts').insert(payload)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] })
  })

  const updateBalance = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const account = query.data?.find(a => a.id === id)
      if (!account) throw new Error('Account not found')
      const { error } = await supabase
        .from('accounts')
        .update({ balance: Number(account.balance) + delta })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] })
  })

  return {
    accounts: query.data ?? [],
    totalBalance,
    isLoading: query.isLoading,
    createAccount,
    updateBalance
  }
}
