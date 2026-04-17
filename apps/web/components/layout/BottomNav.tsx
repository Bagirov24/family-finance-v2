'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LayoutDashboard, ArrowLeftRight, Wallet, BarChart3, Car } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/overview',     icon: LayoutDashboard, key: 'overview' },
  { href: '/transactions', icon: Wallet,           key: 'transactions' },
  { href: '/transfers',    icon: ArrowLeftRight,   key: 'transfers' },
  { href: '/analytics',   icon: BarChart3,        key: 'analytics' },
  { href: '/car',          icon: Car,              key: 'car' },
]

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur border-t lg:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {items.map(({ href, icon: Icon, key }) => {
          const active = pathname.includes(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium truncate">{t(key as 'overview')}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
