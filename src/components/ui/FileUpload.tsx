'use client'

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Upload, Check, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KZ } from '@/lib/constants'
import { InlineLoader } from './LogoLoader'

interface FileUploadProps {
  accept?: string
  maxSizeMb?: number
  label?: string
  hint?: string
  uploading?: boolean
  progress?: number
  currentFileName?: string
  onFile: (file: File) => void
  className?: string
  variant?: 'default' | 'avatar'
}

export function FileUpload({
  accept = '*',
  maxSizeMb = 5,
  label,
  hint,
  uploading,
  progress,
  currentFileName,
  onFile,
  className,
  variant = 'default',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(!!currentFileName)

  const handleFile = (file: File) => {
    setError(null)
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Fichier trop lourd (max ${maxSizeMb} Mo)`)
      return
    }
    setDone(false)
    onFile(file)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // Marquer comme done quand upload terminé
  if (!uploading && progress === 100 && !done) setDone(true)

  if (variant === 'avatar') {
    return (
      <div className={cn('relative group cursor-pointer', className)} onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
        <div className="absolute inset-0 rounded-full bg-[var(--kz-inverse)]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <InlineLoader size={24} />
          ) : (
            <Upload size={20} className="text-white" />
          )}
        </div>
        {error && <p className="mt-2 text-xs text-red-600 text-center">{error}</p>}
      </div>
    )
  }

  return (
    <div className={className}>
      {label && <div className="text-xs font-semibold text-[var(--kz-text)] mb-1.5">{label}</div>}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-[1.5px] border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          dragging ? 'border-[var(--kz-orange)] bg-[var(--kz-orange-soft)]' : 'border-[var(--kz-edge)] hover:border-[var(--kz-orange)] hover:bg-[var(--kz-cream)]',
          uploading && 'pointer-events-none opacity-80',
          done && 'border-solid border-[var(--kz-green)] bg-[var(--kz-green-soft)]'
        )}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <InlineLoader size={40} />
            <div className="text-sm font-semibold text-[var(--kz-ink)]">Upload en cours...</div>
            {progress !== undefined && (
              <div className="w-full max-w-[200px] h-2 bg-[var(--kz-line)] rounded-full overflow-hidden border border-[var(--kz-edge)]">
                <div className="h-full bg-[var(--kz-orange)] transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--kz-green)] border border-[var(--kz-edge)] flex items-center justify-center">
              <Check size={20} className="text-white" />
            </div>
            <div className="text-sm font-bold text-[var(--kz-ink)]">
              {currentFileName ?? 'Fichier uploade avec succes'}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setDone(false); if (inputRef.current) inputRef.current.value = '' }}
              className="text-xs text-[var(--kz-mute)] hover:text-red-600 flex items-center gap-1"
            >
              <X size={11} /> Changer de fichier
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--kz-cream2)] border border-[var(--kz-edge)] flex items-center justify-center">
              <Upload size={20} className="text-[var(--kz-ink)]" />
            </div>
            <div className="text-sm font-bold text-[var(--kz-ink)]">
              Glisse ton fichier ici ou <span style={{ color: KZ.orange }}>parcourir</span>
            </div>
            {hint && <div className="text-xs text-[var(--kz-mute)]">{hint}</div>}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  )
}
