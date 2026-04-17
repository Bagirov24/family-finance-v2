'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUIStore } from '@/store/ui.store'
import { useAccounts } from '@/hooks/useAccounts'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

export function TransferModal() {
  const { addTransferOpen, setAddTransferOpen, userId } = useUIStore()
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: accounts = [] } = useAccounts()
  const qc = useQueryClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromId || !toId || fromId === toId || !amount) return
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from('transfers').insert({
        user_id: userId,
        from_account_id: fromId,
        to_account_id: toId,
        amount: parseFloat(amount),
        date,
        comment: comment || null,
        status: 'pending',
      })
      if (error) throw error

      toast.success('Перевод создан')
      qc.invalidateQueries({ queryKey: ['transfers', userId] })
      qc.invalidateQueries({ queryKey: ['accounts', userId] })
      setAddTransferOpen(false)
      setAmount('')
      setComment('')
    } catch {
      toast.error('Ошибка при создании перевода')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={addTransferOpen} onOpenChange={setAddTransferOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Перевод между счетами</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Сумма</Label>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>С счёта</Label>
              <Select value={fromId} onValueChange={setFromId} required>
                <SelectTrigger><SelectValue placeholder="Откуда" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === toId}>
                      {a.emoji} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>На счёт</Label>
              <Select value={toId} onValueChange={setToId} required>
                <SelectTrigger><SelectValue placeholder="Куда" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id} disabled={a.id === fromId}>
                      {a.emoji} {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label>Комментарий</Label>
            <Input placeholder="Необязательно" value={comment} onChange={e => setComment(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAddTransferOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Отправка...' : 'Перевести'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
