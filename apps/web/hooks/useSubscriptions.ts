import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'

export interface Subscription {
  id: string
  family_id: string
  name: string
  amount: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'weekly'
  next_billing_date: string | null
  category: string | null
  color: string | null
  icon: string | null
  is_active: boolean
  created_at: string
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

export function useCreateSubscription() {
  const qc = useQueryClient()
  const { family } = useFamily()
  return useMutation({
    mutationFn: async (input: Omit<Subscription, 'id' | 'family_id' | 'created_at'>) => {
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
    mutationFn: async ({ id, ...input }: Partial<Subscription> & { id: string }) => {
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
