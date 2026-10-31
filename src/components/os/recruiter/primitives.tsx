'use client'
/**
 * Briques de présentation « OS 2027 » pour les espaces recruteur et admin.
 * Purement visuelles : aucune donnée, aucun appel réseau. Styles dans
 * src/app/recruiter/os-recruiter.css (préfixe osr-).
 */
import Link from 'next/link'
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode, type CSSProperties } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { Tooltip } from '@/components/ui/radix'
import { cn } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'

// ── Couleurs d'accent (toujours des variables) ───────────────────
export const ACCENT = {
  orange: 'var(--kz-orange)',
  violet: 'var(--kz-violet)',
  blue:   'var(--kz-blue)',
  green:  'var(--kz-green)',
  yellow: 'var(--kz-yellow)',
  mute:   'var(--kz-mute)',
  red:    'var(--osr-red)',
  pink:   'var(--osr-pink)',
  indigo: 'var(--osr-indigo)',
  teal:   'var(--osr-teal)',
} as const

/** Badge du design system → couleur système. */
export const BADGE_ACCENT: Record<BadgeColor, string> = {
  orange: ACCENT.orange,
  violet: ACCENT.violet,
  blue:   ACCENT.blue,
  green:  ACCENT.green,
  yellow: ACCENT.yellow,
  ink:    'var(--kz-ink)',
  cream:  ACCENT.mute,
  paper:  ACCENT.mute,
}

/** Statut de candidature → couleur système (lecture du pipeline). */
export const APP_STATUS_ACCENT: Record<string, string> = {
  pending:   ACCENT.mute,
  viewed:    ACCENT.yellow,
  interview: ACCENT.blue,
  offer:     ACCENT.violet,
  hired:     ACCENT.green,
  rejected:  ACCENT.red,
  withdrawn: ACCENT.mute,
}

export const accentStyle = (accent: string): CSSProperties => ({ '--osr-accent': accent } as CSSProperties)
export const tint = (accent: string, pct = 16) => `color-mix(in srgb, ${accent} ${pct}%, transparent)`

// ── En-tête de page ──────────────────────────────────────────────
export function PageHeader({ eyebrow, title, subtitle, actions, className }: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="osr-eyebrow mb-2">{eyebrow}</p>}
        <h1 className="osr-title">{title}</h1>
        {subtitle && <p className="text-[15px] text-[var(--kz-mute)] mt-2 leading-snug">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </header>
  )
}

// ── Widget (grande surface en verre) ─────────────────────────────
export function Widget({ title, sub, icon, accent, href, linkLabel, action, className, bodyClassName, children, glass = true }: {
  title?: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  accent?: string
  href?: string
  linkLabel?: string
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
  glass?: boolean
}) {
  return (
    <div
      className={cn('rounded-[26px] min-w-0', glass ? 'os-glass' : 'osr-panel', accent && 'osr-glow', className)}
      style={accent ? accentStyle(accent) : undefined}
    >
      {(title || action || href) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <span className="w-7 h-7 rounded-[9px] flex items-center justify-center text-white shrink-0" style={{ background: accent ?? ACCENT.indigo }}>
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-white truncate">{title}</h2>}
              {sub && <p className="text-[12px] text-[var(--kz-mute)] truncate">{sub}</p>}
            </div>
          </div>
          {action}
          {href && linkLabel && (
            <Link href={href} className="group/l inline-flex items-center gap-0.5 text-[13px] font-medium text-[var(--kz-blue)] hover:brightness-125 shrink-0">
              {linkLabel}<ChevronRight size={14} className="transition-transform group-hover/l:translate-x-0.5" />
            </Link>
          )}
        </div>
      )}
      <div className={cn('px-5 pb-5', bodyClassName)}>{children}</div>
    </div>
  )
}

// ── Contrôle segmenté (curseur glissant à ressort) ───────────────
export interface SegItem<T extends string> { id: T; label: ReactNode; count?: number; icon?: ReactNode }

export function Segmented<T extends string>({ items, value, onChange, ariaLabel, className }: {
  items: SegItem<T>[]
  value: T
  onChange: (v: T) => void
  ariaLabel: string
  className?: string
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const w = wrap.current
    const t = thumb.current
    if (!w || !t) return
    const place = () => {
      const active = w.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')
      if (!active) { t.style.opacity = '0'; return }
      t.style.opacity = '1'
      t.style.width = `${active.offsetWidth}px`
      t.style.transform = `translateX(${active.offsetLeft}px)`
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(w)
    return () => ro.disconnect()
  }, [value, items.length])

  return (
    <div ref={wrap} role="group" aria-label={ariaLabel} className={cn('osr-seg', className)}>
      <span ref={thumb} aria-hidden className="osr-seg-thumb" style={{ opacity: 0 }} />
      {items.map((it) => (
        <button key={it.id} type="button" aria-pressed={value === it.id} onClick={() => onChange(it.id)}>
          {it.icon}
          {it.label}
          {it.count !== undefined && <span className="osr-seg-count">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

// ── Champ de recherche (raccourci « / ») ─────────────────────────
export function SearchField({ value, onChange, placeholder = 'Rechercher', ariaLabel, className, hotkey = true }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
  hotkey?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!hotkey) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.key !== '/' || t?.closest('input, textarea, select, [contenteditable="true"]')) return
      e.preventDefault()
      input.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hotkey])

  return (
    <label className={cn('osr-search', className)}>
      <Search size={15} className="text-[var(--kz-mute)] shrink-0" />
      <input
        ref={input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') { onChange(''); input.current?.blur() } }}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
      {hotkey && !value && (
        <kbd aria-hidden className="hidden sm:inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md text-[11px] font-medium text-[var(--kz-mute)] border border-white/10">/</kbd>
      )}
    </label>
  )
}

// ── Pastille de statut ───────────────────────────────────────────
export function StatusPill({ accent, children, live, className }: { accent: string; children: ReactNode; live?: boolean; className?: string }) {
  return <span className={cn('osr-pill', className)} data-live={live ? 'true' : undefined} style={accentStyle(accent)}>{children}</span>
}

// ── Bouton icône + infobulle ─────────────────────────────────────
export function IconButton({ label, onClick, children, tone, disabled, className, type = 'button' }: {
  label: string
  onClick?: () => void
  children: ReactNode
  tone?: 'danger' | 'accent'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  return (
    <Tooltip content={label}>
      <button type={type} onClick={onClick} disabled={disabled} aria-label={label} data-tone={tone} className={cn('osr-icon-btn', className)}>
        {children}
      </button>
    </Tooltip>
  )
}

// ── États vides / chargement ─────────────────────────────────────
export function EmptyPanel({ icon, title, description, action, accent = ACCENT.indigo, className }: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
  accent?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}>
      <span className="relative w-16 h-16 rounded-[20px] flex items-center justify-center text-white mb-5"
        style={{ background: `linear-gradient(145deg, ${accent}, ${tint(accent, 55)})`, boxShadow: `0 18px 40px -16px ${accent}` }}>
        {icon}
      </span>
      <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-white">{title}</h3>
      {description && <p className="text-[14px] text-[var(--kz-mute)] max-w-sm leading-relaxed mt-1.5">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SkeletonList({ rows = 4, height = 56, className }: { rows?: number; height?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="osr-skel" style={{ height, opacity: 1 - i * 0.14 }} />)}
    </div>
  )
}

// ── Compteur animé (écrit directement dans le DOM, pas de re-rendu) ──
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString('fr-FR'), duration = 900, className }: {
  value: number
  format?: (n: number) => string
  duration?: number
  className?: string
}) {
  const el = useRef<HTMLSpanElement>(null)
  const from = useRef(0)
  const fmt = useRef(format)
  useEffect(() => { fmt.current = format })
  useEffect(() => {
    const node = el.current
    if (!node) return
    const start = from.current
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || start === value) {
      node.textContent = fmt.current(value)
      from.current = value
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 4)
      node.textContent = fmt.current(start + (value - start) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); from.current = value }
  }, [value, duration])
  return <span ref={el} className={cn('tabular-nums', className)}>{format(value)}</span>
}

// ── Sparkline (façon Bourse) ─────────────────────────────────────
export function Sparkline({ data, color = ACCENT.green, height = 44, className, label }: {
  data: number[]
  color?: string
  height?: number
  className?: string
  label?: string
}) {
  const W = 120
  const H = 40
  const pts = data.length > 1 ? data : [0, ...(data.length ? data : [0])]
  const max = Math.max(...pts, 1)
  const min = Math.min(...pts, 0)
  const span = max - min || 1
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - 3 - ((v - min) / span) * (H - 8)] as const)
  // Courbe lissée (Catmull-Rom → Bézier)
  let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[i - 1] ?? xy[i]
    const p1 = xy[i]
    const p2 = xy[i + 1]
    const p3 = xy[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  const id = `osr-sp-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const last = xy[xy.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn('w-full overflow-visible', className)} style={{ height }}
      role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="osr-spark-area" d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path className="osr-spark-line" d={d} pathLength={1} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} className="osr-spark-area" />
    </svg>
  )
}

// ── Jauge circulaire simple ──────────────────────────────────────
export function Gauge({ value, size = 64, stroke = 7, color = ACCENT.violet, children, label }: {
  value: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
  label?: string
}) {
  const r = size / 2 - stroke / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(pct)} %`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 absolute inset-0" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`} style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.2,0.8,0.2,1)' }} />
      </svg>
      <span className="relative text-center leading-none">{children}</span>
    </span>
  )
}

// ── Barre de titre façon fenêtre macOS ───────────────────────────
export function WindowBar({ title, children, className }: { title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 h-11 px-4 border-b border-white/[0.06] bg-white/[0.025]', className)}>
      <span className="osr-traffic shrink-0" aria-hidden><i /><i /><i /></span>
      {title && <span className="flex-1 min-w-0 text-center text-[12px] font-medium text-[var(--kz-mute)] truncate">{title}</span>}
      {children}
    </div>
  )
}

// ── Pastille-logo (initiales ou image) ───────────────────────────
export function Monogram({ name, src, size = 44, radius = 13, gradient }: { name: string; src?: string | null; size?: number; radius?: number; gradient?: string }) {
  const letters = name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'KZ'
  return (
    <span className="flex items-center justify-center shrink-0 overflow-hidden text-white font-semibold border border-white/10"
      style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.32, background: gradient ?? 'linear-gradient(145deg, var(--osr-indigo), var(--kz-violet))' }}>
      {src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt="" className="w-full h-full object-cover" />
        : letters}
    </span>
  )
}
