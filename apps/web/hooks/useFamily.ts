import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type FamilyMember = Database['public']['Tables']['family_members']['Row'] & {
  family: Database['public']['Tables']['families']['Row'] | null
}

export function useFamily(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['family', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000, // family changes rarely
    gcTime: 30 * 60_000,
    queryFn: async () => {
      // createClient() called inside queryFn — not at module level
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
}
