'use client'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useTransfers } from '@/hooks/useTransfers'
import { formatAmount } from '@/lib/formatters'
import { ArrowRight } from 'lucide-react'

interface Member {
  user_id:      string
  display_name: string | null
}

interface Props {
  myUserId: string
  members:  Member[]
}

/**
 * Net-баланс между текущим пользователем и каждым членом семьи.
 * Считает только confirmed-переводы типа 'send' / 'recurring'.
 * Положительный net → другой пользователь должен МНЕ.
 * Отрицательный net → Я должен другому пользователю.
 */
export function FamilyDebtSummary({ myUserId, members }: Props) {
  const t = useTranslations('family')
  const { allTransfers } = useTransfers()

  // user_id → display_name
  const nameMap = useMemo(() => {
    const m = new Map<string, string>()
    members.forEach(mb => m.set(mb.user_id, mb.display_name ?? mb.user_id))
    return m
  }, [members])

  // net[otherId] = сколько другой должен МНЕ (< 0 → я должен ему)
  const netMap = useMemo(() => {
    const net = new Map<string, number>()

    allTransfers.forEach(tx => {
      if (tx.status !== 'confirmed') return
      if (tx.transfer_type !== 'send' && tx.transfer_type !== 'recurring') return

      const amt = Number(tx.amount)
      if (tx.from_user_id === myUserId) {
        // я отправил → я уменьшил долг перед to_user или увеличил его долг перед мной
        // фактически: to_user получил деньги от меня → он «должен» меньше или я теперь «в плюсе»
        // net с точки зрения «кто должен кому»:
        // подход: net[other] = сумма входящих от other − сумма исходящих к other
        net.set(tx.to_user_id, (net.get(tx.to_user_id) ?? 0) - amt)
      } else if (tx.to_user_id === myUserId) {
        net.set(tx.from_user_id, (net.get(tx.from_user_id) ?? 0) + amt)
      }
    })

    return net
  }, [allTransfers, myUserId])

  // Собираем только те пары, где |net| > 0
  const rows = useMemo(() => {
    const result: { userId: string; name: string; net: number }[] = []
    netMap.forEach((net, userId) => {
      if (Math.abs(net) < 0.01) return
      result.push({ userId, name: nameMap.get(userId) ?? userId, net })
    })
    // Сортируем: сначала «мне должны», потом «я должен», по убыванию |net|
    result.sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    return result
  }, [netMap, nameMap])

  if (rows.length === 0) return null

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        {t('debt_summary_title')}
      </h2>
      <div className="space-y-2">
        {rows.map(({ userId, name, net }) => {
          const iOwe    = net < 0   // я должен
          const absAmt  = Math.abs(net)

          return (
            <div
              key={userId}
              className="flex items-center gap-3 p-3 rounded-2xl border bg-card"
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                iOwe
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
              }`}>
                {name.slice(0, 1).toUpperCase()}
              </div>

              <p className="flex-1 text-sm">
                {iOwe ? (
                  <>
                    <span className="font-medium text-foreground">{t('debt_i_owe_prefix')} </span>
                    <span className="font-semibold">{name}</span>
                    <span className="text-muted-foreground"> {t('debt_i_owe_suffix')}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">{name}</span>
                    <span className="text-muted-foreground"> {t('debt_owes_me')}</span>
                  </>
                )}
              </p>

              <div className="flex items-center gap-1 shrink-0">
                {iOwe && <ArrowRight size={12} className="text-red-500" />}
                <span className={`text-sm font-semibold tabular-nums ${
                  iOwe ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {formatAmount(absAmt)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
