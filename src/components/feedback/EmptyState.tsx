import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[var(--kz-cream2)] border border-[var(--kz-edge)] flex items-center justify-center mb-4 text-[var(--kz-mute)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-[var(--kz-ink)] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--kz-mute)] max-w-sm leading-relaxed mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}
