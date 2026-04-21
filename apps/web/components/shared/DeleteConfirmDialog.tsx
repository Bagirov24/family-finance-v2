'use client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Dialog heading — e.g. "Удалить транзакцию?" */
  title: string
  /** Body text — e.g. "Это действие нельзя отменить." */
  description: string
  /** Label for the confirm button. Defaults to "Удалить". */
  confirmLabel?: string
  /** Label for the cancel button. Defaults to "Отмена". */
  cancelLabel?: string
  /** Called when the user confirms. Must trigger the actual delete. */
  onConfirm: () => void
  /** Disables the confirm button while a mutation is in-flight. */
  isLoading?: boolean
}

/**
 * Shared destructive-action confirmation dialog.
 *
 * Usage:
 *   const [open, setOpen] = useState(false)
 *
 *   <button onClick={() => setOpen(true)}>Delete</button>
 *   <DeleteConfirmDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title={t('deleteTitle')}
 *     description={t('deleteDescription')}
 *     onConfirm={handleDelete}
 *     isLoading={isPending}
 *   />
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  onConfirm,
  isLoading = false,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
