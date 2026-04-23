'use client'
import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { TransferStatus } from '@/hooks/useTransfers'

export interface TransferFilters {
  memberId: string   // '' = все
  status:   string   // '' = все | TransferStatus
  dateFrom: string   // YYYY-MM-DD | ''
  dateTo:   string   // YYYY-MM-DD | ''
}

export const EMPTY_FILTERS: TransferFilters = {
  memberId: '',
  status:   '',
  dateFrom: '',
  dateTo:   '',
}

interface Member {
  user_id:      string
  display_name: string | null
}

interface Props {
  filters:   TransferFilters
  onChange:  (f: TransferFilters) => void
  members:   Member[]
  myUserId:  string
}

export function TransferHistoryFilters({ filters, onChange, members, myUserId }: Props) {
  const t  = useTranslations('transfers')
  const tc = useTranslations('common')

  const set = <K extends keyof TransferFilters>(key: K, val: TransferFilters[K]) =>
    onChange({ ...filters, [key]: val })

  const isDirty =
    filters.memberId !== '' ||
    filters.status   !== '' ||
    filters.dateFrom !== '' ||
    filters.dateTo   !== ''

  const STATUSES: { value: TransferStatus; label: string }[] = [
    { value: 'confirmed', label: t('confirmed') },
    { value: 'declined',  label: t('declined')  },
    { value: 'cancelled', label: t('cancelled') },
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* Участник */}
        <Select value={filters.memberId} onValueChange={v => set('memberId', v)}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder={t('filter_member')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{tc('all')}</SelectItem>
            {members
              .filter(m => m.user_id !== myUserId)
              .map(m => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.display_name ?? m.user_id}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Статус */}
        <Select value={filters.status} onValueChange={v => set('status', v)}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder={t('filter_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{tc('all')}</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Дата от */}
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={e => set('dateFrom', e.target.value)}
          className="h-8 text-xs w-36"
          aria-label={t('filter_date_from')}
        />

        {/* Дата до */}
        <Input
          type="date"
          value={filters.dateTo}
          onChange={e => set('dateTo', e.target.value)}
          className="h-8 text-xs w-36"
          aria-label={t('filter_date_to')}
        />

        {/* Сбросить */}
        {isDirty && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs gap-1"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <X size={12} />{t('filter_reset')}
          </Button>
        )}
      </div>
    </div>
  )
}
