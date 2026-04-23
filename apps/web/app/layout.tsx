import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Family Finance', template: '%s — Family Finance' },
  description: 'Семейный финансовый трекер',
}

/**
 * Blocking inline script — runs BEFORE React hydration and CSS paint.
 * This is the only reliable way to apply the saved theme without FOUC.
 * dangerouslySetInnerHTML is intentional and safe here (no user input).
 */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('ff-theme');
    var dark = t === 'dark' || (!t || t === 'system') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch(e){}
})();
`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Blocking theme script — must be first in <head> to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <ThemeProvider>
              {children}
              <Toaster richColors closeButton position="top-right" />
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
