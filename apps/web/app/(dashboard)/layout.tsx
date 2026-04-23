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

  // C-5: destructure error alongside user. Without this check, a Supabase
  // network error returns { user: null, error: ... } which would incorrectly
  // redirect an authenticated user to /login.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // 'Auth session missing!' is the expected error code for unauthenticated
  // visitors — treat it as "no user" and fall through to the redirect below.
  // Any other error means Supabase is unreachable: throw so Next.js renders
  // the error boundary instead of redirecting a logged-in user to /login.
  if (authError && authError.message !== 'Auth session missing!') {
    throw authError
  }

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
