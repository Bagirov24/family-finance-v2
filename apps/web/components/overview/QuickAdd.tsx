'use client'
import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Minus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { useFamily } from '@/hooks/useFamily'

/**
 * QuickAdd — inline одностроковая форма для быстрого добавления транзакции.
 * Раскрывается: сумма → счёт → категории → note → Submit.
 * Не открывает Sheet, всё в месте на странице.
 */
export function QuickAdd() {
  const t = useTranslations('quickAdd')
  const tc = useTranslations('common')
  const tt = useTranslations('transaction')

  const { family } = useFamily()
  const [expanded, setExpanded] = useState(false)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')

  const amountRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { accounts } = useAccounts()
  const { categories = [] } = useCategories(type)
  const { mutateAsync, isPending } = useCreateTransaction()

  // Авто-фокус на поле суммы при раскрытии
  useEffect(() => {
    if (expanded) {
      setTimeout(() => amountRef.current?.focus(), 50)
      // Авто-выбор первого счёта
      if (!accountId && accounts.length > 0) {
        setAccountId(accounts[0].id)
      }
    }
  }, [expanded, accounts, accountId])

  // Закрытие по клику вне компонента
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if (!isPending) handleReset()
      }
    }
    if (expanded) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [expanded, isPending])

  function handleReset() {
    setExpanded(false)
    setAmount('')
    setCategoryId('')
    setNote('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !accountId || !family?.id) return
    try {
      await mutateAsync({
        family_id: family.id,
        account_id: accountId,
        category_id: categoryId || undefined,
        amount: parseFloat(amount),
        type,
        date: new Date().toISOString().split('T')[0],
        note: note.trim() || undefined,
      })
      toast.success(type === 'income' ? tt('addedIncome') : tt('addedExpense'))
      handleReset()
    } catch {
      toast.error(tc('error'))
    }
  }

  // Collapsed state — одна кнопка
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border border-dashed border-border bg-card hover:bg-accent hover:border-primary/40 transition-colors text-muted-foreground text-sm"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
          <Plus size={14} strokeWidth={2.5} />
        </span>
        <span>{t('placeholder')}</span>
      </button>
    )
  }

  // Expanded state
  return (
    <div
      ref={wrapperRef}
      className="rounded-2xl border bg-card shadow-sm overflow-hidden"
    >
      <form onSubmit={handleSubmit}>
        {/* Строка 1: тип + сумма + счёт */}
        <div className="flex items-center gap-2 px-3 pt-3">
          {/* Тип: expense / income */}
          <div className="flex rounded-xl overflow-hidden border border-border shrink-0">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId('') }}
              className={cn(
                'px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
                type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              <Minus size={11} strokeWidth={3} />
              {tt('expense')}
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId('') }}
              className={cn(
                'px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1',
                type === 'income'
                  ? 'bg-green-500 text-white'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              <Plus size={11} strokeWidth={3} />
              {tt('income')}
            </button>
          </div>

          {/* Сумма */}
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            className="flex-1 min-w-0 bg-transparent text-lg font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40 text-foreground"
          />

          {/* Счёт */}
          {accounts.length > 1 && (
            <div className="relative shrink-0">
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
                className="appearance-none bg-accent/60 text-xs font-medium rounded-lg pl-2 pr-5 py-1.5 outline-none border-0 cursor-pointer text-foreground"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Строка 2: категории (горизонтальный скролл) */}
        <div className="flex gap-1.5 px-3 pt-2.5 overflow-x-auto no-scrollbar pb-0.5">
          {/* Без категории */}
          <button
            type="button"
            onClick={() => setCategoryId('')}
            className={cn(
              'shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border text-center transition-colors',
              categoryId === ''
                ? 'border-primary bg-primary/10'
                : 'border-border hover:bg-accent'
            )}
          >
            <span className="text-base leading-none">∅</span>
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">{tt('noCategory')}</span>
          </button>

          {categories.map(c => {
            const isSelected = categoryId === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(isSelected ? '' : c.id)}
                style={isSelected && c.color ? { borderColor: c.color, backgroundColor: `${c.color}18` } : undefined}
                className={cn(
                  'shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border text-center transition-colors',
                  isSelected && !c.color
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-accent'
                )}
              >
                <span className="text-base leading-none">{c.icon}</span>
                <span className="text-[9px] text-muted-foreground whitespace-nowrap max-w-[48px] truncate">{c.name_key.split('.').pop()}</span>
              </button>
            )
          })}
        </div>

        {/* Строка 3: note + кнопки */}
        <div className="flex items-center gap-2 px-3 pt-2 pb-3">
          <input
            type="text"
            placeholder={t('notePlaceholder')}
            value={note}
            onChange={e => setNote(e.target.value)}
            maxLength={120}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 text-foreground"
          />
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            {tc('cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending || !amount || !accountId}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary text-white disabled:opacity-50 transition-opacity hover:bg-primary/90"
          >
            {isPending ? '...' : tc('add')}
          </button>
        </div>
      </form>
    </div>
  )
}
