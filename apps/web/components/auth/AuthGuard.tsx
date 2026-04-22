'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { useUIStore } from '@/store/useUIStore'

interface AuthGuardProps {
  userId: string | null
  children: React.ReactNode
}

export function AuthGuard({ userId, children }: AuthGuardProps) {
  const setUserId = useUIStore((s) => s.setUserId)

  // Side effect moved to useEffect — no setState during render
  useEffect(() => {
    setUserId(userId)
  }, [userId, setUserId])

  if (!userId) {
    redirect('/sign-in')
  }

  return <>{children}</>
}
