import { createClient } from '@/lib/supabase/server'
import type { FamilyMember } from '@/hooks/useFamily'
import type { Account } from '@/hooks/useAccounts'

/**
 * Серверный prefetch данных для /overview.
 * Вызывается в Server Component, результат передаётся как initialData
 * в React Query — клиент получает данные без единого дополнительного запроса.
 */
export async function prefetchOverviewData(userId: string) {
  const supabase = await createClient()

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Шаг 1: получаем members (нужен family.id для остальных запросов)
  const { data: membersData } = await supabase
    .from('family_members')
    .select('*, family:families(id, name, invite_code, currency)')
    .eq('user_id', userId)
    .order('joined_at')

  const members = (membersData ?? []) as FamilyMember[]
  const family = members[0]?.family ?? null

  let accounts: Account[] = []
  let summary: { total_income: number; total_expense: number; net: number; top_category: string } | null = null

  if (family?.id) {
    // Шаг 2: один батчевый Promise.all — accounts сразу с семейным фильтром + summary
    const [accountsResult, summaryResult] = await Promise.all([
      supabase
        .from('accounts')
        .select('*')
        .eq('is_archived', false)
        .or(`family_id.eq.${family.id},owner_user_id.eq.${userId}`)
        .order('created_at'),
      supabase.rpc('get_monthly_summary', {
        p_family_id: family.id,
        p_month: month,
        p_year: year,
      }),
    ])

    if (!accountsResult.error) accounts = accountsResult.data as Account[]
    if (!summaryResult.error) summary = summaryResult.data?.[0] ?? null
  } else {
    // Нет семьи — берём только личные счета
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_archived', false)
      .eq('owner_user_id', userId)
      .order('created_at')
    accounts = (data ?? []) as Account[]
  }

  return { members, family, accounts, summary, month, year }
}
