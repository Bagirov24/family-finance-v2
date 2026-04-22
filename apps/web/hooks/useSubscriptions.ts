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
  next_billing_date: string        // NOT NULL in DB
  category_id: string | null       // uuid FK, not free text
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
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export function useSubscriptions() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: ['subscriptions', family?.id],
    queryFn: () => fetchSubscriptions(family!.id),
    enabled: !!family?.id,
  })
  return { ...query, subscriptions: query.data ?? [] }
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

export function useCreateSubscription() {
  const qc = useQueryClient()
  const { family } = useFamily()
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({ ...input, family_id: family?.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  })
}

export function useUpdateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateInput> & { id: string }) => {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  })
}

export function useDeleteSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('subscriptions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  })
}
