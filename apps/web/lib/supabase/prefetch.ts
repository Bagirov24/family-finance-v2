import { createClient } from './server'
import type { Account } from '@/hooks/useAccounts'
import type { FamilyMember } from '@/hooks/useFamily'
import type { Transaction } from '@/hooks/useTransactions'

/** Matches the default `limit` prop of TransactionList on the overview page.
 *  Keeping both in sync prevents a React Query cache miss that causes a
 *  double-fetch immediately after hydration. */
export const PREFETCH_TX_LIMIT = 5

export async function prefetchAppData(userId: string) {
  const supabase = await createClient()

  // created_at added to families select so the returned shape matches
  // FamilyMember.family = Database['public']['Tables']['families']['Row']
  const { data: membersData, error: membersError } = await supabase
    .from('family_members')
    .select('*, family:families(id, name, invite_code, currency, created_at)')
    .eq('user_id', userId)
    .order('joined_at')

  if (membersError) {
    console.error('[prefetch] members error:', membersError)
  }

  const family = membersData?.[0]?.family ?? null

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const periodEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const accountsFilter = family?.id
    ? `family_id.eq.${family.id},owner_user_id.eq.${userId}`
    : `owner_user_id.eq.${userId}`

  const [accountsResult, summaryResult, categoriesResult, transactionsResult] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('is_archived', false)
      .or(accountsFilter)
      .order('created_at'),

    family?.id
      ? supabase.rpc('get_monthly_summary', {
          p_family_id: family.id,
          p_month: month,
          p_year: year,
        })
      : Promise.resolve({ data: null, error: null }),

    supabase.from('categories').select('*').order('name'),

    family?.id
      ? supabase
          .from('transactions')
          // Must match Transaction.category shape: { name_key, icon, color }
          // and Transaction.account shape: { name, currency }
          .select('*, account:accounts(name, currency), category:categories(name_key,icon,color)')
          .eq('family_id', family.id)
          .gte('date', periodStart)
          .lt('date', periodEnd)
          .order('date', { ascending: false })
          .limit(PREFETCH_TX_LIMIT)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (accountsResult.error)
    console.error('[prefetch] accounts error:', accountsResult.error)
  if (summaryResult.error)
    console.error('[prefetch] summary error:', summaryResult.error)
  if (categoriesResult.error)
    console.error('[prefetch] categories error:', categoriesResult.error)
  if (transactionsResult.error)
    console.error('[prefetch] transactions error:', transactionsResult.error)

  // get_monthly_summary RPC returns an array — OverviewInitialData.summary expects
  // a single object or null, so we take the first element.
  const summaryRaw = summaryResult.data
  const summary = Array.isArray(summaryRaw) ? (summaryRaw[0] ?? null) : (summaryRaw ?? null)

  return {
    members: (membersData ?? []) as unknown as FamilyMember[],
    family,
    accounts: (accountsResult.data ?? []) as unknown as Account[],
    summary,
    categories: categoriesResult.data ?? [],
    transactions: (transactionsResult.data ?? []) as unknown as Transaction[],
    month,
    year,
  }
}

// Alias used by overview/page.tsx
export const prefetchOverviewData = prefetchAppData
