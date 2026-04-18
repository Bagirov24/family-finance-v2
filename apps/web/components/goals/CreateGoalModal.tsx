'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateGoal } from '@/hooks/useGoals'

export function CreateGoalModal() {
  const t = useTranslations('goals')
  const tc = useTranslations('common')
  const createGoal = useCreateGoal()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [icon, setIcon] = useState('🎯')

  function reset() {
    setName('')
    setTargetAmount('')
    setCurrentAmount('')
    setDeadline('')
    setIcon('🎯')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !targetAmount) return

    try {
      await createGoal.mutateAsync({
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline: deadline || null,
        icon: icon || '🎯',
      })
      toast.success(t('created'))
      setOpen(false)
      reset()
    } catch {
      toast.error(tc('error'))
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={16} className="mr-1" />{t('add')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('add')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('name')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={t('name')} required autoFocus />
            </div>

            <div className="space-y-1.5">
              <Label>{t('icon')}</Label>
              <Input value={icon} onChange={e => setIcon(e.target.value)} placeholder="🎯" maxLength={2} />
            </div>

            <div className="space-y-1.5">
              <Label>{t('target')}</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('current')}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={currentAmount}
                onChange={e => setCurrentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('deadline')}</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button type="submit" className="flex-1" disabled={createGoal.isPending}>
                {createGoal.isPending ? tc('loading') : tc('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
