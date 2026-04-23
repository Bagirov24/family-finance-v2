/**
 * useRealtimeSync — глобальная Realtime-подписка.
 *
 * Слушает INSERT/UPDATE/DELETE в таблицах:
 *   - transactions  (по family_id)
 *   - accounts      (по family_id)
 *   - member_transfers (входящие to_user_id === userId)
 *
 * Принцип: события, порождённые САМИМ пользователем, игнорируются —
 * их инвалидация уже выполнена через onSuccess мутации.
 * Это исключает двойной рефетч при собственных действиях.
 */
'use client'

import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'

export function useRealtimeSync(): void {
  const { family } = useFamily()
  const userId = useUIStore(s => s.userId)
  const qc = useQueryClient()

  // L-4: memoize the Supabase client so the same instance is reused across
  // renders. createClient() is cheap, but calling it on every render before
  // the useEffect dep-array fires creates a new object reference each time,
  // which would invalidate any code that compared clients by reference.
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!family?.id || !userId) return

    const channel = supabase
      .channel(`realtime-sync:${family.id}`)

      // Транзакции — чужие изменения в семье
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `family_id=eq.${family.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { user_id?: string } | null
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

      // Переводы — ВХОДЯЩИЕ события (to_user_id === me).
      // Исходящие не слушаем — onSuccess мутации уже вызвал invalidateQueries.
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_transfers',
          filter: `to_user_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['transfers'] })
          qc.invalidateQueries({ queryKey: ['accounts'] })
        }
      )

      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [family?.id, userId, qc, supabase])
}
