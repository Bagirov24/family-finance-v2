'use client'
import { useEffect } from 'react'
import { useUIStore } from '@/store/ui.store'

// Apply theme immediately before first paint to avoid flash
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('ff-theme') as 'light' | 'dark' | 'system' | null
  const theme = stored ?? 'system'
  const dark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore(s => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', dark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return <>{children}</>
}
