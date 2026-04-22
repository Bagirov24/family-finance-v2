import { createClient } from '@/lib/supabase/server'
import type { FamilyMember } from '@/hooks/useFamily'
import type { Account } from '@/hooks/useAccounts'
import type { Transaction } from '@/hooks/useTransactions'

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
  let transactions: Transaction[] = []

  if (family?.id) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = new Date(year, month, 0).toISOString().split('T')[0]

    // Шаг 2: один батчевый Promise.all — accounts + summary + транзакции текущего периода
    const [accountsResult, summaryResult, transactionsResult] = await Promise.all([
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
      // Префетч транзакций: устраняет клиентский waterfall для TransactionList и
      // useCategoryBreakdown — оба компонента получают данные без RTT через initialData
      supabase
        .from('transactions')
        .select('*, category:categories(name_key,icon,color), account:accounts(name,currency)')
        .eq('family_id', family.id)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30),
    ])

    if (!accountsResult.error) accounts = accountsResult.data as Account[]
    if (!summaryResult.error) summary = summaryResult.data?.[0] ?? null
    if (!transactionsResult.error) transactions = transactionsResult.data as Transaction[]
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

  return { members, family, accounts, summary, transactions, month, year }
}
