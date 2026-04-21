'use client'
import { useState, useRef, useEffect } from 'react'
import { Menu, Plus, ArrowLeftRight, ChevronLeft, ChevronRight, Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui.store'
import { getMonthName } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useNotifications } from '@/hooks/useNotifications'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn } from '@/lib/utils'

export function Header() {
  const tt = useTranslations('transfers')
  const tx = useTranslations('transaction')
  const tc = useTranslations('common')
  const tn = useTranslations('notifications')
  const {
    setSidebarOpen,
    setAddTransactionOpen,
    setAddTransferOpen,
    activePeriod,
    setActivePeriod,
  } = useUIStore()

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function prevMonth() {
    const { month, year } = activePeriod
    if (month === 1) setActivePeriod(12, year - 1)
    else setActivePeriod(month - 1, year)
  }

  function nextMonth() {
    const { month, year } = activePeriod
    if (month === 12) setActivePeriod(1, year + 1)
    else setActivePeriod(month + 1, year)
  }

  const { month, year } = activePeriod
  const isCurrentMonth =
    month === new Date().getMonth() + 1 && year === new Date().getFullYear()

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card/80 backdrop-blur px-4">
      {/* Burger — mobile only */}
      <button
        className="md:hidden p-1.5 rounded-lg hover:bg-accent"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Period selector */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-1">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[110px] text-center text-sm font-medium capitalize">
          {getMonthName(month)} {year}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-40"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle — desktop only */}
        <div className="hidden md:flex">
          <ThemeToggle />
        </div>

        {/* Notifications bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-1.5 rounded-lg hover:bg-accent transition-colors"
            aria-label={tn('title')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-sm font-semibold">{tn('title')}</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-primary hover:underline"
                  >
                    {tn('mark_all_read')}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{tc('empty')}</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 transition-colors',
                        !n.is_read ? 'bg-primary/5' : 'hover:bg-accent/50'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !n.is_read && 'font-medium')}>{n.title}</p>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => markRead.mutate(n.id)}
                          className="mt-0.5 p-1 rounded-lg hover:bg-accent transition-colors shrink-0"
                          aria-label={tn('mark_read')}
                        >
                          <Check size={12} className="text-primary" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transfer btn — desktop only */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddTransferOpen(true)}
          className="hidden md:flex gap-1.5"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {tt('send')}
        </Button>

        {/* Add transaction — desktop only */}
        <Button
          size="sm"
          onClick={() => setAddTransactionOpen(true)}
          className="hidden md:flex gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          {tx('add')}
        </Button>
      </div>
    </header>
  )
}
