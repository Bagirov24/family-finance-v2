'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useGoals } from '@/hooks/useGoals'
import { GoalCard } from '@/components/goals/GoalCard'
import { CreateGoalModal } from '@/components/goals/CreateGoalModal'
import { ContributeGoalModal } from '@/components/goals/ContributeGoalModal'
import { Skeleton } from '@/components/ui/skeleton'

export default function GoalsPage() {
  const t = useTranslations('goals')
  const { goals, isLoading } = useGoals()
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [contributeOpen, setContributeOpen] = useState(false)

  function handleContribute(id: string) {
    setSelectedGoalId(id)
    setContributeOpen(true)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <CreateGoalModal />
      </div>

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
            <GoalCard key={g.id} goal={g} onContribute={handleContribute} />
          ))}
        </div>
      )}

      <ContributeGoalModal
        goalId={selectedGoalId}
        open={contributeOpen}
        onOpenChange={setContributeOpen}
      />
    </div>
  )
}
