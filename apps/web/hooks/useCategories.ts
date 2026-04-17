import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export interface Category {
  id: string
  user_id: string | null
  name: string
  emoji: string
  color: string
  type: 'income' | 'expense' | 'both'
  is_system: boolean
}

async function fetchCategories(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .order('is_system', { ascending: false })
    .order('name')
  if (error) throw error
  return data as Category[]
}

export function useCategories(type?: 'income' | 'expense') {
  const userId = useUIStore(s => s.userId)

  const query = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => fetchCategories(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })

  const filtered = type
    ? query.data?.filter(c => c.type === type || c.type === 'both')
    : query.data

  return { ...query, data: filtered }
}
