'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { ButtonKind, ButtonSize } from '@/lib/types'

const kindStyles: Record<ButtonKind, string> = {
  primary: 'bg-[var(--kz-orange)] text-[var(--kz-ink)] border-[var(--kz-edge)] shadow-[3px_3px_0_var(--kz-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--kz-shadow)]',
  dark:    'bg-[var(--kz-ink)] text-[var(--kz-cream)] border-[var(--kz-edge)] shadow-[3px_3px_0_var(--kz-orange)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--kz-orange)]',
  violet:  'bg-[var(--kz-violet)] text-white border-[var(--kz-edge)] shadow-[3px_3px_0_var(--kz-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--kz-shadow)]',
  yellow:  'bg-[var(--kz-yellow)] text-[var(--kz-ink)] border-[var(--kz-edge)] shadow-[3px_3px_0_var(--kz-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--kz-shadow)]',
  outline: 'bg-[var(--kz-paper)] text-[var(--kz-ink)] border-[var(--kz-edge)] shadow-[3px_3px_0_var(--kz-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--kz-shadow)]',
  ghost:   'bg-transparent text-[var(--kz-ink)] border-transparent shadow-none hover:bg-[var(--kz-cream2)] hover:text-black',
  soft:    'bg-[var(--kz-cream2)] text-[var(--kz-ink)] border-[var(--kz-line)] shadow-none hover:bg-[var(--kz-beige)]',
  danger:  'bg-[#E54E4E] text-white border-[var(--kz-edge)] shadow-[3px_3px_0_var(--kz-shadow)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--kz-shadow)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs h-8 gap-1.5',
  md: 'px-4 py-2 text-sm h-9 gap-2',
  lg: 'px-5 py-3 text-base h-12 gap-2.5',
  xl: 'px-7 py-4 text-lg h-14 gap-3',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind
  size?: ButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
  full?: boolean
  loading?: boolean
}

export function Button({
  children,
  kind = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold tracking-tight border-[1.5px] rounded-lg transition-all duration-100 cursor-pointer whitespace-nowrap select-none',
        kindStyles[kind],
        sizeStyles[size],
        full && 'w-full',
        (disabled || loading) && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {loading ? (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && <span className="inline-flex">{icon}</span>}
          {children}
          {iconRight && <span className="inline-flex">{iconRight}</span>}
        </>
      )}
    </button>
  )
}
