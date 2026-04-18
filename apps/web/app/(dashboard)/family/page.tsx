'use client'
import { useTranslations } from 'next-intl'
import { useFamily } from '@/hooks/useFamily'
import { Skeleton } from '@/components/ui/skeleton'
import { Crown, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'

export default function FamilyPage() {
  const t = useTranslations('family')
  const userId = useUIStore(s => s.userId)
  const { family, members, isOwner, isLoading } = useFamily()

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">{family?.name ?? t('myFamily')}</h1>
        {family?.invite_code && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('inviteCode')}:</span>
            <span className="font-mono text-sm font-bold tracking-widest bg-muted px-2 py-0.5 rounded">
              {family.invite_code}
            </span>
          </div>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{t('members')}</h2>
        <div className="space-y-2">
          {(members ?? []).map(m => (
            <div
              key={m.user_id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-2xl border bg-card',
                m.user_id === userId && 'border-primary/30 bg-primary/5'
              )}
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User size={20} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.display_name ?? m.user_id}
                  {m.user_id === userId && (
                    <span className="ml-2 text-xs text-muted-foreground">({t('you')})</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.role === 'owner' ? t('owner') : t('member')}
                </p>
              </div>
              {m.role === 'owner' && (
                <Crown size={16} className="text-yellow-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
