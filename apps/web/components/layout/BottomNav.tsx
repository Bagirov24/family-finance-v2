'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, CreditCard, Plus, BarChart2,
  Settings, Target, Car, MoreHorizontal, ArrowLeftRight,
  Wallet, Sun, Moon, Monitor
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '@/store/ui.store'

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const tx = useTranslations('transaction')
  const tt = useTranslations('transfers')
  const [moreOpen, setMoreOpen] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLDivElement>(null)
  const { setAddTransactionOpen, setAddTransferOpen, theme, setTheme } = useUIStore()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setFabOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const MAIN_LEFT = [
    { href: '/overview',     icon: LayoutDashboard, label: t('overview') },
    { href: '/transactions', icon: CreditCard,      label: t('transactions') },
  ]

  const MAIN_RIGHT = [
    { href: '/budgets',  icon: Wallet,   label: t('budgets') },
    { href: '/analytics', icon: BarChart2, label: t('analytics') },
  ]

  const MORE_ITEMS = [
    { href: '/goals',    icon: Target,   label: t('goals') },
    { href: '/car',      icon: Car,      label: t('car') },
    { href: '/transfers',icon: ArrowLeftRight, label: t('transfers') },
    { href: '/settings', icon: Settings, label: t('settings') },
  ]

  const moreActive = MORE_ITEMS.some(i => pathname.startsWith(i.href))

  const themeIcons = { light: Sun, dark: Moon, system: Monitor }
  const ThemeIcon = themeIcons[theme]
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 md:hidden">
      {/* FAB action sheet */}
      {fabOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-10"
            onClick={() => setFabOpen(false)}
          />
          <div
            ref={fabRef}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
          >
            {/* Transfer */}
            <button
              onClick={() => { setAddTransferOpen(true); setFabOpen(false) }}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border shadow-lg px-5 py-3 text-sm font-medium text-foreground active:scale-95 transition-transform min-w-[200px]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                <ArrowLeftRight className="h-4 w-4" />
              </span>
              {tt('send')}
            </button>
            {/* Transaction */}
            <button
              onClick={() => { setAddTransactionOpen(true); setFabOpen(false) }}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border shadow-lg px-5 py-3 text-sm font-medium text-foreground active:scale-95 transition-transform min-w-[200px]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-4 w-4" />
              </span>
              {tx('add')}
            </button>
          </div>
        </>
      )}

      {/* Nav bar */}
      <div className="flex items-end border-t border-border bg-card pb-safe">
        {/* Left items */}
        {MAIN_LEFT.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate w-full text-center leading-none">{label}</span>
            </Link>
          )
        })}

        {/* Centre FAB */}
        <div className="flex flex-col items-center justify-center px-3 pb-1" ref={fabRef}>
          <button
            onClick={() => setFabOpen(v => !v)}
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all active:scale-90',
              fabOpen
                ? 'bg-primary/20 text-primary rotate-45'
                : 'bg-primary text-primary-foreground'
            )}
            aria-label="Add"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {/* Right items */}
        {MAIN_RIGHT.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate w-full text-center leading-none">{label}</span>
            </Link>
          )
        })}

        {/* More */}
        <div className="flex flex-1 flex-col items-center justify-center relative" ref={moreRef}>
          <button
            onClick={() => setMoreOpen(v => !v)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium w-full transition-colors active:scale-95',
              moreActive || moreOpen ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="leading-none">Ещё</span>
          </button>

          {moreOpen && (
            <div className="absolute bottom-full mb-2 right-1 w-52 rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              {MORE_ITEMS.map(({ href, icon: Icon, label }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors active:scale-95',
                      active ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
              {/* Theme toggle in More menu */}
              <div className="border-t border-border">
                <button
                  onClick={() => setTheme(nextTheme)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium w-full text-foreground hover:bg-accent transition-colors active:scale-95"
                >
                  <ThemeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="capitalize">
                    {theme === 'light' ? 'Светлая' : theme === 'dark' ? 'Тёмная' : 'Системная'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
