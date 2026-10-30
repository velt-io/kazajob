import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  color?: string
  height?: number
  label?: string
  className?: string
}

export function Progress({ value, color = 'var(--kz-orange)', height = 12, label, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between text-xs font-semibold text-[var(--kz-text)] mb-1">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div
        className="w-full bg-[rgba(168,85,247,0.15)] border border-[#C084FC]/35 rounded-full overflow-hidden shadow-[0_0_14px_-4px_rgba(168,85,247,0.6)]"
        style={{ height }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            background: color,
            borderRight: clamped < 100 ? '1.5px solid var(--kz-edge)' : 'none',
          }}
        />
      </div>
    </div>
  )
}
