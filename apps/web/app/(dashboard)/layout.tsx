'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { TransferModal } from '@/components/transfers/TransferModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const setUserId = useUIStore(s => s.setUserId)
  const queryClient = useQueryClient()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login')
      } else {
        setUserId(data.user.id)
        setAuthChecked(true)
      }
    }).catch(() => {
      router.replace('/login')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUserId(null)
        queryClient.clear()
        router.replace('/login')
      } else {
        setUserId(session.user.id)
        setAuthChecked(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, setUserId, queryClient])

  if (!authChecked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-6">
          {children}
        </main>
        <BottomNav />
      </div>
      <AddTransactionModal />
      <TransferModal />
    </div>
  )
}
