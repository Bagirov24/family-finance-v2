import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function useCashbackCards() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['cashback-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cashback_cards')
        .select('*, cashback_card_categories(*)')
        .order('created_at')
      if (error) throw error
      return data
    },
  })

  // Find best card for a given category
  const getBestCard = (categoryId: string) => {
    const cards = query.data ?? []
    let best: { cardName: string; percent: number } | null = null
    for (const card of cards) {
      for (const cc of card.cashback_card_categories ?? []) {
        if (cc.category_id === categoryId && (!best || cc.cashback_percent > best.percent)) {
          best = { cardName: card.name, percent: cc.cashback_percent }
        }
      }
    }
    return best
  }

  const createCard = useMutation({
    mutationFn: async (payload: {
      family_id: string; user_id: string; name: string;
      bank: string; card_type: string; color: string;
      default_cashback_percent: number
    }) => {
      const { error } = await supabase.from('cashback_cards').insert(payload)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards'] }),
  })

  const upsertCategoryRate = useMutation({
    mutationFn: async (payload: {
      card_id: string; category_id: string; cashback_percent: number
    }) => {
      const { error } = await supabase
        .from('cashback_card_categories')
        .upsert(payload, { onConflict: 'card_id,category_id' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashback-cards'] }),
  })

  return { cards: query.data ?? [], isLoading: query.isLoading, getBestCard, createCard, upsertCategoryRate }
}
