import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const SUPPORTED_LOCALES = ['ru', 'en'] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]

function isValidLocale(v: unknown): v is Locale {
  return SUPPORTED_LOCALES.includes(v as Locale)
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('NEXT_LOCALE')?.value
  const locale: Locale = isValidLocale(raw) ? raw : 'ru'

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
