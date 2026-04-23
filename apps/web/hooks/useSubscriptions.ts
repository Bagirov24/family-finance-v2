import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'

export interface Subscription {
  id: string
  family_id: string
  created_by_user_id: string | null
  name: string
  description: string | null
  amount: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'weekly'
  next_billing_date: string
  category_id: string | null
  account_id: string | null
  color: string
  icon: string
  is_active: boolean
  reminder_days: number
  auto_create_tx: boolean
  created_at: string
  updated_at: string
}

async function fetchSubscriptions(familyId: string): Promise<Subscription[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('family_id', familyId)
    .order('next_billing_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

type CreateInput = Pick<
  Subscription,
  'name' | 'amount' | 'currency' | 'billing_cycle' | 'next_billing_date' |
  'color' | 'icon' | 'is_active'
> & {
  description?: string | null
  category_id?: string | null
  account_id?: string | null
  reminder_days?: number
  auto_create_tx?: boolean
}

// M-5: dedicated update type — excludes readonly server fields
// (id, family_id, created_by_user_id, created_at, updated_at) so they
// cannot accidentally land in an UPDATE payload.
type UpdateSubscriptionInput = {
  id: string
  name?: string
  description?: string | null
  amount?: number
  currency?: string
  billing_cycle?: Subscription['billing_cycle']
  next_billing_date?: string
  category_id?: string | null
  account_id?: string | null
  color?: string
  icon?: string
  is_active?: boolean
  reminder_days?: number
  auto_create_tx?: boolean
}

export function useSubscriptions() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: ['subscriptions', family?.id],
    // M-5: type guard replaces family!.id non-null assertion.
    // `enabled: !!family?.id` prevents execution when nullish, but TypeScript
    // does not know that invariant — the guard makes it explicit and
    // produces a clear error if the invariant is ever broken at runtime.
    queryFn: () => {
      if (!family?.id) throw new Error('[useSubscriptions] family.id is required')
      return fetchSubscriptions(family.id)
    },
    enabled: !!family?.id,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  })
  return { ...query, subscriptions: query.data ?? [] }
}

export function useCreateSubscription() {
  const qc = useQueryClient()
  const { family } = useFamily()
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      if (!family?.id) throw new Error('[useCreateSubscription] family.id is required')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({ ...input, family_id: family.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    // M-5: scoped invalidation — only this family's subscriptions slice.
    // The previous broad ['subscriptions'] key would refetch ALL families
    // if multiple family contexts were ever cached simultaneously.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions', family?.id] }),
  })
}

export function useUpdateSubscription() {
  const qc = useQueryClient()
  const { family } = useFamily()
  return useMutation({
    // M-5: UpdateSubscriptionInput instead of Partial<CreateInput> & { id }
    // — readonly fields are now excluded from the update payload type.
    mutationFn: async ({ id, ...input }: UpdateSubscriptionInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions', family?.id] }),
  })
}

export function useDeleteSubscription() {
  const qc = useQueryClient()
  const { family } = useFamily()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('subscriptions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions', family?.id] }),
  })
}
