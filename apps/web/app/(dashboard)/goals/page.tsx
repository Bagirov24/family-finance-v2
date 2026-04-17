'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useGoals } from '@/hooks/useGoals'
import { GoalCard } from '@/components/goals/GoalCard'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function GoalsPage() {
  const t = useTranslations('goals')
  const { goals, isLoading, contribute } = useGoals()

  function handleContribute(id: string) {
    const amountStr = prompt(t('contributePrompt'))
    if (!amountStr) return
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) return
    contribute.mutate({ id, amount }, {
      onSuccess: () => toast.success(t('contributed')),
      onError: () => toast.error(t('error')),
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">{t('title')}</h1>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : !goals.length ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-4xl mb-3">🎯</p>
          <p>{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map(g => (
            <GoalCard
              key={g.id}
              goal={g as Parameters<typeof GoalCard>[0]['goal']}
              onContribute={handleContribute}
            />
          ))}
        </div>
      )}
    </div>
  )
}
