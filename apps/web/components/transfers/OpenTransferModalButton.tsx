'use client'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'

export function OpenTransferModalButton() {
  const t = useTranslations('transfers')
  const setAddTransferOpen = useUIStore(s => s.setAddTransferOpen)
  return (
    <Button size="sm" onClick={() => setAddTransferOpen(true)}>
      <Plus size={16} className="mr-1" />{t('send')}
    </Button>
  )
}
