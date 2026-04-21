'use client'
import { Bell, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useNotifications } from '@/hooks/useNotifications'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function NotificationsSheet({ open, onOpenChange }: Props) {
  const tn = useTranslations('notifications')
  const tc = useTranslations('common')
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {tn('title')}
              {unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-primary hover:underline shrink-0"
              >
                {tn('mark_all_read')}
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">{tc('empty')}</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 transition-colors',
                  !n.is_read ? 'bg-primary/5' : 'bg-card'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm', !n.is_read && 'font-medium')}>{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{n.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-accent transition-colors"
                    aria-label={tn('mark_read')}
                  >
                    <Check size={14} className="text-primary" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
