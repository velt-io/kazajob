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
            'h-11 px-3.5 bg-[var(--kz-paper)] border-[1.5px] rounded-lg shadow-[2px_2px_0_var(--kz-shadow)] text-sm text-[var(--kz-text)] outline-none appearance-none cursor-pointer',
            error ? 'border-[#E54E4E]' : 'border-[var(--kz-edge)]',
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
