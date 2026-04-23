'use client'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { RefreshCw, Pause, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { useRecurringTransfers, type RecurringTransfer } from '@/hooks/useRecurringTransfers'

const RULE_LABELS: Record<string, string> = {
  daily:   'rule_daily',
  weekly:  'rule_weekly',
  monthly: 'rule_monthly',
}

interface Props {
  tpl: RecurringTransfer
  myUserId: string
}

export function RecurringTransferCard({ tpl, myUserId }: Props) {
  const t  = useTranslations('transfers')
  const tc = useTranslations('common')
  const { toggle, remove } = useRecurringTransfers()

  const isOwner = tpl.from_user_id === myUserId
  const toName  = tpl.to_member?.display_name ?? tpl.to_user_id
  const fromName = tpl.from_member?.display_name ?? tpl.from_user_id

  const label = isOwner
    ? t('recurring_to', { name: toName })
    : t('recurring_from', { name: fromName })

  async function handleToggle() {
    try {
      await toggle.mutateAsync({ id: tpl.id, is_active: !tpl.is_active })
    } catch {
      toast.error(tc('error'))
    }
  }

  async function handleDelete() {
    try {
      await remove.mutateAsync(tpl.id)
      toast.success(t('recurring_deleted'))
    } catch {
      toast.error(tc('error'))
    }
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-colors',
      !tpl.is_active && 'opacity-50',
    )}>
      {/* Иконка */}
      <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-violet-100 dark:bg-violet-950">
        <RefreshCw size={18} className="text-violet-600 dark:text-violet-400" />
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
            {t(RULE_LABELS[tpl.recurrence_rule])}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('next_run', { date: tpl.next_run_at })}
          </span>
        </div>
        {tpl.note && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">💬 {tpl.note}</p>
        )}
      </div>

      {/* Сумма */}
      <p className="text-sm font-semibold tabular-nums shrink-0 text-violet-600 dark:text-violet-400">
        {formatAmount(tpl.amount)}
      </p>

      {/* Действия (только владелец) */}
      {isOwner && (
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon" variant="ghost" className="h-8 w-8"
            disabled={toggle.isPending}
            onClick={handleToggle}
            title={tpl.is_active ? t('pause') : t('resume')}
          >
            {tpl.is_active
              ? <Pause size={14} />
              : <Play  size={14} />}
          </Button>
          <Button
            size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
            disabled={remove.isPending}
            onClick={handleDelete}
            title={tc('delete')}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
