'use client'
import { useTranslations } from 'next-intl'
import { useCashbackCards } from '@/hooks/useCashback'
import { useCategories } from '@/hooks/useCategories'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, Trash2 } from 'lucide-react'
import { AddCashbackCardModal } from '@/components/cashback/AddCashbackCardModal'
import { EditCashbackCardModal } from '@/components/cashback/EditCashbackCardModal'

export default function CashbackPage() {
  const t = useTranslations('cashback')
  const tcat = useTranslations('categories')
  const { cards, isLoading, getBestCard, deleteCard } = useCashbackCards()
  const { categories } = useCategories()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <AddCashbackCardModal />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          {t('my_cards')}
        </h2>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : !cards.length ? (
          <div className="py-12 text-center text-muted-foreground rounded-2xl border bg-card">
            <CreditCard size={36} className="mx-auto mb-3 opacity-30" />
            <p>{t('no_cards')}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map(card => (
              <div
                key={card.id}
                className="rounded-2xl p-4 text-white relative overflow-hidden shadow-md"
                style={{ backgroundColor: card.color ?? '#6366f1' }}
              >
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <EditCashbackCardModal card={card} />
                  <button
                    type="button"
                    className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
                    aria-label={t('delete_card')}
                    disabled={deleteCard.isPending}
                    onClick={() => {
                      if (confirm(t('delete_card_confirm'))) {
                        deleteCard.mutate(card.id)
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className="text-xs opacity-80 mb-1">{card.bank}</p>
                <p className="font-bold text-base">{card.name}</p>
                <p className="text-sm mt-1 opacity-90">
                  {t('card_type')}: {card.card_type}
                </p>
                <p className="text-sm mt-2 opacity-90">
                  {t('default_cashback')}: {card.default_cashback_percent}%
                </p>
                <CreditCard size={48} className="absolute -right-2 -bottom-3 opacity-10" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          {t('optimizer')}
        </h2>
        <div className="rounded-2xl border bg-card p-4 space-y-2">
          {(categories ?? [])
            .filter(c => c.type === 'expense' || c.type === 'both')
            .slice(0, 10)
            .map(cat => {
              const best = getBestCard(cat.id)
              return (
                <div key={cat.id} className="flex items-center justify-between py-1 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-sm truncate">
                      {tcat(cat.name_key, { defaultValue: cat.name_key })}
                    </span>
                  </div>
                  {best ? (
                    <span className="text-xs font-semibold text-primary shrink-0">
                      {best.cardName} • {best.percent}%
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground shrink-0">—</span>
                  )}
                </div>
              )
            })}
        </div>
      </section>
    </div>
  )
}
