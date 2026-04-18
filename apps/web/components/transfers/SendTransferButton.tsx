'use client'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui.store'
import { ArrowRightLeft } from 'lucide-react'

export function SendTransferButton() {
  const t = useTranslations('transfers')
  const setAddTransferOpen = useUIStore(s => s.setAddTransferOpen)

  return (
    <Button size="sm" onClick={() => setAddTransferOpen(true)}>
      <ArrowRightLeft size={16} className="mr-1" />
      {t('send')}
    </Button>
  )
}
