'use client'
import { Menu, Plus, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui.store'
import { getMonthName } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export function Header() {
  const t = useTranslations('common')
  const tt = useTranslations('transfers')
  const tx = useTranslations('transaction')
  const {
    setSidebarOpen,
    setAddTransactionOpen,
    setAddTransferOpen,
    activePeriod,
    setActivePeriod,
  } = useUIStore()

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
      {/* Burger */}
      <button
        className="md:hidden p-1.5 rounded-lg hover:bg-accent"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Period selector */}
      <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-1">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
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
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddTransferOpen(true)}
          className="hidden sm:flex gap-1.5"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {tt('send')}
        </Button>
        <Button
          size="sm"
          onClick={() => setAddTransactionOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tx('add')}</span>
        </Button>
      </div>
    </header>
  )
}
