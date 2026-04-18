'use client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpsertBudget, BudgetView } from '@/hooks/useBudgets'

interface Props {
  budget: BudgetView
  open: boolean
  onClose: () => void
}

export function EditBudgetModal({ budget, open, onClose }: Props) {
  const t = useTranslations('budgets')
  const tc = useTranslations('common')
  const tcat = useTranslations('categories')
  const [amount, setAmount] = useState('')
  const { mutateAsync, isPending } = useUpsertBudget()

  useEffect(() => {
    if (open) setAmount(String(budget.amount))
  }, [open, budget.amount])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !budget.category_id) return
    try {
      await mutateAsync({ category_id: budget.category_id, amount: parseFloat(amount) })
      toast.success(t('saved'))
      onClose()
    } catch {
      toast.error(tc('error'))
    }
  }

  const categoryLabel = budget.category
    ? tcat(budget.category.name_key as Parameters<typeof tcat>[0], { defaultValue: budget.category.name_key })
    : t('other')

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {budget.category?.icon} {categoryLabel}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t('limit')}</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="text-lg font-semibold tabular-nums"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? tc('loading') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
