import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { subDays, format } from 'date-fns'

export interface SparklinePoint {
  date: string   // 'YYYY-MM-DD'
  value: number  // сумма расходов за день
}

async function fetchSparkline(
  userId: string,
  accountId: string
): Promise<SparklinePoint[]> {
  const supabase = createClient()
  const today = new Date()
  const from = format(subDays(today, 6), 'yyyy-MM-dd')
  const to = format(today, 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount')
    .eq('user_id', userId)
    .eq('account_id', accountId)
    .eq('type', 'expense')
    .gte('date', from)
    .lte('date', to)

  if (error) throw error

  // Строим массив из 7 дней, заполняя нулями дни без трат
  const map: Record<string, number> = {}
  for (const row of data ?? []) {
    map[row.date] = (map[row.date] ?? 0) + Number(row.amount)
  }

  return Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(today, 6 - i), 'yyyy-MM-dd')
    return { date, value: map[date] ?? 0 }
  })
}

export function useSparkline(accountId: string) {
  const { userId } = useUIStore()

  return useQuery({
    queryKey: ['sparkline', userId, accountId],
    queryFn: () => fetchSparkline(userId!, accountId),
    enabled: !!userId && !!accountId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
