'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/ui.store'

interface AuthGuardProps {
  userId: string | null
  children: React.ReactNode
}

export function AuthGuard({ userId, children }: AuthGuardProps) {
  const router = useRouter()
  const setUserId = useUIStore((s) => s.setUserId)

  useEffect(() => {
    setUserId(userId)
  }, [userId, setUserId])

  useEffect(() => {
    if (!userId) {
      router.replace('/login')
    }
  }, [userId, router])

  // Не рендерим children пока userId не определён
  if (!userId) return null

  return <>{children}</>
}
