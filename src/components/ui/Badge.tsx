import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'

// Thème OS 2027 : texte coloré sur fond teinté (style iOS), sans contour.
const colorMap: Record<BadgeColor, string> = {
  orange: 'bg-[rgba(255,159,10,0.16)] text-[#FFB340]',
  violet: 'bg-[rgba(191,90,242,0.16)] text-[#DA8FFF]',
  blue:   'bg-[rgba(10,132,255,0.16)] text-[#409CFF]',
  green:  'bg-[rgba(48,209,88,0.16)] text-[#30DB5B]',
  yellow: 'bg-[rgba(255,214,10,0.16)] text-[#FFD426]',
  ink:    'bg-white text-black',
  cream:  'bg-white/[0.08] text-[var(--kz-text)]',
  paper:  'bg-white/[0.08] text-[var(--kz-ink)]',
}

const sizeMap = {
  sm: 'px-2 py-0.5 text-[10px] h-5 gap-1',
  md: 'px-2.5 py-1 text-[11px] h-6 gap-1.5',
  lg: 'px-3 py-1.5 text-[13px] h-7 gap-1.5',
}

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  outline?: boolean
  className?: string
}

export function Badge({
  children,
  color = 'orange',
  size = 'md',
  icon,
  outline = true,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold tracking-tight whitespace-nowrap rounded-full backdrop-blur-md',
        colorMap[color],
        sizeMap[size],
        outline && 'border border-white/[0.06]',
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
