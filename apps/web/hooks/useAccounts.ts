import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export interface Account {
  id: string
  owner_user_id: string
  family_id: string | null
  name: string
  type: 'cash' | 'card' | 'savings' | 'investment' | 'credit'
  balance: number
  currency: string
  color: string | null
  icon: string | null
  is_archived: boolean
  created_at: string
}

export interface CreateAccountInput {
  name: string
  type: Account['type']
  balance?: number
  currency?: string
  color?: string
  icon?: string
}

async function fetchAccounts(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_user_id', userId)
    .eq('is_archived', false)
    .order('created_at')
  if (error) throw error
  return data as Account[]
}

export function useAccounts() {
  const userId = useUIStore(s => s.userId)

  const query = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => fetchAccounts(userId!),
    enabled: !!userId,
  })

  const accounts = query.data ?? []
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  return { ...query, accounts, totalBalance }
}

export function useCreateAccount() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)

  return useMutation({
    mutationFn: async (input: CreateAccountInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...input, owner_user_id: userId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts', userId] }),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)

  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Account> & { id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('accounts')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts', userId] }),
  })
}

export function useArchiveAccount() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('accounts')
        .update({ is_archived: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts', userId] }),
  })
}
