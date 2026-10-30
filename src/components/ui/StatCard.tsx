import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  icon?: ReactNode
  color?: string
  className?: string
}

export function StatCard({ label, value, delta, icon, color = 'var(--kz-violet-soft)', className }: StatCardProps) {
  const isPositive = delta?.startsWith('+')
  const isNegative = delta?.startsWith('-')

  return (
    <div
      className={cn('qx-panel p-4', className)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--kz-mute)]">
          {label}
        </div>
        {icon && (
          <div className="w-8 h-8 rounded-md rotate-45 border border-[#C084FC]/40 flex items-center justify-center text-[var(--kz-ink)] [&>svg]:-rotate-45" style={{ background: color }}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-[32px] font-extrabold leading-none qx-text-legend">
        {value}
      </div>
      {delta && (
        <div className={cn(
          'flex items-center gap-1 mt-1.5 text-xs font-semibold',
          isPositive && 'text-[#0E7C4A]',
          isNegative && 'text-[#B73838]',
          !isPositive && !isNegative && 'text-[var(--kz-mute)]'
        )}>
          {isPositive && <TrendingUp size={12} />}
          {isNegative && <TrendingDown size={12} />}
          {delta}
        </div>
      )}
    </div>
  )
}
