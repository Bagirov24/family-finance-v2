'use client'
import { useState } from 'react'
import { Menu, Plus, ArrowLeftRight, ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui.store'
import { getMonthName } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useNotifications } from '@/hooks/useNotifications'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { NotificationsSheet } from '@/components/layout/NotificationsSheet'

export function Header() {
  const tt = useTranslations('transfers')
  const tx = useTranslations('transaction')
  const tn = useTranslations('notifications')
  const {
    setSidebarOpen,
    setAddTransactionOpen,
    setAddTransferOpen,
    activePeriod,
    setActivePeriod,
  } = useUIStore()

  const { unreadCount } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)

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
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card/80 backdrop-blur px-4">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-accent"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Month selector */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-1 max-w-[calc(100vw-160px)] md:max-w-none">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[112px] text-center text-sm font-medium capitalize truncate">
            {getMonthName(month)} {year}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-40"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>

          {/* Bell — opens Sheet on mobile, same behavior on desktop */}
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label={tn('title')}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddTransferOpen(true)}
            className="hidden md:flex gap-1.5"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {tt('send')}
          </Button>

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

      {/* Notifications sheet — works on both mobile and desktop */}
      <NotificationsSheet open={notifOpen} onOpenChange={setNotifOpen} />
    </>
  )
}
