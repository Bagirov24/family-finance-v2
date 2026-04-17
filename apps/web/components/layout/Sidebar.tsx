'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target,
  CreditCard, BarChart2, Gift, Users, Car, Settings, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'

const NAV_ITEMS = [
  { href: '/overview',      icon: LayoutDashboard, label: 'Обзор' },
  { href: '/transactions',  icon: CreditCard,       label: 'Транзакции' },
  { href: '/transfers',     icon: ArrowLeftRight,   label: 'Переводы' },
  { href: '/budgets',       icon: Wallet,           label: 'Бюджеты' },
  { href: '/goals',         icon: Target,           label: 'Цели' },
  { href: '/accounts',      icon: CreditCard,       label: 'Счета' },
  { href: '/analytics',     icon: BarChart2,        label: 'Аналитика' },
  { href: '/cashback',      icon: Gift,             label: 'Кэшбэк' },
  { href: '/family',        icon: Users,            label: 'Семья' },
  { href: '/car',           icon: Car,              label: 'Авто' },
  { href: '/settings',      icon: Settings,         label: 'Настройки' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <span className="font-bold text-base tracking-tight text-foreground">
            💰 FamilyFinance
          </span>
          <button
            className="md:hidden p-1 rounded-lg hover:bg-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors mb-0.5',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
