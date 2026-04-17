'use client'
import { Menu, Plus, Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useUIStore } from '@/store/ui.store'
import { Button } from '@/components/ui/button'

export function Header({ title }: { title?: string }) {
  const { toggleSidebar, setAddTransactionOpen } = useUIStore()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-background/80 backdrop-blur border-b">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-muted"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && <h1 className="font-semibold text-lg truncate">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="relative"
          onClick={() => {}}
        >
          <Bell className="w-5 h-5" />
        </Button>
        <Button
          size="sm"
          className="gap-1 rounded-xl"
          onClick={() => setAddTransactionOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Добавить</span>
        </Button>
      </div>
    </header>
  )
}
