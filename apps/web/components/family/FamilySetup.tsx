'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/store/ui.store'
import { Users, Plus, LogIn, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  onSuccess: () => void
}

export function FamilySetup({ onSuccess }: Props) {
  const t = useTranslations('family')
  const userId = useUIStore(s => s.userId)
  const [tab, setTab] = useState<'create' | 'join'>('create')

  const [familyName, setFamilyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  const supabase = createClient()

  async function handleCreate() {
    if (!familyName.trim() || !userId) return
    setCreating(true)
    setCreateError('')
    try {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase()
      const { data: family, error: fErr } = await supabase
        .from('families')
        .insert({ name: familyName.trim(), invite_code: code, currency: 'RUB' })
        .select()
        .single()
      if (fErr) throw fErr

      const { error: mErr } = await supabase
        .from('family_members')
        .insert({ family_id: family.id, user_id: userId, role: 'owner' })
      if (mErr) throw mErr

      onSuccess()
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : t('errorCreate'))
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim() || !userId) return
    setJoining(true)
    setJoinError('')
    try {
      const { data: family, error: fErr } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single()
      if (fErr || !family) throw new Error(t('invalidCode'))

      const { data: existing } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', family.id)
        .eq('user_id', userId)
        .maybeSingle()
      if (existing) throw new Error(t('alreadyMember'))

      const { error: mErr } = await supabase
        .from('family_members')
        .insert({ family_id: family.id, user_id: userId, role: 'member' })
      if (mErr) throw mErr

      onSuccess()
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : t('errorJoin'))
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Users size={28} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold">{t('setupTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('setupSubtitle')}</p>
      </div>

      <div className="flex rounded-xl border bg-muted p-1 gap-1">
        <button
          onClick={() => setTab('create')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors',
            tab === 'create'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Plus size={15} /> {t('createFamily')}
        </button>
        <button
          onClick={() => setTab('join')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors',
            tab === 'join'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <LogIn size={15} /> {t('joinFamily')}
        </button>
      </div>

      {tab === 'create' && (
        <div className="space-y-3">
          <Input
            placeholder={t('familyNamePlaceholder')}
            value={familyName}
            onChange={e => setFamilyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            disabled={creating}
          />
          {createError && <p className="text-xs text-destructive">{createError}</p>}
          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={creating || !familyName.trim()}
          >
            {creating && <Loader2 size={16} className="animate-spin mr-2" />}
            {t('createFamily')}
          </Button>
        </div>
      )}

      {tab === 'join' && (
        <div className="space-y-3">
          <Input
            placeholder={t('inviteCodePlaceholder')}
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            disabled={joining}
            className="font-mono tracking-widest uppercase"
            maxLength={6}
          />
          {joinError && <p className="text-xs text-destructive">{joinError}</p>}
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={joining || !inviteCode.trim()}
          >
            {joining && <Loader2 size={16} className="animate-spin mr-2" />}
            {t('joinFamily')}
          </Button>
        </div>
      )}
    </div>
  )
}
