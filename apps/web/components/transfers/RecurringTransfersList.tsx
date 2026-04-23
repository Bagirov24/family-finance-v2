'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { RefreshCw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRecurringTransfers } from '@/hooks/useRecurringTransfers'
import { useFamily } from '@/hooks/useFamily'
import { RecurringTransferCard } from './RecurringTransferCard'
import { RecurringTransferModal } from './RecurringTransferModal'

export function RecurringTransfersList() {
  const t = useTranslations('transfers')
  const { templates, isLoading } = useRecurringTransfers()
  const { currentUserId } = useFamily()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-violet-600 dark:text-violet-400" />
          <h3 className="text-sm font-semibold">{t('recurring_section_title')}</h3>
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setOpen(true)}>
          <Plus size={13} />
          {t('recurring_add')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <RefreshCw size={28} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('recurring_empty')}</p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            {t('recurring_add_first')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map(tpl => (
            <RecurringTransferCard
              key={tpl.id}
              tpl={tpl}
              myUserId={currentUserId ?? ''}
            />
          ))}
        </div>
      )}

      <RecurringTransferModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
