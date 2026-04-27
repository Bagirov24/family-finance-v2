import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import type { Database } from '@/types/supabase'

export type Notification = Database['public']['Tables']['notifications']['Row']

export function useNotifications() {
  const queryClient = useQueryClient()
  const userId = useUIStore(s => s.userId)

  const query = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) throw new Error('[useNotifications] userId is required')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as Notification[]
    },
  })

  const unreadCount = (query.data ?? []).filter(n => !n.is_read).length

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('[useNotifications.markRead] userId is required')
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('[useNotifications.markAllRead] userId is required')
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  })

  return {
    notifications: query.data ?? [],
    unreadCount,
    markRead,
    markAllRead,
    isLoading: query.isLoading,
  }
}
