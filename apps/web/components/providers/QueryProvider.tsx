'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

let DevtoolsComponent: React.ComponentType<{ initialIsOpen: boolean }> | null = null
if (process.env.NODE_ENV === 'development') {
  // dynamic import only in dev — not bundled in production
  import('@tanstack/react-query-devtools')
    .then((m) => { DevtoolsComponent = m.ReactQueryDevtools })
    .catch(() => {})
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {DevtoolsComponent && <DevtoolsComponent initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
