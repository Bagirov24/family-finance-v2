'use client'
import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface AvatarUploadProps {
  userId: string
  currentUrl?: string | null
  displayName?: string
  onUploaded: (url: string) => void
  size?: number
}

export function AvatarUpload({
  userId,
  currentUrl,
  displayName,
  onUploaded,
  size = 72,
}: AvatarUploadProps) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Превью до загрузки
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setError(null)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`

      // Удаляем старый аватар (upsert)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      // Получаем публичный URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = `${data.publicUrl}?t=${Date.now()}` // cache bust

      // Сохраняем в family_members
      const { error: dbError } = await supabase
        .from('family_members')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId)

      if (dbError) throw dbError

      setPreview(publicUrl)
      onUploaded(publicUrl)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      setPreview(currentUrl ?? null)
    } finally {
      setUploading(false)
      // Сбрасываем input чтобы можно загрузить то же фото ещё раз
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : null

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Upload avatar"
        className={cn(
          'relative rounded-full overflow-hidden bg-muted border-2 border-border',
          'hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          uploading && 'opacity-70 cursor-not-allowed'
        )}
        style={{ width: size, height: size }}
      >
        {/* Изображение или инициалы или иконка */}
        {preview ? (
          <Image
            src={preview}
            alt={displayName ?? 'Avatar'}
            fill
            className="object-cover"
            sizes={`${size}px`}
            unoptimized
          />
        ) : initials ? (
          <span
            className="absolute inset-0 flex items-center justify-center text-foreground font-semibold bg-primary/10"
            style={{ fontSize: size * 0.33 }}
          >
            {initials}
          </span>
        ) : (
          <User
            size={size * 0.44}
            className="absolute inset-0 m-auto text-muted-foreground"
          />
        )}

        {/* Overlay */}
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
          {uploading
            ? <Loader2 size={size * 0.3} className="text-white animate-spin" />
            : <Camera size={size * 0.3} className="text-white" />
          }
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {error && (
        <p className="text-xs text-destructive text-center max-w-[180px]">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        JPG, PNG, WebP • макс. 2 MB
      </p>
    </div>
  )
}
