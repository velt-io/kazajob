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
            'flex items-center gap-2 h-11 px-3.5 bg-[var(--kz-paper)] border-[1.5px] rounded-lg shadow-[2px_2px_0_var(--kz-shadow)] transition-shadow',
            error ? 'border-[#E54E4E]' : 'border-[var(--kz-edge)]',
            'focus-within:shadow-[3px_3px_0_var(--kz-shadow)]'
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
