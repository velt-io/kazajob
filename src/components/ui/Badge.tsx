import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'

const colorMap: Record<BadgeColor, string> = {
  // Couleurs de rareté : texte lumineux sur fond teinté + liseré
  orange: 'bg-[rgba(251,146,60,0.14)] text-[#FDBA74] border-[#FB923C]/40',
  violet: 'bg-[rgba(168,85,247,0.16)] text-[#D8B4FE] border-[#A855F7]/45',
  blue:   'bg-[rgba(34,211,238,0.12)] text-[#67E8F9] border-[#22D3EE]/40',
  green:  'bg-[rgba(74,222,128,0.12)] text-[#86EFAC] border-[#4ADE80]/40',
  yellow: 'bg-[rgba(250,204,21,0.14)] text-[#FDE68A] border-[#FACC15]/45',
  ink:    'bg-[#F5EEFF] text-[#1A0B2E] border-transparent',
  cream:  'bg-[rgba(168,85,247,0.08)] text-[var(--kz-text)] border-[#C084FC]/25',
  paper:  'bg-[rgba(168,85,247,0.08)] text-[var(--kz-ink)] border-[#C084FC]/25',
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
        'inline-flex items-center font-bold uppercase tracking-[0.06em] whitespace-nowrap rounded-md',
        colorMap[color],
        sizeMap[size],
        outline && 'border',
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
