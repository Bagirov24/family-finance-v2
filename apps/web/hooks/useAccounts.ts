import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { useFamily } from '@/hooks/useFamily'

export interface Account {
  id: string
  owner_user_id: string | null
  family_id: string | null
  name: string
  type: 'cash' | 'card' | 'savings' | 'investment' | 'credit'
  balance: number
  currency: string
  color: string | null
  icon: string | null
  is_archived: boolean
  is_hidden_from_total: boolean
  created_at: string
}

export interface CreateAccountInput {
  name: string
  type: Account['type']
  balance?: number
  currency?: string
  color?: string
  icon?: string
  is_hidden_from_total?: boolean
}

// H-8: dedicated update type that excludes readonly / server-generated fields.
// Using Partial<Account> would allow owner_user_id, family_id, created_at,
// and balance to slip into an UPDATE payload, which is both a type safety gap
// and a potential data-integrity issue (balance must only change via transactions).
export interface UpdateAccountInput {
  id: string
  name?: string
  type?: Account['type']
  color?: string | null
  icon?: string | null
  is_hidden_from_total?: boolean
  is_archived?: boolean
}

async function fetchAccounts(userId: string, familyId?: string | null) {
  const supabase = createClient()

  let query = supabase
    .from('accounts')
    .select('*')
    .eq('is_archived', false)
    .order('created_at')

  if (familyId) {
    query = query.or(`family_id.eq.${familyId},owner_user_id.eq.${userId}`)
  } else {
    query = query.eq('owner_user_id', userId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Account[]
}

interface UseAccountsOptions {
  initialAccounts?: Account[]
}

export function useAccounts({ initialAccounts }: UseAccountsOptions = {}) {
  const userId = useUIStore(s => s.userId)
  const { family } = useFamily()

  const query = useQuery({
    queryKey: ['accounts', userId, family?.id],
    queryFn: () => {
      if (!userId) throw new Error('[useAccounts] userId is required')
      return fetchAccounts(userId, family?.id)
    },
    enabled: !!userId,
    initialData: initialAccounts,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  })

  const accounts = query.data ?? []

  const totalBalance = useMemo(
    () => accounts
      .filter(a => !a.is_hidden_from_total)
      .reduce((sum, a) => sum + Number(a.balance), 0),
    [accounts]
  )

  return { ...query, accounts, totalBalance }
}

export function useCreateAccount() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)
  const { family } = useFamily()

  return useMutation({
    mutationFn: async (input: CreateAccountInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...input, owner_user_id: userId, family_id: family?.id ?? null })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts', userId, family?.id] }),
  })
}

export function useUpdateAccount() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)
  const { family } = useFamily()

  return useMutation({
    // H-8: UpdateAccountInput instead of Partial<Account>.
    // This ensures readonly fields (owner_user_id, family_id, created_at, balance)
    // can never be passed to the UPDATE statement.
    mutationFn: async ({ id, ...patch }: UpdateAccountInput) => {
      const supabase = createClient()
      let query = supabase
        .from('accounts')
        .update(patch)
        .eq('id', id)

      if (family?.id) {
        query = query.or(`family_id.eq.${family.id},owner_user_id.eq.${userId}`)
      } else {
        query = query.eq('owner_user_id', userId)
      }

      const { data, error } = await query.select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts', userId, family?.id] }),
  })
}

export function useArchiveAccount() {
  const qc = useQueryClient()
  const userId = useUIStore(s => s.userId)
  const { family } = useFamily()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      let query = supabase
        .from('accounts')
        .update({ is_archived: true })
        .eq('id', id)

      if (family?.id) {
        query = query.or(`family_id.eq.${family.id},owner_user_id.eq.${userId}`)
      } else {
        query = query.eq('owner_user_id', userId)
      }

      const { error } = await query
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts', userId, family?.id] }),
  })
}
