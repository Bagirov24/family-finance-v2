'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { EyeOff, Archive, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount } from '@/lib/formatters'
import { useUpdateAccount, useArchiveAccount } from '@/hooks/useAccounts'
import type { Account } from '@/hooks/useAccounts'

interface AccountCardProps {
  account: Account
}

export function AccountCard({ account }: AccountCardProps) {
  const t = useTranslations('accounts')
  const tc = useTranslations('common')
  const [menuOpen, setMenuOpen] = useState(false)

  const { mutate: updateAccount } = useUpdateAccount()
  const { mutate: archiveAccount } = useArchiveAccount()

  function toggleHidden() {
    updateAccount({ id: account.id, is_hidden_from_total: !account.is_hidden_from_total })
    setMenuOpen(false)
  }

  function handleArchive() {
    archiveAccount(account.id)
    setMenuOpen(false)
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-card p-4 flex flex-col gap-3 transition-opacity',
        account.is_hidden_from_total && 'opacity-60'
      )}
    >
      {/* Бейдж «скрыт из итога» */}
      {account.is_hidden_from_total && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          <EyeOff size={10} />
          {t('hiddenFromTotal')}
        </span>
      )}

      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: account.color ? `${account.color}22` : undefined }}
        >
          {account.icon ?? '💳'}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{account.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
        </div>
      </div>

      <p className="text-2xl font-bold tabular-nums">
        {formatAmount(account.balance, account.currency)}
      </p>

      {/* Меню действий */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <button
          onClick={toggleHidden}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <EyeOff size={13} />
          {account.is_hidden_from_total ? t('showInTotal') : t('hideFromTotal')}
        </button>
        <span className="text-border">·</span>
        <button
          onClick={handleArchive}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Archive size={13} />
          {tc('archive')}
        </button>
      </div>
    </div>
  )
}
