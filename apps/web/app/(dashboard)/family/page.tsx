'use client'
import { useTranslations } from 'next-intl'
import { useFamily } from '@/hooks/useFamily'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, User, Copy, Check } from 'lucide-react'

export default function FamilyPage() {
  const t = useTranslations()
  const { family, members, isOwner, isLoading } = useFamily()
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const copyCode = () => {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLoading) return <p className="p-4 text-muted-foreground">{t('common.loading')}</p>

  return (
    <div className="p-4 space-y-5 max-w-xl mx-auto">
      <h1 className="text-xl font-bold">{t('family.title')}</h1>

      {/* Family card */}
      {family && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl p-5">
          <p className="text-indigo-200 text-xs mb-1">Семья</p>
          <h2 className="text-2xl font-bold">{family.name}</h2>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 bg-white/20 rounded-xl px-3 py-2">
              <p className="text-xs text-indigo-200 mb-0.5">{t('family.invite_code')}</p>
              <p className="font-mono font-bold tracking-wider">{family.invite_code}</p>
            </div>
            <button
              onClick={copyCode}
              className="bg-white/20 hover:bg-white/30 rounded-xl p-3 transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="bg-card border rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t('family.members')}</h2>
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <span className="text-lg">{m.avatar_emoji ?? '👤'}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">{m.display_name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.role === 'owner' ? t('family.owner') : t('family.member')}
                </p>
              </div>
              {m.role === 'owner' ? (
                <Crown className="w-4 h-4 text-yellow-500" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <Button variant="outline" className="w-full rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout}>
        {t('auth.logout')}
      </Button>
    </div>
  )
}
