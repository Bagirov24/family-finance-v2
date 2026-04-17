'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, CreditCard, ArrowLeftRight, Wallet, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const ITEMS = [
    { href: '/overview',     icon: LayoutDashboard, label: t('overview') },
    { href: '/transactions', icon: CreditCard,      label: t('transactions') },
    { href: '/transfers',    icon: ArrowLeftRight,  label: t('transfers') },
    { href: '/budgets',      icon: Wallet,          label: t('budgets') },
    { href: '/analytics',    icon: BarChart2,       label: t('analytics') },
    { href: '/settings',     icon: Settings,        label: t('settings') },
  ]

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
            <span className="truncate w-full text-center leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
