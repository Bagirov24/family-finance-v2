'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useCashbackCards } from '@/hooks/useCashback'
import { useCategories } from '@/hooks/useCategories'
import { useFamily } from '@/hooks/useFamily'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { CreditCard, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { AddCashbackCardModal } from '@/components/cashback/AddCashbackCardModal'
import { EditCashbackCardModal } from '@/components/cashback/EditCashbackCardModal'
import { CashbackReminderBanner } from '@/components/cashback/CashbackReminderBanner'
import { CategoryRateRow } from './_CategoryRateRow'
import { AddCategoryModal } from './_AddCategoryModal'
import { cn } from '@/lib/utils'

// Кол-во категорий в оптимизаторе (top-N по частоте трат)
const OPTIMIZER_TOP = 10

export default function CashbackPage() {
  const t = useTranslations('cashback')
  const tcat = useTranslations('categories')
  const { cards, isLoading, getBestCard, deleteCard } = useCashbackCards()
  const { categories } = useCategories()
  const { members } = useFamily()

  // Map userId → displayName для подписи владельца карты
  const memberNameById = useMemo(
    () => new Map(members.map(m => [m.user_id, m.display_name ?? ''])),
    [members]
  )

  // Раскрытая карта (id | null)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  // Модал добавления ставки (id карты | null)
  const [addCatForCard, setAddCatForCard] = useState<string | null>(null)

  // Индекс категорий для быстрого лукапа label/icon
  const catMeta = Object.fromEntries(
    (categories ?? []).map(c => [
      c.key,
      { label: tcat(c.key, { defaultValue: c.key }), icon: c.icon ?? '' },
    ])
  )

  const expenseCategories = (categories ?? []).filter(
    c => c.type === 'expense' || c.type === 'both'
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <AddCashbackCardModal />
      </div>

      <CashbackReminderBanner />

      {/* ── Мои карты ── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          {t('my_cards')}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
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
          <div className="space-y-4">
            {cards.map(card => {
              const isExpanded = expandedCard === card.id
              const cats = card.cashback_categories ?? []

              return (
                <div key={card.id} className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                  {/* Шапка карты */}
                  <div
                    className="p-4 text-white relative overflow-hidden"
                    style={{ backgroundColor: card.color ?? '#6366f1' }}
                  >
                    {/* Кнопки действий */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <EditCashbackCardModal card={card} />
                      <button
                        type="button"
                        className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity"
                        aria-label={t('delete_card')}
                        disabled={deleteCard.isPending}
                        onClick={() => {
                          if (confirm(t('delete_card_confirm'))) deleteCard.mutate(card.id)
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-xs opacity-80 mb-0.5">{card.bank_name}</p>
                    <p className="font-bold text-base">{card.card_name}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {t('card_type_label')}: {t(`cashback_type_${card.cashback_type}`)}
                      {card.cashback_type !== 'rubles' && card.points_to_rubles_rate !== 1 && (
                        <span className="ml-1 opacity-90">
                          ({card.points_to_rubles_rate} ₽/{t('point')})
                        </span>
                      )}
                    </p>

                    {/* Кнопка раскрытия категорий */}
                    <button
                      type="button"
                      onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                      className="mt-3 flex items-center gap-1 text-xs opacity-80 hover:opacity-100 transition-opacity"
                    >
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {t('category_rates_count', { count: cats.length })}
                    </button>

                    <CreditCard size={48} className="absolute -right-2 -bottom-3 opacity-10" />
                  </div>

                  {/* ── Ставки по категориям ── */}
                  {isExpanded && (
                    <div className="p-3 space-y-2 bg-muted/30">
                      {cats.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t('no_category_rates')}
                        </p>
                      ) : (
                        cats.map(cat => (
                          <CategoryRateRow
                            key={cat.id}
                            cat={cat}
                            categoryLabel={catMeta[cat.category_key]?.label ?? cat.category_key}
                            categoryIcon={catMeta[cat.category_key]?.icon ?? ''}
                          />
                        ))
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1 gap-1"
                        onClick={() => setAddCatForCard(card.id)}
                      >
                        <Plus size={13} />
                        {t('add_category_rate')}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Семейный оптимизатор ── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          {t('optimizer')}
        </h2>
        <div className="rounded-2xl border bg-card p-4 space-y-1">
          {expenseCategories.slice(0, OPTIMIZER_TOP).map(cat => {
            const best = getBestCard(cat.key)

            // Формируем подпись: «Карта мамы • 5%» или «Тинькофф Black • 5%» (fallback)
            let cardLabel = best?.cardName ?? ''
            if (best) {
              const ownerName = memberNameById.get(best.ownerUserId)
              if (ownerName) {
                cardLabel = t('owner_card_label', { owner: ownerName })
              }
            }

            return (
              <div
                key={cat.key}
                className="flex items-center justify-between py-1.5 gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-sm truncate">
                    {tcat(cat.key, { defaultValue: cat.key })}
                  </span>
                </div>

                {best ? (
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {cardLabel} • {best.percent}%
                    </span>
                    {best.validUntil && (
                      <p className="text-[10px] text-muted-foreground">
                        {t('until')} {new Date(best.validUntil).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                    {best.remainingLimitRub < best.monthlyLimitRub && (
                      <p className={cn(
                        'text-[10px]',
                        best.remainingLimitRub <= 0 ? 'text-destructive' : 'text-muted-foreground'
                      )}>
                        {t('limit_left')}: {best.remainingLimitRub.toLocaleString('ru-RU')} ₽
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground shrink-0">—</span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Модал добавления ставки */}
      {addCatForCard && (
        <AddCategoryModal
          cardId={addCatForCard}
          open={!!addCatForCard}
          onClose={() => setAddCatForCard(null)}
        />
      )}
    </div>
  )
}
