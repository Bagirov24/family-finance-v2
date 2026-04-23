import { useMemo } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCashbackCards } from '@/hooks/useCashback'

export interface CashbackCardStat {
  cardId: string
  cardName: string
  color: string | null
  bank: string
  /** Потенциальный кэшбэк за период, руб */
  earned: number
  /** Сумма расходов, по которым эта карта — лучшая */
  coveredExpenses: number
}

export interface CashbackStatsByCategory {
  categoryId: string
  categoryNameKey: string
  categoryIcon: string
  totalExpense: number
  bestCardName: string
  bestPercent: number
  earned: number
}

export function useCashbackStats() {
  const { transactions, isLoading: txLoading } = useTransactions({ type: 'expense' })
  const { cards, isLoading: cardsLoading, getBestCard } = useCashbackCards()

  const isLoading = txLoading || cardsLoading

  /**
   * По категориям: сколько потенциально заработано
   */
  const byCategory = useMemo((): CashbackStatsByCategory[] => {
    if (!transactions.length || !cards.length) return []

    // Группируем расходы по category_id
    const expenseByCategory = new Map<string, {
      nameKey: string
      icon: string
      total: number
    }>()

    for (const tx of transactions) {
      if (!tx.category_id || tx.type !== 'expense') continue
      const existing = expenseByCategory.get(tx.category_id)
      if (existing) {
        existing.total += Number(tx.amount)
      } else {
        expenseByCategory.set(tx.category_id, {
          nameKey: tx.category?.name_key ?? tx.category_id,
          icon: tx.category?.icon ?? '💰',
          total: Number(tx.amount),
        })
      }
    }

    const result: CashbackStatsByCategory[] = []

    for (const [categoryId, { nameKey, icon, total }] of expenseByCategory) {
      const best = getBestCard(categoryId)
      if (!best) continue

      result.push({
        categoryId,
        categoryNameKey: nameKey,
        categoryIcon: icon,
        totalExpense: total,
        bestCardName: best.cardName,
        bestPercent: best.percent,
        earned: (total * best.percent) / 100,
      })
    }

    return result.sort((a, b) => b.earned - a.earned)
  }, [transactions, cards, getBestCard])

  /**
   * По картам: агрегация earned + coveredExpenses
   */
  const byCard = useMemo((): CashbackCardStat[] => {
    if (!byCategory.length || !cards.length) return []

    const cardMap = new Map<string, CashbackCardStat>()

    for (const card of cards) {
      cardMap.set(card.name, {
        cardId: card.id,
        cardName: card.name,
        color: card.color,
        bank: card.bank,
        earned: 0,
        coveredExpenses: 0,
      })
    }

    for (const cat of byCategory) {
      const stat = cardMap.get(cat.bestCardName)
      if (stat) {
        stat.earned += cat.earned
        stat.coveredExpenses += cat.totalExpense
      }
    }

    return Array.from(cardMap.values())
      .filter(s => s.earned > 0)
      .sort((a, b) => b.earned - a.earned)
  }, [byCategory, cards])

  const totalEarned = useMemo(
    () => byCategory.reduce((sum, c) => sum + c.earned, 0),
    [byCategory]
  )

  return { byCategory, byCard, totalEarned, isLoading }
}
