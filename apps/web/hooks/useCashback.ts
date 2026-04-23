import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'

export interface CashbackCardCategory {
  card_id: string
  category_id: string
  cashback_percent: number
}

export interface CashbackCard {
  id: string
  family_id: string
  user_id: string
  name: string
  bank: string
  card_type: string
  color: string | null
  default_cashback_percent: number
  cashback_card_categories?: CashbackCardCategory[]
}

export interface UpdateCashbackCardPayload {
  name: string
  bank: string
  card_type: string
  color: string
  default_cashback_percent: number
}

export function useCashbackCards() {
  const queryClient = useQueryClient()
  const { family } = useFamily()
  const userId = useUIStore(s => s.userId)

  const query = useQuery({
    queryKey: ['cashback-cards', family?.id],
    enabled: !!family?.id,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async (): Promise<CashbackCard[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cashback_cards')
        .select('*, cashback_card_categories(card_id, category_id, cashback_percent)')
        .eq('family_id', family!.id)
        .order('created_at')

      if (error) throw error
      return (data ?? []) as CashbackCard[]
    },
  })

  /**
   * O(N) Map-индекс: категория → лучший процент среди всех карт.
   * Пересчитывается только при смене query.data.
   */
  const bestByCategory = useMemo(() => {
    const cards = query.data ?? []
    const map = new Map<string, { cardId: string; cardName: string; percent: number }>()

    for (const card of cards) {
      const cats = card.cashback_card_categories ?? []

      for (const cc of cats) {
        const prev = map.get(cc.category_id)
        if (!prev || cc.cashback_percent > prev.percent) {
          map.set(cc.category_id, { cardId: card.id, cardName: card.name, percent: cc.cashback_percent })
        }
      }

      const defKey = `__default__:${card.id}`
      map.set(defKey, { cardId: card.id, cardName: card.name, percent: card.default_cashback_percent })
    }

    return map
  }, [query.data])

  /**
   * O(1) lookup после построения индекса.
   * Для категорий без явной ставки берём карту с максимальным default.
   */
  const getBestCard = (categoryId: string) => {
    const explicit = bestByCategory.get(categoryId)
    if (explicit) return explicit

    const cards = query.data ?? []
    let best: { cardId: string; cardName: string; percent: number } | null = null
    for (const card of cards) {
      const hasCategoryRate = (card.cashback_card_categories ?? []).some(
        cc => cc.category_id === categoryId
      )
      if (!hasCategoryRate && (!best || card.default_cashback_percent > best.percent)) {
        best = { cardId: card.id, cardName: card.name, percent: card.default_cashback_percent }
      }
    }
    return best
  }

  const createCard = useMutation({
    mutationFn: async (payload: {
      name: string
      bank: string
      card_type: string
      color: string
      default_cashback_percent: number
    }): Promise<CashbackCard> => {
      if (!family?.id) throw new Error('Family is required')
      if (!userId) throw new Error('User is required')

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
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateCashbackCardPayload
    }): Promise<CashbackCard> => {
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
      const { error } = await supabase
        .from('cashback_cards')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  const upsertCategoryRate = useMutation({
    mutationFn: async (payload: {
      card_id: string
      category_id: string
      cashback_percent: number
    }): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from('cashback_card_categories')
        .upsert(payload, { onConflict: 'card_id,category_id' })

      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  const deleteCategoryRate = useMutation({
    mutationFn: async (payload: {
      card_id: string
      category_id: string
    }): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from('cashback_card_categories')
        .delete()
        .eq('card_id', payload.card_id)
        .eq('category_id', payload.category_id)

      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  return {
    cards: query.data ?? [],
    isLoading: query.isLoading,
    getBestCard,
    createCard,
    updateCard,
    deleteCard,
    upsertCategoryRate,
    deleteCategoryRate,
  }
}
