import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'

const supabase = createClient()

export type FamilyMemberRole = 'owner' | 'member'

export type FamilyMember = {
  id: string
  family_id: string | null
  user_id: string
  role: FamilyMemberRole
  display_name: string | null
  avatar_url: string | null
  locale: string
  metadata: Record<string, unknown> | null
  joined_at: string | null
  family: {
    id: string
    name: string
    invite_code: string
    currency: string
  } | null
}

export function useFamily() {
  const currentUserId = useUIStore(s => s.userId)
  const queryClient = useQueryClient()

  const membersQuery = useQuery({
    queryKey: ['family-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, family:families(id, name, invite_code, currency)')
        .eq('user_id', currentUserId!)
        .order('joined_at')
      if (error) throw error
      return data as FamilyMember[]
    },
    enabled: !!currentUserId,
  })

  const family = membersQuery.data?.[0]?.family ?? null
  const members = membersQuery.data ?? []
  const currentMember = members.find(m => m.user_id === currentUserId)
  const isOwner = currentMember?.role === 'owner'

  function invalidateMembers() {
    queryClient.invalidateQueries({ queryKey: ['family-members'] })
  }

  return {
    family,
    members,
    currentUserId,
    currentMember,
    isOwner,
    isLoading: membersQuery.isLoading,
    invalidateMembers,
  }
}
