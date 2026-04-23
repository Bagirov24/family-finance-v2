'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  CreditCard,
  Plus,
  BarChart2,
  Settings,
  Target,
  Car,
  MoreHorizontal,
  ArrowLeftRight,
  Wallet,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useUIStore } from '@/store/ui.store'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const tx = useTranslations('transaction')
  const tt = useTranslations('transfers')
  const tc = useTranslations('common')
  const [moreOpen, setMoreOpen] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)

  // ✅ точные селекторы — не подписываемся на весь стор
  const setAddTransactionOpen = useUIStore(s => s.setAddTransactionOpen)
  const setAddTransferOpen    = useUIStore(s => s.setAddTransferOpen)
  const theme                 = useUIStore(s => s.theme)
  const setTheme              = useUIStore(s => s.setTheme)

  const MAIN_LEFT = [
    { href: '/overview',      icon: LayoutDashboard, label: t('overview') },
    { href: '/transactions',  icon: CreditCard,       label: t('transactions') },
  ]

  const MAIN_RIGHT = [
    { href: '/budgets', icon: Wallet, label: t('budgets') },
  ]

  const MORE_ITEMS = [
    { href: '/analytics',     icon: BarChart2,       label: t('analytics') },
    { href: '/goals',         icon: Target,          label: t('goals') },
    { href: '/subscriptions', icon: RefreshCw,       label: t('subscriptions') },
    { href: '/car',           icon: Car,             label: t('car') },
    { href: '/transfers',     icon: ArrowLeftRight,  label: t('transfers') },
    { href: '/settings',      icon: Settings,        label: t('settings') },
  ]

  const moreActive = MORE_ITEMS.some(i => pathname.startsWith(i.href))

  const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; icon: typeof Sun; label: string }[] = [
    { value: 'light',  icon: Sun,     label: tc('theme_light') },
    { value: 'dark',   icon: Moon,    label: tc('theme_dark') },
    { value: 'system', icon: Monitor, label: tc('theme_system') },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 md:hidden">
      {/* FAB action sheet */}
      <Sheet open={fabOpen} onOpenChange={setFabOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{tc('actions')}</SheetTitle>
          </SheetHeader>
          <div className="grid gap-3">
            <button
              onClick={() => {
                setAddTransactionOpen(true)
                setFabOpen(false)
              }}
              className="flex min-h-14 items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-left active:scale-[0.99] transition-transform text-primary-foreground"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">{tx('add')}</div>
                <div className="text-xs text-primary-foreground/75">{tx('fab_add_subtitle')}</div>
              </div>
            </button>

            <button
              onClick={() => {
                setAddTransferOpen(true)
                setFabOpen(false)
              }}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-left active:scale-[0.99] transition-transform"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ArrowLeftRight className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">{tt('send')}</div>
                <div className="text-xs text-muted-foreground">{tx('fab_transfer_subtitle')}</div>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* More sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('more')}</SheetTitle>
          </SheetHeader>

          {/* Nav links */}
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border mb-3">
            {MORE_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex min-h-12 items-center gap-3 px-4 py-3 transition-colors',
                    active
                      ? 'bg-primary/8 text-primary font-medium'
                      : 'bg-card text-foreground active:bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-sm">{label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
                </Link>
              )
            })}
          </div>

          {/* Theme picker */}
          <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">{tc('theme')}</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors',
                  theme === value
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-border bg-card text-muted-foreground active:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Tab bar — 4 cols: left × 2, FAB, right × 1, More */}
      <div className="grid grid-cols-5 items-end border-t border-border bg-card/95 backdrop-blur pb-safe">
        {MAIN_LEFT.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate w-full text-center leading-none">{label}</span>
            </Link>
          )
        })}

        {/* FAB */}
        <div className="flex flex-col items-center justify-center px-2 pb-1">
          <button
            onClick={() => setFabOpen(v => !v)}
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all active:scale-90',
              fabOpen
                ? 'bg-primary/20 text-primary rotate-45'
                : 'bg-primary text-primary-foreground'
            )}
            aria-label={tc('actions')}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {MAIN_RIGHT.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate w-full text-center leading-none">{label}</span>
            </Link>
          )
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(v => !v)}
          className={cn(
            'flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors active:scale-95',
            moreActive || moreOpen ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="leading-none">{t('more')}</span>
        </button>
      </div>
    </nav>
  )
}
