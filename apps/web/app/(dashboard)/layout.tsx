import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { TransferModal } from '@/components/transfers/TransferModal'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AuthGuard userId={user.id}>
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
    </AuthGuard>
  )
}
