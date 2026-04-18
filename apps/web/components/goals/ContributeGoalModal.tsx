'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useContributeGoal } from '@/hooks/useGoals'

interface Props {
  goalId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContributeGoalModal({ goalId, open, onOpenChange }: Props) {
  const t = useTranslations('goals')
  const tc = useTranslations('common')
  const contribute = useContributeGoal()
  const [amount, setAmount] = useState('')

  function handleClose(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) setAmount('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goalId || !amount) return

    try {
      await contribute.mutateAsync({ id: goalId, amount: parseFloat(amount) })
      toast.success(t('contributed'))
      handleClose(false)
    } catch {
      toast.error(tc('error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('contribute')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{tc('amount')}</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => handleClose(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={contribute.isPending || !goalId}>
              {contribute.isPending ? tc('loading') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
