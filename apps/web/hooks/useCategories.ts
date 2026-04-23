import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

export interface Category {
  id: string
  family_id: string | null
  name_key: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'both'
  is_default: boolean
}

async function fetchCategories(userId: string) {
  const supabase = createClient()
  const { data: memberData } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .maybeSingle()

  const familyId = memberData?.family_id

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

  const query = useQuery({
    queryKey: ['categories', userId],
    queryFn: () => fetchCategories(userId!),
    enabled: !!userId,
    staleTime: 30 * 60_000,  // 30 мин — категории меняются крайне редко
    gcTime: 60 * 60_000,
  })

  const filtered = type
    ? query.data?.filter(c => c.type === type || c.type === 'both')
    : query.data

  return { ...query, data: filtered }
}
