import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { useFamily } from '@/hooks/useFamily'

export interface Category {
  id: string
  family_id: string | null
  name_key: string
  /** Alias for name_key — used by cashback and other consumers that rely on `.key` */
  key: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'both'
  is_default: boolean
}

// L-3: explicit return type so callers have a stable, named contract
// rather than relying on inferred widened union types from useQuery.
export interface UseCategoriesResult {
  /** Filtered (by type) category list, or all categories when type is omitted. */
  categories: Category[] | undefined
  isLoading: boolean
  isPending: boolean
  isError: boolean
  error: unknown
}

async function fetchCategories(familyId: string | null): Promise<Category[]> {
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

  // Map name_key → key so all consumers get a consistent `.key` field
  return (data as Omit<Category, 'key'>[]).map(row => ({ ...row, key: row.name_key }))
}

export function useCategories(type?: Category['type']): UseCategoriesResult {
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

  // L-3: renamed `data` → `categories` to avoid shadowing the TanStack Query
  // `data` field. The previous `{ ...query, data: filtered }` was confusing:
  // spreading `query` already brought in `data` (the unfiltered list), then
  // overwriting it with `filtered` created a hidden gotcha where a caller
  // destructuring `{ data }` from this hook would silently get the filtered
  // version even without reading the JSDoc.
  const categories = type
    ? query.data?.filter(c => c.type === type || c.type === 'both')
    : query.data

  return {
    categories,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  }
}
