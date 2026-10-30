'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { ButtonKind, ButtonSize } from '@/lib/types'

// Thème Quest : boutons « sort » néon, « légendaire » doré, panneaux arcanes.
const kindStyles: Record<ButtonKind, string> = {
  primary: 'text-white border-[#F0ABFC]/60 bg-[linear-gradient(120deg,#7C3AED_0%,#A855F7_45%,#E879F9_100%)] shadow-[0_0_22px_-4px_rgba(232,121,249,0.75),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_0_34px_-2px_rgba(232,121,249,0.95),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-0.5',
  dark:    'text-[#1A0B2E] border-[#FDE68A] bg-[linear-gradient(120deg,#FDE68A_0%,#FACC15_45%,#F59E0B_100%)] shadow-[0_0_22px_-4px_rgba(250,204,21,0.7),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_0_32px_-2px_rgba(250,204,21,0.9)] hover:-translate-y-0.5',
  violet:  'text-white border-[#C084FC]/60 bg-[#6D28D9] shadow-[0_0_20px_-6px_rgba(168,85,247,0.8)] hover:bg-[#7C3AED] hover:-translate-y-0.5',
  yellow:  'text-[#1A0B2E] border-[#FDE68A] bg-[#FACC15] shadow-[0_0_20px_-6px_rgba(250,204,21,0.8)] hover:brightness-110',
  outline: 'bg-[rgba(168,85,247,0.08)] text-[var(--kz-ink)] border-[#C084FC]/40 hover:bg-[rgba(168,85,247,0.16)] hover:border-[#E879F9]/70 hover:shadow-[0_0_18px_-6px_rgba(232,121,249,0.7)]',
  ghost:   'bg-transparent text-[var(--kz-ink)] border-transparent hover:bg-[rgba(168,85,247,0.12)]',
  soft:    'bg-[rgba(168,85,247,0.12)] text-[var(--kz-ink)] border-transparent hover:bg-[rgba(168,85,247,0.2)]',
  danger:  'bg-[#B91C1C] text-white border-[#F87171]/60 shadow-[0_0_18px_-6px_rgba(248,113,113,0.8)] hover:bg-[#DC2626]',
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
        'inline-flex items-center justify-center font-bold uppercase tracking-[0.08em] border rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap select-none active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/40',
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
