'use client'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { Category } from '@/hooks/useCategories'

/**
 * Сетка категорий 4×N вместо выпадающего списка.
 * Каждая категория — кнопка с иконкой + подписью, одно нажатие.
 */
interface CategoryPickerProps {
  categories: Category[]
  value: string
  onChange: (id: string) => void
  noLabel?: string
}

/** Вырезаем чистый ключ для next-intl: "categories.housing" → "housing" */
function toMessageKey(nameKey: string): string {
  return nameKey.includes('.') ? nameKey.split('.').pop()! : nameKey
}

export function CategoryPicker({ categories, value, onChange, noLabel }: CategoryPickerProps) {
  const tcat = useTranslations('categories')

  return (
    <div className="grid grid-cols-4 gap-2">
      {/* Кнопка «Без категории» */}
      {noLabel && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'flex flex-col items-center gap-1 rounded-xl p-2 border text-center transition-colors',
            value === ''
              ? 'border-primary bg-primary/10'
              : 'border-border hover:bg-accent'
          )}
        >
          <span className="text-xl leading-none">∅</span>
          <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">{noLabel}</span>
        </button>
      )}

      {categories.map(c => {
        const msgKey = toMessageKey(c.name_key)
        let label: string
        try {
          label = tcat(msgKey as Parameters<typeof tcat>[0])
          // если next-intl вернул ключ без ошибки — проверяем
          if (label === msgKey) label = c.name_key
        } catch {
          label = c.name_key
        }

        const isSelected = value === c.id

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(isSelected ? '' : c.id)}
            style={isSelected && c.color ? { borderColor: c.color, backgroundColor: `${c.color}18` } : undefined}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl p-2 border text-center transition-colors',
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-border hover:bg-accent'
            )}
          >
            <span className="text-xl leading-none">{c.icon}</span>
            <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
