'use client'

import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  suffix?: ReactNode
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, icon, suffix, hint, error, className, id, ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-[var(--kz-text)] tracking-tight"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex items-center gap-2 h-11 px-3.5 bg-[rgba(12,5,24,0.7)] border rounded-xl transition-all duration-200',
            error ? 'border-[#F87171]' : 'border-[#C084FC]/30',
            'focus-within:border-[#E879F9] focus-within:shadow-[0_0_0_4px_rgba(232,121,249,0.18),0_0_24px_-6px_rgba(232,121,249,0.8)]'
          )}
        >
          {icon && <span className="inline-flex text-[var(--kz-mute)] shrink-0">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex-1 bg-transparent text-sm text-[var(--kz-text)] placeholder:text-[var(--kz-mute)] outline-none min-w-0',
              className
            )}
            {...props}
          />
          {suffix && <span className="inline-flex text-[var(--kz-mute)] shrink-0">{suffix}</span>}
        </div>
        {(hint || error) && (
          <p className={cn('text-xs', error ? 'text-[#E54E4E]' : 'text-[var(--kz-mute)]')}>
            {error ?? hint}
          </p>
        )}
      </div>
    )
  }
)
