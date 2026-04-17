import { create } from 'zustand'

interface UIStore {
  // Auth
  userId: string | null
  setUserId: (id: string | null) => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Add transaction modal
  addTransactionOpen: boolean
  setAddTransactionOpen: (open: boolean) => void

  // Add transfer modal
  addTransferOpen: boolean
  setAddTransferOpen: (open: boolean) => void

  // Active period (for analytics/budgets)
  activePeriod: { month: number; year: number }
  setActivePeriod: (period: { month: number; year: number }) => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

const now = new Date()

export const useUIStore = create<UIStore>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  addTransactionOpen: false,
  setAddTransactionOpen: (open) => set({ addTransactionOpen: open }),

  addTransferOpen: false,
  setAddTransferOpen: (open) => set({ addTransferOpen: open }),

  activePeriod: { month: now.getMonth() + 1, year: now.getFullYear() },
  setActivePeriod: (period) => set({ activePeriod: period }),

  theme: 'system',
  setTheme: (theme) => set({ theme }),
}))
