import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Sigil, toneStyle } from './QuestChrome'

const R = 30
const C = 2 * Math.PI * R

/**
 * Indicateur-trophée : un sceau au centre d'une jauge circulaire qui se remplit
 * à l'arrivée. Sans `ratio`, l'anneau reste un simple ornement (aucune fausse jauge).
 */
export function TrophyStat({ label, value, hint, icon, tone = 'var(--qx-neon)', ratio, delay = 0, className }: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: ReactNode
  tone?: string
  /** Part réelle (0–1) représentée par la jauge. */
  ratio?: number | null
  delay?: number
  className?: string
}) {
  const pct = typeof ratio === 'number' && Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : null
  return (
    <div className={cn('qx-panel p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 qx-rise', className)}
      style={toneStyle(tone, { animationDelay: `${delay}s` })}>
      <div className="relative w-[60px] h-[60px] sm:w-[76px] sm:h-[76px] shrink-0">
        <svg viewBox="0 0 76 76" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden>
          <circle cx="38" cy="38" r={R} fill="none" strokeWidth="5" className="qxr-ring-track" />
          {pct === null ? (
            <circle cx="38" cy="38" r={R + 5} fill="none" strokeWidth="1.5" className="qxr-ring-ornament" />
          ) : (
            <circle cx="38" cy="38" r={R} fill="none" strokeWidth="5" strokeLinecap="round" className="qxr-ring-fill"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
              style={{ ['--qxr-c' as string]: C, ['--qxr-delay' as string]: `${delay + 0.15}s` } as CSSProperties} />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sigil tone={tone} size="sm">{icon}</Sigil>
        </div>
      </div>
      <div className="min-w-0 w-full">
        <div className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.16em] font-bold text-[var(--kz-mute)] truncate">{label}</div>
        <div className="text-[24px] sm:text-[28px] font-extrabold leading-none qx-text-legend tabular-nums mt-1">{value}</div>
        {hint && <div className="text-[11px] text-[var(--kz-mute)] mt-1.5 leading-snug">{hint}</div>}
      </div>
    </div>
  )
}
