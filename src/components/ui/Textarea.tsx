'use client'

import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, error, className, id, ...props }, ref) {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-[var(--kz-text)] tracking-tight">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3.5 py-3 bg-[rgba(12,5,24,0.7)] border rounded-xl text-sm text-[var(--kz-text)] placeholder:text-[var(--kz-mute)] outline-none resize-none transition-all duration-200 focus:border-[#E879F9] focus:shadow-[0_0_0_4px_rgba(232,121,249,0.18),0_0_24px_-6px_rgba(232,121,249,0.8)]',
            error ? 'border-[#F87171]' : 'border-[#C084FC]/30',
            className
          )}
          {...props}
        />
        {(hint || error) && (
          <p className={cn('text-xs', error ? 'text-[#E54E4E]' : 'text-[var(--kz-mute)]')}>{error ?? hint}</p>
        )}
      </div>
    )
  }
)
