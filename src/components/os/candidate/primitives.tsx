'use client'
/**
 * Briques de présentation de l'espace candidat (thème OS 2027).
 * Purement visuelles : aucune donnée, aucun appel réseau.
 */
import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Grand titre (façon « Large Title » iOS) ───────────────────
export function LargeTitle({ eyebrow, title, accent, subtitle, actions, className }: {
  eyebrow?: ReactNode
  title: ReactNode
  /** Partie du titre en dégradé « aurora » (affichée après le titre). */
  accent?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--kz-mute)]">{eyebrow}</p>
        )}
        <h1 className="text-[34px] sm:text-[44px] lg:text-[52px] font-semibold tracking-[-0.05em] leading-[1.02] text-[var(--kz-ink)] mt-1">
          {title}{accent && <> <span className="os-text-aurora">{accent}</span></>}
        </h1>
        {subtitle && <p className="text-[15px] text-[var(--kz-mute)] mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

// ── Pastille d'entreprise (icône d'app) ───────────────────────
const MARK_GRADIENTS: [string, string][] = [
  ['var(--kz-blue)', 'var(--kz-violet)'],
  ['var(--kz-orange)', 'var(--kz-orange-deep)'],
  ['var(--kz-green)', 'var(--kz-blue)'],
  ['var(--kz-violet)', 'var(--kz-orange-deep)'],
  ['var(--kz-yellow)', 'var(--kz-orange)'],
  ['var(--kz-blue)', 'var(--kz-green)'],
]

export function markGradient(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const [a, b] = MARK_GRADIENTS[h % MARK_GRADIENTS.length]
  return `linear-gradient(145deg, ${a}, ${b})`
}

export function CompanyMark({ name, size = 44, className }: { name?: string | null; size?: number; className?: string }) {
  const label = (name ?? 'CO').trim() || 'CO'
  return (
    <span
      aria-hidden
      className={cn('relative inline-flex items-center justify-center shrink-0 font-semibold text-white select-none overflow-hidden', className)}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        fontSize: Math.max(11, size * 0.32),
        letterSpacing: '-0.02em',
        background: markGradient(label),
        boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 35%, transparent), 0 8px 20px -10px rgba(0,0,0,0.8)',
      }}
    >
      {label.slice(0, 2).toUpperCase()}
    </span>
  )
}

// ── Anneau de compatibilité ───────────────────────────────────
export function MatchRing({ value, size = 40, stroke = 4, showLabel = true, className }: {
  value: number; size?: number; stroke?: number; showLabel?: boolean; className?: string
}) {
  const id = useId().replace(/:/g, '')
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <span className={cn('relative inline-flex items-center justify-center shrink-0', className)} style={{ width: size, height: size }}
      role="img" aria-label={`Compatibilité ${Math.round(pct)} %`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`mr-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--kz-orange)" />
            <stop offset="55%" stopColor="var(--kz-violet)" />
            <stop offset="100%" stopColor="var(--kz-blue)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--kz-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#mr-${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          className="osc-ring-draw" style={{ '--osc-circ': circ } as CSSProperties}
        />
      </svg>
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center font-semibold tabular-nums text-[var(--kz-ink)]"
          style={{ fontSize: Math.max(10, size * 0.27) }}>
          {Math.round(pct)}
        </span>
      )}
    </span>
  )
}

// ── Contrôle segmenté avec pastille glissante ─────────────────
export function Segmented<T extends string | number>({ options, value, onChange, label, size = 'md', className }: {
  options: { value: T; label: ReactNode; count?: number }[]
  value: T
  onChange: (v: T) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null)
  const index = options.findIndex((o) => o.value === value)

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const measure = () => {
      const btn = el.querySelectorAll<HTMLButtonElement>('[data-seg]')[index]
      setThumb(btn ? { x: btn.offsetLeft, w: btn.offsetWidth } : null)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [index, options.length])

  return (
    <div
      ref={wrap}
      role="radiogroup"
      aria-label={label}
      className={cn('relative inline-flex items-center p-1 rounded-full bg-[var(--osc-surface-hi)] border border-[var(--osc-hairline)] max-w-full overflow-x-auto osc-scroll-x', className)}
      style={{ scrollSnapType: 'none' }}
    >
      {thumb && (
        <span
          aria-hidden
          className="osc-seg-thumb absolute top-1 bottom-1 left-0 rounded-full bg-[color-mix(in_srgb,var(--kz-ink)_16%,transparent)] shadow-[0_3px_10px_rgba(0,0,0,0.45),inset_0_1px_0_color-mix(in_srgb,white_14%,transparent)]"
          style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            data-seg
            onClick={() => onChange(o.value)}
            className={cn(
              'relative z-[1] inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]',
              size === 'sm' ? 'px-3 h-7 text-[12px]' : 'px-4 h-9 text-[13px]',
              active ? 'text-[var(--kz-ink)]' : 'text-[var(--kz-mute)] hover:text-[var(--kz-ink)]',
            )}
          >
            {o.label}
            {o.count !== undefined && o.count > 0 && (
              <span className={cn('min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold tabular-nums inline-flex items-center justify-center transition-colors',
                active ? 'bg-[var(--kz-blue)] text-white' : 'bg-[var(--kz-line)] text-[var(--kz-text)]')}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Listes groupées (façon Réglages iOS) ──────────────────────
export function InsetGroup({ title, footer, action, children, className, clip = true }: {
  title?: ReactNode; footer?: ReactNode; action?: ReactNode; children: ReactNode; className?: string
  /** false pour laisser déborder un menu déroulant interne. */
  clip?: boolean
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 px-4 mb-2">
          {title && <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--kz-mute)]">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn('osc-card !rounded-[20px] divide-y divide-[var(--osc-hairline)]', clip && 'overflow-hidden')}>{children}</div>
      {footer && <p className="px-4 mt-2 text-[12px] leading-relaxed text-[var(--kz-mute)]">{footer}</p>}
    </div>
  )
}

export function InsetRow({ icon, iconBg, label, value, chevron, onClick, children, className, stacked }: {
  icon?: ReactNode
  iconBg?: string
  label?: ReactNode
  value?: ReactNode
  chevron?: boolean
  onClick?: () => void
  children?: ReactNode
  className?: string
  /** Libellé au-dessus du contenu (champs longs). */
  stacked?: boolean
}) {
  const body = (
    <>
      {icon && (
        <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-white shrink-0" style={{ background: iconBg ?? 'var(--kz-blue)' }}>
          {icon}
        </span>
      )}
      <div className={cn('flex-1 min-w-0', stacked ? 'flex flex-col gap-1' : 'flex items-center justify-between gap-3')}>
        {label && <span className={cn('text-[15px] text-[var(--kz-ink)] shrink-0', stacked && 'text-[12px] font-medium text-[var(--kz-mute)]')}>{label}</span>}
        {value !== undefined && <span className={cn('text-[15px] text-[var(--kz-mute)] min-w-0', !stacked && 'truncate text-right')}>{value}</span>}
        {children}
      </div>
      {chevron && <ChevronRight size={17} className="text-[var(--kz-mute)] shrink-0 opacity-70" />}
    </>
  )
  const cls = cn('osc-row w-full flex items-center gap-3 px-4 py-3 min-h-[52px] text-left transition-colors', className)
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, 'hover:bg-[var(--osc-surface)] active:bg-[var(--osc-surface-hi)]')}>{body}</button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

// ── État vide ─────────────────────────────────────────────────
export function GlassEmpty({ icon, title, description, action, className }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string
}) {
  return (
    <div className={cn('osc-in flex flex-col items-center text-center px-6 py-16 rounded-[28px] border border-dashed border-[var(--kz-edge)]', className)}>
      {icon && (
        <span className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 text-white"
          style={{ background: 'var(--os-aurora)', boxShadow: '0 18px 40px -16px color-mix(in srgb, var(--kz-violet) 70%, transparent)' }}>
          {icon}
        </span>
      )}
      <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)]">{title}</h3>
      {description && <p className="text-[14px] text-[var(--kz-mute)] max-w-sm leading-relaxed mt-1.5">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// ── Pastille de statut (teintée, sans flou) ───────────────────
const TONES = {
  blue: 'var(--kz-blue)',
  green: 'var(--kz-green)',
  orange: 'var(--kz-orange)',
  violet: 'var(--kz-violet)',
  yellow: 'var(--kz-yellow)',
  red: 'var(--kz-orange-deep)',
  gray: 'var(--kz-mute)',
} as const
export type Tone = keyof typeof TONES

export function toneColor(t: Tone) { return TONES[t] }

export function Pill({ tone = 'gray', children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  const c = TONES[tone]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap', className)}
      style={{ color: `color-mix(in srgb, ${c} 82%, white)`, background: `color-mix(in srgb, ${c} 16%, transparent)` }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />}
      {children}
    </span>
  )
}

// ── Bloc de section (titre + contenu) ─────────────────────────
export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-3', className)}>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[var(--kz-ink)]">{children}</h2>
      {action}
    </div>
  )
}
