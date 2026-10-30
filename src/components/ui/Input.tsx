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
            className="text-xs font-medium text-[var(--kz-mute)] tracking-tight"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex items-center gap-2 h-11 px-3.5 bg-white/[0.06] border rounded-xl transition-all duration-200 hover:bg-white/[0.08]',
            error ? 'border-[#FF453A]' : 'border-white/10',
            'focus-within:border-[#0A84FF] focus-within:ring-4 focus-within:ring-[#0A84FF]/25 focus-within:bg-white/[0.08]'
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
