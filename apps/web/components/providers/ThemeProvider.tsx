'use client'
import { useEffect } from 'react'
import { useUIStore } from '@/store/ui.store'

/**
 * ThemeProvider — синхронизирует тему из Zustand с классом .dark на <html>.
 *
 * FOUC prevention выполняется blocking inline-скриптом в app/layout.tsx
 * (до гидратации React). Этот компонент только:
 * 1. Синхронизирует Zustand-стор с реальным localStorage при маунте.
 * 2. Реагирует на изменения темы из ThemeToggle.
 * 3. Подписывается на system prefers-color-scheme при theme === 'system'.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore(s => s.theme)
  const setTheme = useUIStore(s => s.setTheme)

  // Шаг 1: при маунте читаем реальное значение из localStorage и
  // синхронизируем Zustand. Это нужно потому что ui.store инициализируется
  // с 'system' на сервере — клиент должен подтянуть реальное значение.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ff-theme') as 'light' | 'dark' | 'system' | null
      if (stored && stored !== theme) {
        setTheme(stored)
      }
    } catch {
      // localStorage недоступен (private mode, iframe sandbox) — ничего не делаем
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // только при маунте

  // Шаг 2: применяем класс .dark при каждом изменении theme
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }, [theme])

  // Шаг 3: слушаем системные изменения только в system-режиме
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
