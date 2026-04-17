import { create } from 'zustand'

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
  theme: 'system',

  setUserId: (id) => set({ userId: id }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setAddTransactionOpen: (v) => set({ addTransactionOpen: v }),
  setAddTransferOpen: (v) => set({ addTransferOpen: v }),
  setActivePeriod: (month, year) => set({ activePeriod: { month, year } }),
  setTheme: (t) => set({ theme: t }),
}))
