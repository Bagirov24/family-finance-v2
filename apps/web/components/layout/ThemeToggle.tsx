'use client'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore()

  const options = [
    { value: 'light' as const, icon: Sun,     label: 'Light' },
    { value: 'dark'  as const, icon: Moon,    label: 'Dark' },
    { value: 'system'as const, icon: Monitor, label: 'System' },
  ]

  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-border bg-muted p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          aria-label={label}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center justify-center rounded-lg p-1.5 transition-colors',
            theme === value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
