import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Pose la couleur d'accent (--qxr-tone) d'un élément du thème guilde. */
export function toneStyle(tone: string, extra?: CSSProperties): CSSProperties {
  return { ['--qxr-tone' as string]: tone, ...extra } as CSSProperties
}

/** Icône sertie dans un losange lumineux. */
export function Sigil({ children, tone = 'var(--qx-neon)', size = 'md', className }: {
  children: ReactNode; tone?: string; size?: 'sm' | 'md'; className?: string
}) {
  return (
    <span aria-hidden className={cn('qxr-sigil', size === 'sm' && 'qxr-sigil-sm', className)} style={toneStyle(tone)}>
      {children}
    </span>
  )
}

/**
 * En-tête de page de la guilde : surtitre doré, titre épique (Cinzel),
 * sous-titre et actions. Remplace les en-têtes « kz-h2 » des écrans recruteur/admin.
 */
export function QuestHeader({ eyebrow, title, subtitle, icon, tone, actions, className }: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  tone?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 qx-rise', className)}>
      <div className="min-w-0 flex items-start gap-3">
        {icon && <Sigil tone={tone} className="mt-1 hidden sm:inline-flex">{icon}</Sigil>}
        <div className="min-w-0">
          {eyebrow && <p className="kz-eyebrow text-[var(--qx-gold)] mb-1.5">{eyebrow}</p>}
          <h1 className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-white leading-[1.08] break-words">{title}</h1>
          {subtitle && <div className="text-sm text-[var(--kz-mute)] mt-1.5">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}

/** Titre de panneau : sceau, titre, action à droite, filet doré. */
export function PanelTitle({ icon, title, hint, action, tone = 'var(--qx-gold)', className, as: Tag = 'h2' }: {
  icon?: ReactNode
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  tone?: string
  className?: string
  as?: 'h2' | 'h3'
}) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span aria-hidden className="shrink-0 flex" style={{ color: tone }}>{icon}</span>}
          <Tag className="text-[15px] font-bold text-white tracking-wide truncate font-[family-name:var(--font-epic)]">{title}</Tag>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {hint && <p className="text-xs text-[var(--kz-mute)] mt-1">{hint}</p>}
      <hr className="qxr-rule mt-3" />
    </div>
  )
}

/** Petit compteur gravé (valeur + libellé) pour les barres de stats compactes. */
export function Rune({ value, label, icon, tone = 'var(--qx-neon)' }: { value: ReactNode; label: string; icon?: ReactNode; tone?: string }) {
  return (
    <div className="flex flex-col items-center min-w-[52px]">
      <span className="text-[15px] font-extrabold text-white tabular-nums leading-none">{value}</span>
      <span className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-[var(--kz-mute)]">
        {icon && <span aria-hidden className="flex" style={{ color: tone }}>{icon}</span>}{label}
      </span>
    </div>
  )
}
