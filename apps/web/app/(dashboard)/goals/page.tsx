'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useGoals } from '@/hooks/useGoals'
import { useFamily } from '@/hooks/useFamily'
import { formatAmount, formatFullDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trophy } from 'lucide-react'

export default function GoalsPage() {
  const t = useTranslations()
  const { goals, isLoading, createGoal, contribute } = useGoals()
  const { family } = useFamily()
  const [open, setOpen] = useState(false)
  const [contribGoalId, setContribGoalId] = useState<string | null>(null)
  const [contribAmount, setContribAmount] = useState('')
  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '', auto_save_amount: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!family || !form.name || !form.target_amount) return
    await createGoal.mutateAsync({
      family_id: family.id,
      name: form.name,
      target_amount: parseFloat(form.target_amount),
      deadline: form.deadline || undefined,
      auto_save_amount: form.auto_save_amount ? parseFloat(form.auto_save_amount) : undefined
    })
    setOpen(false)
    setForm({ name: '', target_amount: '', deadline: '', auto_save_amount: '' })
  }

  const handleContrib = async () => {
    if (!contribGoalId || !contribAmount) return
    await contribute.mutateAsync({ id: contribGoalId, amount: parseFloat(contribAmount) })
    setContribGoalId(null)
    setContribAmount('')
  }

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('goals.title')}</h1>
        <Button size="sm" className="gap-1 rounded-xl" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />{t('goals.add')}
        </Button>
      </div>

      {isLoading && <p className="text-center text-muted-foreground">{t('common.loading')}</p>}

      <div className="space-y-4">
        {goals.map(g => (
          <div key={g.id} className={cn('bg-card border rounded-2xl p-4', g.completed && 'border-green-300 bg-green-50 dark:bg-green-950')}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  {g.completed && <Trophy className="w-4 h-4 text-yellow-500" />}
                  <h3 className="font-semibold">{g.name}</h3>
                </div>
                {g.deadline && (
                  <p className="text-xs text-muted-foreground mt-0.5">{t('goals.deadline')}: {formatFullDate(g.deadline)}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{g.percent}%</p>
              </div>
            </div>

            <div className="flex justify-between text-sm mb-2">
              <span>{formatAmount(Number(g.current_amount))}</span>
              <span className="text-muted-foreground">из {formatAmount(Number(g.target_amount))}</span>
            </div>
            <div className="h-2 bg-muted rounded-full mb-3">
              <div
                className={cn('h-full rounded-full transition-all', g.completed ? 'bg-green-500' : 'bg-primary')}
                style={{ width: `${g.percent}%` }}
              />
            </div>

            {g.monthsLeft && (
              <p className="text-xs text-muted-foreground mb-2">
                {t('goals.forecast')}: ещё ~{g.monthsLeft} мес. при {formatAmount(Number(g.auto_save_amount))}/мес.
              </p>
            )}

            {!g.completed && (
              <Button
                size="sm" variant="outline" className="w-full rounded-xl"
                onClick={() => setContribGoalId(g.id)}
              >
                Пополнить
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Create goal dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader><DialogTitle>{t('goals.add')}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1"><Label>Название</Label><Input className="rounded-xl" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="space-y-1"><Label>{t('goals.target')}</Label><Input type="number" className="rounded-xl" value={form.target_amount} onChange={e => set('target_amount', e.target.value)} /></div>
            <div className="space-y-1"><Label>{t('goals.deadline')}</Label><Input type="date" className="rounded-xl" value={form.deadline} onChange={e => set('deadline', e.target.value)} /></div>
            <div className="space-y-1"><Label>{t('goals.auto_save')} (в месяц)</Label><Input type="number" className="rounded-xl" value={form.auto_save_amount} onChange={e => set('auto_save_amount', e.target.value)} /></div>
            <Button className="w-full rounded-xl" disabled={createGoal.isPending} onClick={handleCreate}>{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contribute dialog */}
      <Dialog open={!!contribGoalId} onOpenChange={() => setContribGoalId(null)}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Пополнить цель</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1"><Label>{t('common.amount')}</Label><Input type="number" className="rounded-xl" value={contribAmount} onChange={e => setContribAmount(e.target.value)} /></div>
            <Button className="w-full rounded-xl" disabled={contribute.isPending} onClick={handleContrib}>{t('common.confirm')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
