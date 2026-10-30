'use client'

import { type ReactNode, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { ButtonKind, ButtonSize } from '@/lib/types'

// Thème OS 2027 : pilules, dégradé « aurora » pour l'action principale, verre pour le reste.
const kindStyles: Record<ButtonKind, string> = {
  primary: 'text-white border-transparent bg-[linear-gradient(120deg,#FF9F0A_0%,#FF375F_45%,#BF5AF2_100%)] bg-[length:160%_100%] bg-left hover:bg-right shadow-[0_8px_24px_-8px_rgba(255,55,95,0.6)] hover:shadow-[0_10px_32px_-6px_rgba(191,90,242,0.65)]',
  dark:    'bg-[#F5F5F7] text-black border-transparent hover:bg-white shadow-[0_8px_24px_-12px_rgba(255,255,255,0.5)]',
  violet:  'bg-[var(--kz-violet)] text-white border-transparent hover:brightness-110 shadow-[0_8px_24px_-10px_rgba(191,90,242,0.7)]',
  yellow:  'bg-[var(--kz-yellow)] text-black border-transparent hover:brightness-105',
  outline: 'bg-white/[0.06] text-[var(--kz-ink)] border-white/15 backdrop-blur-xl hover:bg-white/[0.12] hover:border-white/25',
  ghost:   'bg-transparent text-[var(--kz-ink)] border-transparent hover:bg-white/[0.08]',
  soft:    'bg-white/[0.08] text-[var(--kz-ink)] border-transparent hover:bg-white/[0.14]',
  danger:  'bg-[#FF453A] text-white border-transparent hover:brightness-110',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs h-8 gap-1.5',
  md: 'px-4 py-2 text-sm h-9 gap-2',
  lg: 'px-6 py-3 text-[15px] h-12 gap-2.5',
  xl: 'px-8 py-4 text-base h-14 gap-3',
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
        'inline-flex items-center justify-center font-semibold tracking-tight border rounded-full transition-all duration-300 ease-out cursor-pointer whitespace-nowrap select-none active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40',
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
