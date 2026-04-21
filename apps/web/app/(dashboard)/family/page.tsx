'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useFamily } from '@/hooks/useFamily'
import { Skeleton } from '@/components/ui/skeleton'
import { Crown, User, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'
import { FamilySetup } from '@/components/family/FamilySetup'

export default function FamilyPage() {
  const t = useTranslations('family')
  const userId = useUIStore(s => s.userId)
  const { family, members, isLoading, invalidateMembers } = useFamily()
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    if (!family?.invite_code) return
    navigator.clipboard.writeText(family.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    )
  }

  if (!family) {
    return <FamilySetup onSuccess={invalidateMembers} />
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">{family.name}</h1>
        {family.invite_code && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('inviteCode')}:</span>
            <span className="font-mono text-sm font-bold tracking-widest bg-muted px-2 py-0.5 rounded">
              {family.invite_code}
            </span>
            <button
              onClick={copyCode}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={t('copyCode')}
            >
              {copied
                ? <Check size={14} className="text-green-500" />
                : <Copy size={14} />}
            </button>
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
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {m.avatar_url
                  ? <img src={m.avatar_url} className="h-10 w-10 object-cover" alt="" />
                  : <User size={20} className="text-muted-foreground" />}
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
