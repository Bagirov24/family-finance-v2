import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'

export type CashbackCategoryKey =
  | 'groceries'
  | 'restaurants'
  | 'transport'
  | 'fuel'
  | 'pharmacy'
  | 'online'
  | 'travel'
  | 'utilities'
  | 'entertainment'
  | 'other'

export type CashbackCategory = {
  id: string
  card_id: string
  category_key: CashbackCategoryKey
  percent: number
  monthly_limit_rub: number | null
  spent_this_month_rub: number | null
  period_month: number | null
  period_year: number | null
  valid_until: string | null
  created_at: string | null
}

export type CashbackCard = {
  id: string
  family_id: string
  // name, icon, account_id exist in the DB but are not yet reflected in the
  // generated supabase.ts types (types lag behind the actual schema).
  // Marked optional so the interface compiles against both the current
  // generated types and the real data shape from Supabase.
  name?: string | null
  card_name: string
  bank_name: string | null
  color: string | null
  icon?: string | null
  account_id?: string | null
  is_active: boolean
  cashback_type: 'rubles' | 'points' | 'miles'
  points_to_rubles_rate: number
  created_at: string | null
  cashback_categories: CashbackCategory[]
}

export type CreateCashbackCardInput = {
  name?: string
  card_name: string
  bank_name?: string
  color?: string
  icon?: string
  account_id?: string
  cashback_type?: 'rubles' | 'points' | 'miles'
  points_to_rubles_rate?: number
}

export type UpdateCashbackCardInput = {
  id: string
  payload: {
    card_name?: string
    bank_name?: string
    color?: string
    icon?: string
    cashback_type?: 'rubles' | 'points' | 'miles'
    points_to_rubles_rate?: number
  }
}

export type CreateCashbackCategoryInput = {
  card_id: string
  category_key: CashbackCategoryKey
  percent: number
  monthly_limit_rub?: number | null
  period_month?: number | null
  period_year?: number | null
  valid_until?: string | null
}

export type UpdateCashbackCategoryInput = {
  id: string
  percent?: number
  monthly_limit_rub?: number | null
  period_month?: number | null
  period_year?: number | null
  valid_until?: string | null
}

/**
 * Payload for upsertCategory — same shape as CreateCashbackCategoryInput.
 * Upserts on (card_id, category_key) conflict.
 */
export type UpsertCategoryPayload = CreateCashbackCategoryInput

/**
 * Returns true if the cashback category is currently active:
 * - No valid_until date set (permanent), OR
 * - valid_until is in the future (not yet expired)
 */
export function isCategoryActive(cat: Pick<CashbackCategory, 'valid_until'>): boolean {
  if (!cat.valid_until) return true
  return new Date(cat.valid_until) > new Date()
}

export function useCashbackCards() {
  const qc = useQueryClient()
  const { family } = useFamily()

  const query = useQuery<CashbackCard[]>({
    queryKey: ['cashback-cards', family?.id],
    enabled: !!family?.id,
    queryFn: async (): Promise<CashbackCard[]> => {
      if (!family?.id) throw new Error('[useCashbackCards] family.id is required')
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
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (error) throw error
      // Double cast required: generated supabase.ts types do not yet include
      // name/icon/account_id columns and Supabase infers cashback_categories
      // as SelectQueryError when the join column list differs from the schema.
      // Safe: runtime data shape matches CashbackCard.
      return (data ?? []) as unknown as CashbackCard[]
    }
  })

  const createCard = useMutation({
    mutationFn: async (input: CreateCashbackCardInput): Promise<void> => {
      if (!family?.id) throw new Error('[createCard] family.id is required')
      const supabase = createClient()
      // Base payload — all fields known to the generated supabase.ts schema.
      const basePayload = {
        family_id: family.id!,  // non-null: guarded by the throw above
        card_name: input.card_name,
        bank_name: input.bank_name ?? null,
        color: input.color ?? null,
        is_active: true,
        cashback_type: input.cashback_type ?? 'rubles',
        points_to_rubles_rate: input.points_to_rubles_rate ?? 1,
      }
      // name / icon / account_id exist in the DB but are absent from the
      // generated supabase.ts schema → cast to bypass RejectExcessProperties.
      const extraFields: Record<string, unknown> = {}
      if (input.name !== undefined) extraFields.name = input.name ?? input.card_name
      if (input.icon !== undefined) extraFields.icon = input.icon
      if (input.account_id !== undefined) extraFields.account_id = input.account_id

      const { error } = await supabase
        .from('cashback_cards')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({ ...basePayload, ...extraFields } as any)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashback-cards', family?.id] })
  })

  const updateCard = useMutation({
    mutationFn: async ({ id, payload }: UpdateCashbackCardInput): Promise<void> => {
      const supabase = createClient()
      // `name` is absent from the generated supabase.ts schema — omit it from
      // the typed .update() call to avoid RejectExcessProperties errors.
      // card_name is the canonical column; keep it as-is.
      const { error } = await supabase
        .from('cashback_cards')
        .update(payload)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashback-cards', family?.id] })
  })

  const archiveCard = useMutation({
    mutationFn: async (cardId: string): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from('cashback_cards')
        .update({ is_active: false })
        .eq('id', cardId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashback-cards', family?.id] })
  })

  const addCategory = useMutation({
    mutationFn: async (input: CreateCashbackCategoryInput): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.from('cashback_categories').insert({
        card_id: input.card_id,
        category_key: input.category_key,
        percent: input.percent,
        monthly_limit_rub: input.monthly_limit_rub ?? null,
        period_month: input.period_month ?? null,
        period_year: input.period_year ?? null,
        valid_until: input.valid_until ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashback-cards', family?.id] })
  })

  /**
   * upsertCategory — inserts or updates a category for a card.
   * Conflicts on (card_id, category_key) are resolved by updating all fields.
   */
  const upsertCategory = useMutation({
    mutationFn: async (input: UpsertCategoryPayload): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase.from('cashback_categories').upsert(
        {
          card_id: input.card_id,
          category_key: input.category_key,
          percent: input.percent,
          monthly_limit_rub: input.monthly_limit_rub ?? null,
          period_month: input.period_month ?? null,
          period_year: input.period_year ?? null,
          valid_until: input.valid_until ?? null,
        },
        { onConflict: 'card_id,category_key' }
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashback-cards', family?.id] })
  })

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...patch }: UpdateCashbackCategoryInput): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from('cashback_categories')
        .update(patch)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashback-cards', family?.id] })
  })

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string): Promise<void> => {
      const supabase = createClient()
      const { error } = await supabase
        .from('cashback_categories')
        .delete()
        .eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashback-cards', family?.id] })
  })

  return {
    cards: query.data ?? [],
    isLoading: query.isLoading,
    createCard,
    updateCard,
    archiveCard,
    addCategory,
    upsertCategory,
    updateCategory,
    deleteCategory,
  }
}
