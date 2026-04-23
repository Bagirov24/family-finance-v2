import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { useFamily } from '@/hooks/useFamily'

export interface Category {
  id: string
  family_id: string | null
  name_key: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'both'
  is_default: boolean
}

async function fetchCategories(familyId: string | null) {
  const supabase = createClient()

  // Single query — no N+1. familyId comes from useFamily cache (already loaded).
  let query = supabase
    .from('categories')
    .select('id, family_id, name_key, icon, color, type, is_default')
    .order('is_default', { ascending: false })
    .order('name_key')

  if (familyId) {
    query = query.or(`is_default.eq.true,family_id.eq.${familyId}`)
  } else {
    query = query.eq('is_default', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Category[]
}

export function useCategories(type?: 'income' | 'expense') {
  const userId = useUIStore(s => s.userId)
  // familyId берём из useFamily — данные уже в кеше React Query,
  // отдельного сетевого запроса не происходит
  const { family } = useFamily()
  const familyId = family?.id ?? null

  const query = useQuery({
    queryKey: ['categories', userId, familyId],
    queryFn: () => fetchCategories(familyId),
    enabled: !!userId,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  })

  const filtered = type
    ? query.data?.filter(c => c.type === type || c.type === 'both')
    : query.data

  return { ...query, data: filtered }
}
