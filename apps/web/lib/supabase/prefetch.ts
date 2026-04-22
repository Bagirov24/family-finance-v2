import { createClient } from './server'

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

  const accountsFilter = family?.id
    ? `family_id.eq.${family.id},owner_user_id.eq.${userId}`
    : `owner_user_id.eq.${userId}`

  const [accountsResult, summaryResult, categoriesResult] = await Promise.all([
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
  ])

  if (accountsResult.error)
    console.error('[prefetch] accounts error:', accountsResult.error)
  if (summaryResult.error)
    console.error('[prefetch] summary error:', summaryResult.error)
  if (categoriesResult.error)
    console.error('[prefetch] categories error:', categoriesResult.error)

  return {
    members: membersData ?? [],
    family,
    accounts: accountsResult.data ?? [],
    summary: summaryResult.data ?? null,
    categories: categoriesResult.data ?? [],
  }
}

// Alias used by overview/page.tsx
export const prefetchOverviewData = prefetchAppData
