'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFamily } from '@/hooks/useFamily'
import { useUIStore } from '@/store/ui.store'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  User, Users, Settings2, LogOut, Copy, Check,
  Crown, Trash2, ChevronRight, Shield, Mail, KeyRound
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'family' | 'preferences' | 'account'

const CURRENCIES = ['RUB', 'USD', 'EUR', 'KZT', 'BYN', 'UAH']
const LOCALES = [{ value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' }]

function setLocaleCookie(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const router = useRouter()
  const supabase = createClient()
  const userId = useUIStore(s => s.userId)
  const { family, members, isOwner, isLoading, invalidateMembers } = useFamily()

  const [tab, setTab] = useState<Tab>('profile')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [familySaving, setFamilySaving] = useState(false)
  const [familySaved, setFamilySaved] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [deleteSaving, setDeleteSaving] = useState(false)

  const [copied, setCopied] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [currency, setCurrency] = useState('RUB')
  const [locale, setLocale] = useState('ru')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [localeSaved, setLocaleSaved] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)

  // AlertDialog state for kicking a member
  const [kickMemberId, setKickMemberId] = useState<string | null>(null)

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
    if (match) setLocale(match[1])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentEmail(data.user?.email ?? '')
    })
  }, [supabase])

  useEffect(() => {
    if (family) {
      setFamilyName(family.name ?? '')
      setCurrency(family.currency ?? 'RUB')
    }
  }, [family])

  useEffect(() => {
    const member = members.find(m => m.user_id === userId)
    if (member?.display_name) setDisplayName(member.display_name)
    if (member?.avatar_url != null) setAvatarUrl(member.avatar_url)
  }, [members, userId])

  async function saveProfile() {
    setProfileSaving(true)
    const { error } = await supabase
      .from('family_members')
      .update({ display_name: displayName })
      .eq('user_id', userId!)
    setProfileSaving(false)
    if (!error) {
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    }
  }

  async function saveFamily() {
    if (!family || !isOwner) return
    setFamilySaving(true)
    const { error } = await supabase
      .from('families')
      .update({ name: familyName, currency })
      .eq('id', family.id)
    setFamilySaving(false)
    if (!error) {
      setFamilySaved(true)
      setTimeout(() => setFamilySaved(false), 2000)
    }
  }

  async function confirmRemoveMember() {
    if (!kickMemberId || !isOwner || kickMemberId === userId) return
    await supabase.from('family_members').delete().eq('user_id', kickMemberId)
    invalidateMembers()
    setKickMemberId(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function handleEmailChange() {
    setAccountError(null)
    if (!newEmail.trim()) return
    setEmailSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setEmailSaving(false)
    if (error) { setAccountError(error.message); return }
    setEmailSaved(true)
    setTimeout(() => setEmailSaved(false), 2000)
    setNewEmail('')
  }

  async function handlePasswordChange() {
    setAccountError(null)
    if (newPassword.trim().length < 6) {
      setAccountError(t('newPasswordPlaceholder'))
      return
    }
    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) { setAccountError(error.message); return }
    setPasswordSaved(true)
    setTimeout(() => setPasswordSaved(false), 2000)
    setNewPassword('')
  }

  async function handleDeleteAccount() {
    setAccountError(null)
    if (deleteConfirmation !== 'DELETE') {
      setAccountError(t('invalidDeleteConfirmation'))
      return
    }
    if (userId) {
      setDeleteSaving(true)
      await supabase.from('family_members').delete().eq('user_id', userId)
      await supabase.auth.signOut()
      router.replace('/login')
    }
  }

  function copyInviteCode() {
    if (!family?.invite_code) return
    navigator.clipboard.writeText(family.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleLocaleChange(value: string) {
    setLocale(value)
    setLocaleCookie(value)
    setLocaleSaved(true)
    setTimeout(() => setLocaleSaved(false), 2000)
    router.refresh()
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: t('profile'), icon: <User size={16} /> },
    { id: 'family', label: t('family'), icon: <Users size={16} /> },
    { id: 'preferences', label: t('preferences'), icon: <Settings2 size={16} /> },
    { id: 'account', label: t('account'), icon: <Shield size={16} /> },
  ]

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24">
      <h1 className="text-xl font-bold">{t('title')}</h1>

      <div className="flex gap-1 bg-muted rounded-2xl p-1">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all',
              tab === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-4">
          <section className="bg-card border rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('profile')}</h2>
            {userId && (
              <div className="flex justify-center pt-1 pb-2">
                <AvatarUpload
                  userId={userId}
                  currentUrl={avatarUrl}
                  displayName={displayName}
                  onUploaded={(url) => setAvatarUrl(url)}
                  size={80}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('displayName')}</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {profileSaved
                ? <span className="flex items-center justify-center gap-1.5"><Check size={14} />{tc('success')}</span>
                : tc('save')}
            </button>
          </section>

          <section className="bg-card border rounded-2xl overflow-hidden">
            <button
              onClick={() => setConfirmLogout(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut size={16} />
              <span className="font-medium">{t('logout')}</span>
              <ChevronRight size={14} className="ml-auto" />
            </button>
            {confirmLogout && (
              <div className="px-4 pb-4 pt-1 space-y-2">
                <p className="text-xs text-muted-foreground">{t('logoutConfirm')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold"
                  >
                    {t('logout')}
                  </button>
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                  >
                    {tc('cancel')}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'family' && (
        <div className="space-y-4">
          {family?.invite_code && (
            <section className="bg-card border rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('inviteCode')}</h2>
              <div className="flex items-center gap-2">
                <span className="flex-1 font-mono text-lg font-bold tracking-widest bg-muted px-3 py-2 rounded-xl text-center">
                  {family.invite_code}
                </span>
                <button
                  onClick={copyInviteCode}
                  className="p-2.5 rounded-xl border bg-background hover:bg-muted transition-colors"
                  aria-label="Copy invite code"
                >
                  {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                </button>
              </div>
            </section>
          )}

          {isOwner && (
            <section className="bg-card border rounded-2xl p-4 space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('familyName')}</h2>
              <input
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={saveFamily}
                disabled={familySaving}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {familySaved
                  ? <span className="flex items-center justify-center gap-1.5"><Check size={14} />{tc('success')}</span>
                  : tc('save')}
              </button>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{t('members')}</h2>
            <div className="space-y-2">
              {members.map(m => (
                <div
                  key={m.user_id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-2xl border bg-card',
                    m.user_id === userId && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {m.avatar_url
                      ? <img src={m.avatar_url} alt={m.display_name ?? ''} className="w-full h-full object-cover" />
                      : <User size={16} className="text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.display_name ?? m.user_id.slice(0, 8)}
                      {m.user_id === userId && (
                        <span className="ml-1.5 text-xs text-muted-foreground">({t('you')})</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                  </div>
                  {m.role === 'owner'
                    ? <Crown size={15} className="text-yellow-500 shrink-0" />
                    : isOwner && m.user_id !== userId && (
                      <button
                        onClick={() => setKickMemberId(m.user_id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={t('removeMember')}
                      >
                        <Trash2 size={14} />
                      </button>
                    )
                  }
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'preferences' && (
        <div className="space-y-4">
          <section className="bg-card border rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('currency')}</h2>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    'py-2 rounded-xl border text-sm font-semibold transition-all',
                    currency === c
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            {isOwner && (
              <button
                onClick={saveFamily}
                disabled={familySaving}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {familySaved
                  ? <span className="flex items-center justify-center gap-1.5"><Check size={14} />{tc('success')}</span>
                  : tc('save')}
              </button>
            )}
          </section>

          <section className="bg-card border rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('language')}</h2>
            <div className="flex gap-2">
              {LOCALES.map(l => (
                <button
                  key={l.value}
                  onClick={() => handleLocaleChange(l.value)}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-sm font-semibold transition-all',
                    locale === l.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {localeSaved && (
              <p className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <Check size={12} /> {tc('success')}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t('languageNote')}</p>
          </section>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-4">
          <section className="bg-card border rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Mail size={14} /> {t('email')}
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('email')}</label>
              <input
                value={currentEmail}
                disabled
                className="w-full px-3 py-2 rounded-xl border bg-muted text-sm text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('newEmail')}</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder={t('newEmailPlaceholder')}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleEmailChange}
              disabled={emailSaving || !newEmail.trim()}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {emailSaved
                ? <span className="flex items-center justify-center gap-1.5"><Check size={14} />{t('emailUpdated')}</span>
                : t('changeEmail')}
            </button>
            <p className="text-xs text-muted-foreground">{t('emailChangeHint')}</p>
          </section>

          <section className="bg-card border rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <KeyRound size={14} /> {t('password')}
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={passwordSaving || newPassword.trim().length < 6}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {passwordSaved
                ? <span className="flex items-center justify-center gap-1.5"><Check size={14} />{t('passwordUpdated')}</span>
                : t('changePassword')}
            </button>
            <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
          </section>

          <section className="bg-card border border-destructive/30 rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">{t('deleteAccount')}</h2>
            <p className="text-sm text-muted-foreground">{t('deleteAccountWarning')}</p>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('deleteAccountConfirmLabel')}</label>
              <input
                value={deleteConfirmation}
                onChange={e => setDeleteConfirmation(e.target.value)}
                placeholder={t('deleteAccountConfirmPlaceholder')}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteSaving}
              className="w-full py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {t('deleteAccountAction')}
            </button>
          </section>

          {accountError && (
            <p className="text-sm text-destructive">{accountError}</p>
          )}
        </div>
      )}

      {/* AlertDialog: kick member confirmation */}
      <AlertDialog open={!!kickMemberId} onOpenChange={open => { if (!open) setKickMemberId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeMemberTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('removeMemberDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmRemoveMember}
            >
              {t('removeMember')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
