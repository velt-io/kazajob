'use client'

import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, hint, error, options, placeholder, className, id, ...props }, ref) {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[var(--kz-text)] tracking-tight">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-11 px-3.5 bg-white/[0.06] border rounded-xl text-sm text-[var(--kz-text)] outline-none appearance-none cursor-pointer transition-all focus:border-[#0A84FF] focus:ring-4 focus:ring-[#0A84FF]/25 [&>option]:bg-[#1C1C22]',
            error ? 'border-[#FF453A]' : 'border-white/10',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(hint || error) && (
          <p className={cn('text-xs', error ? 'text-[#E54E4E]' : 'text-[var(--kz-mute)]')}>{error ?? hint}</p>
        )}
      </div>
    )
  }
)
