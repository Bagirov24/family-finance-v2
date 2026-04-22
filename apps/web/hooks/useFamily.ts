import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import type { Database } from '@/lib/supabase/types'

export type FamilyMember = Database['public']['Tables']['family_members']['Row'] & {
  family: Database['public']['Tables']['families']['Row'] | null
}

/**
 * Returns family + members for the current user.
 * Uses userId from ui.store — no argument needed.
 * Returns { family, members, currentUserId, isOwner, invalidateMembers, ...queryResult }
 */
export function useFamily() {
  const userId = useUIStore((s) => s.userId)

  const query = useQuery({
    queryKey: ['family', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('family_members')
        .select('*, family:families(id, name, invite_code, currency)')
        .eq('user_id', userId!)
        .order('joined_at')

      if (error) throw error

      const members = (data ?? []) as FamilyMember[]
      const family = members[0]?.family ?? null

      return { members, family }
    },
  })

  const members = query.data?.members ?? []
  const currentMember = members.find((m) => m.user_id === userId)
  const isOwner = currentMember?.role === 'owner'

  return {
    ...query,
    family: query.data?.family ?? null,
    members,
    currentUserId: userId,
    isOwner,
    invalidateMembers: query.refetch,
  }
}
