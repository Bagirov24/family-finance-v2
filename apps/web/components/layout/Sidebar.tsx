'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target,
  CreditCard, BarChart3, Gift, Car, Users, X
} from 'lucide-react'
import { useUIStore } from '@/store/ui.store'

const navItems = [
  { href: '/overview',      icon: LayoutDashboard, key: 'overview' },
  { href: '/transactions',  icon: Wallet,           key: 'transactions' },
  { href: '/transfers',     icon: ArrowLeftRight,   key: 'transfers' },
  { href: '/budgets',       icon: Target,           key: 'budgets' },
  { href: '/goals',         icon: Target,           key: 'goals' },
  { href: '/accounts',      icon: CreditCard,       key: 'accounts' },
  { href: '/analytics',     icon: BarChart3,        key: 'analytics' },
  { href: '/cashback',      icon: Gift,             key: 'cashback' },
  { href: '/car',           icon: Car,              key: 'car' },
  { href: '/family',        icon: Users,            key: 'family' },
]

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full w-64 bg-card border-r z-50 flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-lg">Family Finance</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, key }) => {
            const active = pathname.includes(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {t(key as 'overview')}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
