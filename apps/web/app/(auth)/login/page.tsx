'use client'
import { useState, useId } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

// ---------------------------------------------------------------------------
// FloatingField — input с floating label + leading icon
// ---------------------------------------------------------------------------
interface FloatingFieldProps {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  icon: React.ReactNode
  required?: boolean
  suffix?: React.ReactNode
}

function FloatingField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  icon,
  required,
  suffix,
}: FloatingFieldProps) {
  const [focused, setFocused] = useState(false)
  const floated = focused || value.length > 0

  return (
    <div className="relative">
      {/* Leading icon */}
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      >
        {icon}
      </span>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        placeholder=" "
        className={[
          'peer w-full rounded-md border bg-background pb-2 pt-5 pl-10 text-sm outline-none',
          'transition-colors focus:border-primary focus:ring-1 focus:ring-primary',
          suffix ? 'pr-10' : 'pr-3',
          'border-input',
        ].join(' ')}
      />

      {/* Floating label */}
      <label
        htmlFor={id}
        className={[
          'pointer-events-none absolute left-10 transition-all duration-150 select-none',
          floated
            ? 'top-1.5 text-[10px] font-medium text-muted-foreground'
            : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground',
        ].join(' ')}
      >
        {label}
      </label>

      {/* Trailing slot (show/hide toggle) */}
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const router = useRouter()
  const emailId = useId()
  const passwordId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else if (mode === 'register') {
      toast.success('Проверьте email для подтверждения')
    } else {
      router.replace('/overview')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="text-4xl mb-2">💰</div>
          <h1 className="text-xl font-bold">FamilyFinance</h1>
          <p className="text-sm text-muted-foreground mt-1">Семейный финансовый трекер</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <FloatingField
            id={emailId}
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            icon={<Mail size={16} />}
          />

          <FloatingField
            id={passwordId}
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            icon={<Lock size={16} />}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {/* Forgot password — только в режиме входа */}
          {mode === 'login' && (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 hover:no-underline transition-colors"
              >
                Забыли пароль?
              </Link>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Загрузка…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            type="button"
            className="text-primary underline underline-offset-4 hover:no-underline transition-colors"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  )
}
