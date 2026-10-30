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
        className="w-full bg-[var(--kz-cream2)] border border-[var(--kz-edge)] rounded-full overflow-hidden"
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
