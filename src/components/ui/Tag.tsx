import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TagColor = 'orange' | 'violet' | 'blue' | 'green' | 'yellow' | 'cream' | 'paper'

const colorMap: Record<TagColor, string> = {
  orange: 'bg-[rgba(251,146,60,0.12)] text-[#FDBA74]',
  violet: 'bg-[rgba(168,85,247,0.14)] text-[#D8B4FE]',
  blue:   'bg-[var(--kz-blue-soft)] text-[var(--kz-ink)]',
  green:  'bg-[var(--kz-green-soft)] text-[var(--kz-ink)]',
  yellow: 'bg-[var(--kz-yellow-soft)] text-[var(--kz-ink)]',
  cream:  'bg-[var(--kz-cream2)] text-[var(--kz-ink)]',
  paper:  'bg-[var(--kz-paper)] text-[var(--kz-ink)]',
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
        'inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border border-[#C084FC]/25 rounded-md whitespace-nowrap',
        colorMap[color],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
