'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { useQueryClient } from '@tanstack/react-query'

interface AuthGuardProps {
  userId: string
  children: React.ReactNode
}

/**
 * Реактивная подписка на смену сессии.
 * Начальная проверка выполнена в Server Component layout.tsx —
 * children уже разрешены сервером, блокировать нечего.
 */
export function AuthGuard({ userId, children }: AuthGuardProps) {
  const router = useRouter()
  const setUserId = useUIStore((s) => s.setUserId)
  const queryClient = useQueryClient()

  // Синхронизируем userId из серверного пропа в стор во время рендера
  const currentUserId = useUIStore((s) => s.userId)
  if (currentUserId !== userId) {
    setUserId(userId)
  }

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Правильный порядок: стор → кеш → редирект
        setUserId(null)
        queryClient.clear()
        router.replace('/login')
      } else if (session.user.id !== userId) {
        // Смена пользователя между вкладками
        setUserId(session.user.id)
        queryClient.clear()
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [userId, router, setUserId, queryClient])

  return <>{children}</>
}
