'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, File, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/auth/mock-auth'

interface FileUploadProps {
  bucket: string
  path: string
  accept?: string
  maxSize?: number
  onUploadComplete: (url: string) => void
  className?: string
}

export function FileUpload({ bucket, path, accept = 'image/*', maxSize = 5 * 1024 * 1024, onUploadComplete, className }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = async (file: File) => {
    setError(null)

    if (file.size > maxSize) {
      setError(`File too large. Max size is ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    if (!file.type.startsWith('image/') && accept === 'image/*') {
      setError('Please upload an image file')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        onUploadComplete(objectUrl)
        setIsUploading(false)
      }, 500)
      return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${path}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      onUploadComplete(publicUrl)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 p-6 hover:border-zinc-400 transition-colors dark:border-zinc-800 dark:hover:border-zinc-500"
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-32 rounded-lg object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); setPreview(null) }}
              className="absolute -top-2 -right-2 rounded-full bg-zinc-900 p-0.5 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        ) : (
          <>
            <Upload className="h-8 w-8 text-zinc-400 mb-2" />
            <p className="text-sm text-zinc-500">Drop a file here or click to browse</p>
            <p className="text-xs text-zinc-400 mt-1">Max {Math.round(maxSize / 1024 / 1024)}MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
