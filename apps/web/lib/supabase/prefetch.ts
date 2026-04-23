import { createClient } from './server'

/** Matches the default `limit` prop of TransactionList on the overview page.
 *  Keeping both in sync prevents a React Query cache miss that causes a
 *  double-fetch immediately after hydration. */
export const PREFETCH_TX_LIMIT = 5

export async function prefetchAppData(userId: string) {
  const supabase = await createClient()

  const { data: membersData, error: membersError } = await supabase
    .from('family_members')
    .select('*, family:families(id, name, invite_code, currency)')
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
          .select('*, account:accounts(name, currency), category:categories(name, key, icon)')
          .eq('family_id', family.id)
          .gte('date', periodStart)
          .lt('date', periodEnd)
          .order('date', { ascending: false })
          .limit(PREFETCH_TX_LIMIT)   // ← was 30, now matches client TransactionList default
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

  return {
    members: membersData ?? [],
    family,
    accounts: accountsResult.data ?? [],
    summary: summaryResult.data ?? null,
    categories: categoriesResult.data ?? [],
    transactions: transactionsResult.data ?? [],
    month,
    year,
  }
}

// Alias used by overview/page.tsx
export const prefetchOverviewData = prefetchAppData
