import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'

// ─── Типы, отражающие реальную схему БД ───────────────────────────────────────

export interface CashbackCategory {
  id: string
  card_id: string
  category_key: string
  percent: number
  monthly_limit_rub: number          // дефолт 3000 в БД
  spent_this_month_rub: number       // сколько уже использовано из лимита
  period_month: number               // 1–12
  period_year: number
  valid_until: string | null         // ISO date «YYYY-MM-DD» | null = бессрочно
  created_at: string
}

export interface CashbackCard {
  id: string
  family_id: string
  user_id: string
  bank_name: string
  card_name: string
  cashback_type: 'rubles' | 'points' | 'miles'
  points_to_rubles_rate: number
  color: string | null
  is_active: boolean
  created_at: string
  cashback_categories?: CashbackCategory[]
}

export interface UpsertCategoryPayload {
  card_id: string
  category_key: string
  percent: number
  monthly_limit_rub: number
  valid_until: string | null         // 'YYYY-MM-DD' | null
  period_month: number
  period_year: number
}

export interface CreateCardPayload {
  bank_name: string
  card_name: string
  cashback_type: 'rubles' | 'points' | 'miles'
  points_to_rubles_rate?: number
  color?: string
}

export interface UpdateCardPayload extends Partial<CreateCardPayload> {
  is_active?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Возвращает true, если ставка ещё действует на указанную дату */
export function isCategoryActive(cat: CashbackCategory, on = new Date()): boolean {
  if (!cat.valid_until) return true
  return new Date(cat.valid_until) >= on
}

// ─── Хук ──────────────────────────────────────────────────────────────────────

export function useCashbackCards() {
  const queryClient = useQueryClient()
  const { family } = useFamily()
  const userId = useUIStore(s => s.userId)
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // ── Query ──
  const query = useQuery({
    queryKey: ['cashback-cards', family?.id],
    enabled: !!family?.id,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async (): Promise<CashbackCard[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cashback_cards')
        .select(`
          *,
          cashback_categories (
            id, card_id, category_key, percent,
            monthly_limit_rub, spent_this_month_rub,
            period_month, period_year,
            valid_until, created_at
          )
        `)
        .eq('family_id', family!.id)
        .eq('is_active', true)
        .order('created_at')

      if (error) throw error
      return (data ?? []) as CashbackCard[]
    },
  })

  /**
   * Map: category_key → лучшая активная ставка среди всех карт
   * Учитывает:
   *   - valid_until (просроченные игнорируются)
   *   - остаток лимита (spent < limit)
   *   - points_to_rubles_rate для приведения к рублям
   */
  const bestByCategory = useMemo(() => {
    const cards = query.data ?? []
    const map = new Map<string, {
      cardId: string
      cardName: string
      percent: number
      effectivePercent: number   // с учётом points_to_rubles_rate
      monthlyLimitRub: number
      remainingLimitRub: number
      validUntil: string | null
    }>()

    for (const card of cards) {
      const cats = card.cashback_categories ?? []
      const rate = card.points_to_rubles_rate ?? 1

      for (const cat of cats) {
        // Пропускаем просроченные
        if (!isCategoryActive(cat)) continue
        // Пропускаем исчерпанные лимиты текущего месяца
        const isCurrentPeriod =
          cat.period_month === currentMonth && cat.period_year === currentYear
        const remaining = isCurrentPeriod
          ? cat.monthly_limit_rub - cat.spent_this_month_rub
          : cat.monthly_limit_rub
        if (remaining <= 0) continue

        const effectivePercent = cat.percent * rate
        const prev = map.get(cat.category_key)
        if (!prev || effectivePercent > prev.effectivePercent) {
          map.set(cat.category_key, {
            cardId: card.id,
            cardName: card.card_name,
            percent: cat.percent,
            effectivePercent,
            monthlyLimitRub: cat.monthly_limit_rub,
            remainingLimitRub: remaining,
            validUntil: cat.valid_until,
          })
        }
      }
    }

    return map
  }, [query.data, currentMonth, currentYear])

  /** O(1) lookup. Fallback на карту с максимальным базовым процентом не предусмотрен —
   *  базового кэшбека в новой схеме нет, только категорийные ставки. */
  const getBestCard = (categoryKey: string) => bestByCategory.get(categoryKey) ?? null

  // ── Mutations ──

  const createCard = useMutation({
    mutationFn: async (payload: CreateCardPayload): Promise<CashbackCard> => {
      if (!family?.id) throw new Error('Family required')
      if (!userId) throw new Error('User required')
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cashback_cards')
        .insert({ family_id: family.id, user_id: userId, ...payload })
        .select()
        .single()
      if (error) throw error
      return data as CashbackCard
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  const updateCard = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateCardPayload }): Promise<CashbackCard> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cashback_cards')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as CashbackCard
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  const deleteCard = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.from('cashback_cards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  /**
   * Upsert категорийной ставки.
   * Конфликт по (card_id, category_key, period_month, period_year) —
   * обновляем percent, monthly_limit_rub, valid_until.
   */
  const upsertCategory = useMutation({
    mutationFn: async (payload: UpsertCategoryPayload): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from('cashback_categories')
        .upsert(payload, {
          onConflict: 'card_id,category_key,period_month,period_year',
        })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  const deleteCategory = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.from('cashback_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  return {
    cards: query.data ?? [],
    isLoading: query.isLoading,
    getBestCard,
    bestByCategory,
    createCard,
    updateCard,
    deleteCard,
    upsertCategory,
    deleteCategory,
  }
}
