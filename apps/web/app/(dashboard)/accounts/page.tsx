'use client'
import { useTranslations } from 'next-intl'
import { useAccounts } from '@/hooks/useAccounts'
import { formatAmount } from '@/lib/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { CreditCard, PiggyBank, Wallet } from 'lucide-react'

const ICONS: Record<string, React.ReactNode> = {
  card: <CreditCard size={20} />,
  savings: <PiggyBank size={20} />,
  cash: <Wallet size={20} />,
}

export default function AccountsPage() {
  const t = useTranslations('accounts')
  const { accounts, totalBalance, isLoading } = useAccounts()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
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
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: acc.color ?? '#6366f1' }}
                >
                  {ICONS[acc.type] ?? <Wallet size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{acc.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{acc.type}</p>
                </div>
              </div>
              <p className={cn(
                'text-base font-bold tabular-nums',
                Number(acc.balance) < 0 && 'text-red-600'
              )}>
                {formatAmount(Number(acc.balance))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
