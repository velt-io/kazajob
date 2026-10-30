import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'

const colorMap: Record<BadgeColor, string> = {
  orange: 'bg-[var(--kz-orange-soft)] text-[var(--kz-ink)]',
  violet: 'bg-[var(--kz-violet-soft)] text-[var(--kz-ink)]',
  blue:   'bg-[var(--kz-blue-soft)] text-[var(--kz-ink)]',
  green:  'bg-[var(--kz-green-soft)] text-[var(--kz-ink)]',
  yellow: 'bg-[var(--kz-yellow-soft)] text-[var(--kz-ink)]',
  ink:    'bg-[var(--kz-ink)] text-[var(--kz-cream)]',
  cream:  'bg-[var(--kz-cream2)] text-[var(--kz-ink)]',
  paper:  'bg-[var(--kz-paper)] text-[var(--kz-ink)]',
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
        'inline-flex items-center font-bold tracking-tight whitespace-nowrap rounded-full',
        colorMap[color],
        sizeMap[size],
        outline && 'border border-[var(--kz-edge)]',
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
