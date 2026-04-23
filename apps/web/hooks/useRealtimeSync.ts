/**
 * useRealtimeSync — глобальная Realtime-подписка.
 *
 * Слушает INSERT/UPDATE/DELETE в таблицах transactions и accounts
 * по family_id текущей семьи.
 *
 * Ключевой принцип: события, порождённые САМИМ пользователем
 * (payload.new.user_id === userId), игнорируются — их инвалидация
 * уже выполнена через onSuccess мутации. Это исключает двойной
 * рефетч при собственных действиях.
 */
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'

export function useRealtimeSync() {
  const { family } = useFamily()
  // Точный селектор — компонент не ре-рендерится при изменении
  // других полей стора (sidebarOpen, theme, activePeriod и т.д.)
  const userId = useUIStore(s => s.userId)
  const qc = useQueryClient()

  useEffect(() => {
    if (!family?.id || !userId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`realtime-sync:${family.id}`)

      // Транзакции — чужие изменения в семье
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `family_id=eq.${family.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { user_id?: string } | null
          // Пропускаем собственные события — onSuccess мутации уже инвалидировал
          if (row?.user_id === userId) return

          qc.invalidateQueries({ queryKey: ['transactions'] })
          qc.invalidateQueries({ queryKey: ['monthly-summary'] })
          qc.invalidateQueries({ queryKey: ['accounts'] })
        }
      )

      // Счета — чужие изменения балансов
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `family_id=eq.${family.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { owner_user_id?: string } | null
          if (row?.owner_user_id === userId) return

          qc.invalidateQueries({ queryKey: ['accounts'] })
        }
      )

      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [family?.id, userId, qc])
}
