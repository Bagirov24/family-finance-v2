'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'
import { useUpsertBudget } from '@/hooks/useBudgets'

export function UpsertBudgetModal() {
  const t = useTranslations('budgets')
  const tc = useTranslations('common')
  const tcat = useTranslations('categories')
  const [open, setOpen] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')

  // useCategories returns { categories, isLoading, ... } — not { data }
  const { categories = [] } = useCategories('expense')
  const upsertBudget = useUpsertBudget()

  function reset() {
    setCategoryId('')
    setAmount('')
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId || !amount) return
    try {
      await upsertBudget.mutateAsync({ category_id: categoryId, amount: parseFloat(amount) })
      toast.success(t('saved'))
      handleOpenChange(false)
    } catch {
      toast.error(tc('error'))
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={16} className="mr-1" />{t('add')}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('add')}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>{tc('category')}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder={tc('category')} /></SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {tcat(c.name_key as Parameters<typeof tcat>[0], { defaultValue: c.name_key })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
                {tc('cancel')}
              </Button>
              <Button type="submit" className="flex-1" disabled={upsertBudget.isPending}>
                {upsertBudget.isPending ? tc('loading') : tc('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
