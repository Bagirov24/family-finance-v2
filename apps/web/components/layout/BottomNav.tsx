'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight,
  Wallet, BarChart2, Settings, Target, Car, MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const MAIN_ITEMS = [
    { href: '/overview',     icon: LayoutDashboard, label: t('overview') },
    { href: '/transactions', icon: CreditCard,      label: t('transactions') },
    { href: '/transfers',    icon: ArrowLeftRight,  label: t('transfers') },
    { href: '/budgets',      icon: Wallet,          label: t('budgets') },
    { href: '/analytics',   icon: BarChart2,       label: t('analytics') },
  ]

  const MORE_ITEMS = [
    { href: '/goals',    icon: Target,   label: t('goals') },
    { href: '/car',      icon: Car,      label: t('car') },
    { href: '/settings', icon: Settings, label: t('settings') },
  ]

  const moreActive = MORE_ITEMS.some(i => pathname.startsWith(i.href))

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 flex border-t border-border bg-card md:hidden">
      {MAIN_ITEMS.map(({ href, icon: Icon, label }) => {
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

      {/* More menu */}
      <div className="flex flex-1 flex-col items-center justify-center relative" ref={moreRef}>
        <button
          onClick={() => setMoreOpen(v => !v)}
          className={cn(
            'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium w-full transition-colors',
            moreActive || moreOpen ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <MoreHorizontal className={cn('h-5 w-5', (moreActive || moreOpen) && 'text-primary')} />
          <span className="leading-none">{t('more')}</span>
        </button>

        {moreOpen && (
          <div className="absolute bottom-full mb-1 right-0 w-44 rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
            {MORE_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                    active ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
