'use client'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'

const CYCLE = ['light', 'dark', 'system'] as const
type Theme = typeof CYCLE[number]

const ICONS: Record<Theme, React.ElementType> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore()
  const current: Theme = (CYCLE.includes(theme as Theme) ? theme : 'system') as Theme
  const Icon = ICONS[current]

  function toggle() {
    const idx = CYCLE.indexOf(current)
    setTheme(CYCLE[(idx + 1) % CYCLE.length])
  }

  return (
    <button
      aria-label={`Theme: ${LABELS[current]}. Click to switch`}
      onClick={toggle}
      className={cn(
        'flex items-center justify-center rounded-lg p-2 transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
