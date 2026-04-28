'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const router = useRouter()

  useEffect(() => {
    // Log to external error tracking (e.g. Sentry) in production
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-3xl" role="img" aria-label="error">
          ⚠️
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          Что-то пошло не так
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error.message
            ? error.message
            : 'Произошла непредвиденная ошибка. Попробуйте ещё раз.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Попробовать снова
        </button>
        <button
          onClick={() => router.push('/overview')}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          На главную
        </button>
      </div>
    </div>
  )
}
