import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TagColor = 'orange' | 'violet' | 'blue' | 'green' | 'yellow' | 'cream' | 'paper'

// Thème OS 2027 : capsules teintées, sans contour.
const colorMap: Record<TagColor, string> = {
  orange: 'bg-[rgba(255,159,10,0.16)] text-[#FFB340]',
  violet: 'bg-[rgba(191,90,242,0.16)] text-[#DA8FFF]',
  blue:   'bg-[rgba(10,132,255,0.16)] text-[#409CFF]',
  green:  'bg-[rgba(48,209,88,0.16)] text-[#30DB5B]',
  yellow: 'bg-[rgba(255,214,10,0.16)] text-[#FFD426]',
  cream:  'bg-white/[0.07] text-[var(--kz-text)]',
  paper:  'bg-white/[0.07] text-[var(--kz-ink)]',
}

interface TagProps {
  children: ReactNode
  color?: TagColor
  icon?: ReactNode
  className?: string
}

export function Tag({ children, color = 'cream', icon, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap',
        colorMap[color],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
