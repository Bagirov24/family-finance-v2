'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CreditCard, ArrowLeftRight, Wallet, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/overview',     icon: LayoutDashboard, label: 'Обзор' },
  { href: '/transactions', icon: CreditCard,      label: 'Расходы' },
  { href: '/transfers',    icon: ArrowLeftRight,  label: 'Переводы' },
  { href: '/budgets',      icon: Wallet,          label: 'Бюджеты' },
  { href: '/analytics',    icon: BarChart2,       label: 'Аналитика' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 flex border-t border-border bg-card md:hidden">
      {ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'text-primary')} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
