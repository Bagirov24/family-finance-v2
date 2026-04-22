import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useCashbackCards() {
  const queryClient = useQueryClient()
  const { family } = useFamily()
  const userId = useUIStore(s => s.userId)

  const query = useQuery({
    queryKey: ['cashback-cards', family?.id],
    enabled: !!family?.id,
    staleTime: 5 * 60_000,   // кешбэк-карты меняются редко
    gcTime: 15 * 60_000,
    queryFn: async () => {
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

  const getBestCard = (categoryId: string) => {
    const cards = query.data ?? []
    let best: { cardId: string; cardName: string; percent: number } | null = null

    for (const card of cards) {
      let matched = false

      for (const cc of card.cashback_card_categories ?? []) {
        if (cc.category_id === categoryId) {
          matched = true
          if (!best || cc.cashback_percent > best.percent) {
            best = { cardId: card.id, cardName: card.name, percent: cc.cashback_percent }
          }
        }
      }

      if (!matched && (!best || card.default_cashback_percent > best.percent)) {
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
    }) => {
      if (!family?.id) throw new Error('Family is required')
      if (!userId) throw new Error('User is required')

      const supabase = createClient()
      const { data, error } = await supabase
        .from('cashback_cards')
        .insert({
          family_id: family.id,
          user_id: userId,
          ...payload,
        })
        .select()
        .single()

      if (error) throw error
      return data as CashbackCard
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  const upsertCategoryRate = useMutation({
    mutationFn: async (payload: {
      card_id: string
      category_id: string
      cashback_percent: number
    }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('cashback_card_categories')
        .upsert(payload, { onConflict: 'card_id,category_id' })

      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards', family?.id] }),
  })

  return {
    cards: query.data ?? [],
    isLoading: query.isLoading,
    getBestCard,
    createCard,
    upsertCategoryRate,
  }
}
