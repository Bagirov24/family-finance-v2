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

  // Все три запроса параллельно
  const [membersResult, accountsResult] = await Promise.all([
    supabase
      .from('family_members')
      .select('*, family:families(id, name, invite_code, currency)')
      .eq('user_id', userId)
      .order('joined_at'),
    supabase
      .from('accounts')
      .select('*')
      .eq('is_archived', false)
      .eq('owner_user_id', userId)
      .order('created_at'),
  ])

  const members = (membersResult.data ?? []) as FamilyMember[]
  const family = members[0]?.family ?? null

  // Если семья есть — добираем семейные счета и summary параллельно
  let accounts = (accountsResult.data ?? []) as Account[]
  let summary: { total_income: number; total_expense: number; net: number; top_category: string } | null = null

  if (family?.id) {
    const [familyAccountsResult, summaryResult] = await Promise.all([
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

    if (!familyAccountsResult.error) accounts = familyAccountsResult.data as Account[]
    if (!summaryResult.error) summary = summaryResult.data?.[0] ?? null
  }

  return { members, family, accounts, summary, month, year }
}
