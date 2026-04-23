import { create } from 'zustand'

const THEME_KEY = 'ff-theme'

interface UIState {
  userId: string | null
  sidebarOpen: boolean
  addTransactionOpen: boolean
  addTransferOpen: boolean
  activePeriod: { month: number; year: number }
  theme: 'light' | 'dark' | 'system'

  setUserId: (id: string | null) => void
  setSidebarOpen: (v: boolean) => void
  setAddTransactionOpen: (v: boolean) => void
  setAddTransferOpen: (v: boolean) => void
  setActivePeriod: (month: number, year: number) => void
  setTheme: (t: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIState>(set => ({
  userId: null,
  sidebarOpen: false,
  addTransactionOpen: false,
  addTransferOpen: false,
  activePeriod: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
  // Инициализируем 'system' — безопасно для SSR.
  // Реальное значение из localStorage подтягивается ThemeProvider при маунте.
  // Это исключает hydration mismatch: сервер и клиент оба видят 'system'
  // при первом рендере, DOM-класс .dark уже правильно выставлен
  // blocking-скриптом в layout.tsx.
  theme: 'system',

  setUserId: (id) => set({ userId: id }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setAddTransactionOpen: (v) => set({ addTransactionOpen: v }),
  setAddTransferOpen: (v) => set({ addTransferOpen: v }),
  setActivePeriod: (month, year) => set({ activePeriod: { month, year } }),
  setTheme: (t) => {
    try {
      localStorage.setItem(THEME_KEY, t)
    } catch {
      // localStorage недоступен — тема работает только в текущей сессии
    }
    set({ theme: t })
  },
}))
