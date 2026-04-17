'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function RegisterPage() {
  const t = useTranslations()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ name: '', email: '', password: '', familyName: '', inviteCode: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleRegister = async (e: React.FormEvent, mode: 'create' | 'join') => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { display_name: form.name } }
    })
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Error')
      setLoading(false)
      return
    }

    if (mode === 'create') {
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: form.familyName })
        .select().single()
      if (familyError || !family) {
        setError(familyError?.message ?? 'Family error')
        setLoading(false)
        return
      }
      await supabase.from('family_members').insert({
        family_id: family.id,
        user_id: data.user.id,
        role: 'owner',
        display_name: form.name
      })
    } else {
      const { data: family, error: findError } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', form.inviteCode.trim())
        .single()
      if (findError || !family) {
        setError('Неверный код приглашения')
        setLoading(false)
        return
      }
      await supabase.from('family_members').insert({
        family_id: family.id,
        user_id: data.user.id,
        role: 'member',
        display_name: form.name
      })
    }

    router.push('/overview')
    router.refresh()
  }

  const Field = ({ id, label, type = 'text', value, onChange, placeholder }: {
    id: string; label: string; type?: string;
    value: string; onChange: (v: string) => void; placeholder?: string
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} required
        onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )

  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <CardTitle className="text-center">{t('auth.register')}</CardTitle>
      </CardHeader>
      <Tabs defaultValue="create">
        <TabsList className="w-full mx-4" style={{ width: 'calc(100% - 2rem)' }}>
          <TabsTrigger value="create" className="flex-1">Создать семью</TabsTrigger>
          <TabsTrigger value="join" className="flex-1">Вступить по коду</TabsTrigger>
        </TabsList>

        {(['create', 'join'] as const).map(mode => (
          <TabsContent key={mode} value={mode}>
            <form onSubmit={e => handleRegister(e, mode)}>
              <CardContent className="space-y-4 pt-4">
                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</div>}
                <Field id="name" label={t('auth.name')} value={form.name} onChange={v => set('name', v)} />
                <Field id="email" label={t('auth.email')} type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com" />
                <Field id="password" label={t('auth.password')} type="password" value={form.password} onChange={v => set('password', v)} placeholder="••••••••" />
                {mode === 'create'
                  ? <Field id="familyName" label="Название семьи" value={form.familyName} onChange={v => set('familyName', v)} placeholder="Например: Семья Ивановых" />
                  : <Field id="inviteCode" label={t('family.invite_code')} value={form.inviteCode} onChange={v => set('inviteCode', v)} placeholder="abc12345" />
                }
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('common.loading') : t('auth.register')}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {t('auth.have_account')}{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">{t('auth.login')}</Link>
                </p>
              </CardFooter>
            </form>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  )
}
