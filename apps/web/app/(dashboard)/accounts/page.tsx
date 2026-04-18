'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAccounts, useUpdateAccount, useArchiveAccount, Account } from '@/hooks/useAccounts'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Archive, Check, X } from 'lucide-react'
import { AddAccountModal } from '@/components/accounts/AddAccountModal'

export default function AccountsPage() {
  const t = useTranslations('accounts')
  const tc = useTranslations('common')
  const { accounts, totalBalance, isLoading } = useAccounts()
  const { mutateAsync: updateAccount, isPending: isUpdating } = useUpdateAccount()
  const { mutate: archiveAccount } = useArchiveAccount()

  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function startEdit(acc: Account) {
    setEditId(acc.id)
    setEditName(acc.name)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    try {
      await updateAccount({ id, name: editName.trim() })
      toast.success(tc('success'))
    } catch {
      toast.error(tc('error'))
    } finally {
      setEditId(null)
    }
  }

  function handleArchive(id: string) {
    archiveAccount(id, {
      onSuccess: () => toast.success(t('archived')),
      onError: () => toast.error(tc('error')),
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={16} className="mr-1" />{t('add')}
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-1">{t('totalBalance')}</p>
        <p className="text-3xl font-bold tabular-nums">{formatAmount(totalBalance)}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc.id} className="rounded-2xl border bg-card p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: acc.color ?? '#6366f1' }}
                >
                  <span>{acc.icon ?? '💳'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {editId === acc.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="h-7 text-sm py-0"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(acc.id)
                          if (e.key === 'Escape') setEditId(null)
                        }}
                      />
                      <button onClick={() => saveEdit(acc.id)} disabled={isUpdating}
                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="p-1 text-muted-foreground hover:text-foreground">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="font-semibold text-sm truncate">{acc.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground capitalize">{t(`types.${acc.type}`)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <p className={cn(
                  'text-base font-bold tabular-nums mr-2',
                  Number(acc.balance) < 0 && 'text-red-600'
                )}>
                  {formatAmount(Number(acc.balance))}
                </p>
                {editId !== acc.id && (
                  <>
                    <button
                      onClick={() => startEdit(acc)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Edit account"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleArchive(acc.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                      aria-label="Archive account"
                    >
                      <Archive size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddAccountModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
