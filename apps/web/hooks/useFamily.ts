import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const supabase = createClient()

export function useFamily() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
    })
  }, [])

  const membersQuery = useQuery({
    queryKey: ['family-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('*, family:families(id, name, invite_code, currency)')
        .order('joined_at')
      if (error) throw error
      return data
    }
  })

  const family = membersQuery.data?.[0]?.family ?? null
  const members = membersQuery.data ?? []
  const currentMember = members.find(m => m.user_id === currentUserId)
  const isOwner = currentMember?.role === 'owner'

  return {
    family,
    members,
    currentUserId,
    currentMember,
    isOwner,
    isLoading: membersQuery.isLoading
  }
}
