import type { CSSProperties, ReactNode } from 'react'
import { Crown, Gem, Shield, Sparkles } from 'lucide-react'
import { RARITY_META, type Rarity } from '@/lib/quest-journey'

/**
 * Briques de présentation des pages candidat (thème Quest) :
 * en-tête de page épique, titre de panneau, badge de rareté, blason, état vide.
 * Purement visuel — aucun état, aucune donnée.
 */

const RARITY_ICON = { legendaire: Crown, epique: Sparkles, rare: Gem, commune: Shield } as const

/** Variable CSS --r (couleur de rareté) pour les classes .qxc-*. */
export function rarityVars(rarity: Rarity): CSSProperties {
  return { ['--r' as string]: RARITY_META[rarity].color } as CSSProperties
}

export function QuestPageHeader({ eyebrow, title, accent, subtitle, icon, children, className = '' }: {
  eyebrow: string
  title: ReactNode
  accent?: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <header className={`flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 qx-rise ${className}`}>
      <div className="min-w-0 flex items-start gap-3.5">
        {icon && (
          <span aria-hidden className="qxc-crest w-12 h-12 sm:w-14 sm:h-14 mt-1 text-[var(--qx-gold)]" style={{ ['--r' as string]: 'var(--qx-magenta)' }}>
            <span className="qxc-crest-frame" />
            <span>{icon}</span>
          </span>
        )}
        <div className="min-w-0">
          <p className="kz-eyebrow text-[var(--qx-neon)] mb-2 flex items-center gap-2">
            <span className="qxc-gem" style={{ ['--r' as string]: 'var(--qx-gold)' } as CSSProperties} />
            {eyebrow}
          </p>
          <h1 className="text-[28px] sm:text-[34px] lg:text-[42px] font-bold text-white leading-[1.05] break-words">
            {title}{accent ? <> <span className="qx-text-arcane">{accent}</span></> : null}
          </h1>
          {subtitle && <p className="text-[14px] sm:text-[15px] text-[var(--kz-mute)] mt-2">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
    </header>
  )
}

export function PanelTitle({ icon, children, extra, as: Tag = 'h2', color = 'var(--qx-gold)' }: {
  icon?: ReactNode
  children: ReactNode
  extra?: ReactNode
  as?: 'h2' | 'h3'
  color?: string
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      {icon && (
        <span aria-hidden className="w-7 h-7 rounded-md rotate-45 grid place-items-center shrink-0 border"
          style={{ color, borderColor: `color-mix(in srgb, ${color} 55%, transparent)`, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
          <span className="-rotate-45 inline-flex">{icon}</span>
        </span>
      )}
      <Tag className="text-[15px] sm:text-[16px] font-bold text-white tracking-wide font-[family-name:var(--font-epic)] min-w-0 truncate">{children}</Tag>
      {extra && <div className="ml-auto flex items-center gap-2 shrink-0">{extra}</div>}
    </div>
  )
}

export function RarityBadge({ rarity, size = 'md', label }: { rarity: Rarity; size?: 'sm' | 'md'; label?: string }) {
  const r = RARITY_META[rarity]
  const Icon = RARITY_ICON[rarity]
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase rounded-md border whitespace-nowrap ${size === 'sm' ? 'text-[9px] tracking-[0.12em] px-1.5 py-0.5' : 'text-[10px] tracking-[0.14em] px-2 py-0.5'}`}
      style={{ color: r.color, borderColor: `color-mix(in srgb, ${r.color} 60%, transparent)`, background: `color-mix(in srgb, ${r.color} 12%, transparent)` }}
    >
      <Icon size={size === 'sm' ? 9 : 10} aria-hidden />
      {label ?? r.label}
    </span>
  )
}

/** Blason losange (initiales d'entreprise, icône…). */
export function Crest({ children, rarity, color, size = 48, className = '' }: {
  children: ReactNode
  rarity?: Rarity
  color?: string
  size?: number
  className?: string
}) {
  const c = color ?? (rarity ? RARITY_META[rarity].color : 'var(--qx-neon)')
  return (
    <span aria-hidden className={`qxc-crest text-white font-bold ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.3), ['--r' as string]: c } as CSSProperties}>
      <span className="qxc-crest-frame" />
      <span className="tracking-wide">{children}</span>
    </span>
  )
}

export function QuestEmpty({ icon, title, description, action }: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="qx-panel px-6 py-12 sm:py-14 flex flex-col items-center text-center qx-rise">
      <span aria-hidden className="qxc-crest w-20 h-20 mb-5 text-[var(--qx-gold)]" style={{ ['--r' as string]: 'var(--qx-neon)' } as CSSProperties}>
        <span className="qxc-crest-frame" />
        <span>{icon}</span>
      </span>
      <h3 className="text-[20px] font-bold text-white font-[family-name:var(--font-epic)] mb-2">{title}</h3>
      {description && <p className="text-[14px] text-[var(--kz-mute)] max-w-sm leading-relaxed mb-6">{description}</p>}
      {action}
    </div>
  )
}

// Liens-boutons (pour les <Link>, au même look que <Button>)
const LINK_BASE = 'inline-flex items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-[0.08em] border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/40'
const LINK_SIZE = { sm: 'h-8 px-3 text-[11px]', md: 'h-10 px-4 text-[12px]' } as const
type LinkSize = keyof typeof LINK_SIZE

/** Lien « sort » : dégradé néon du bouton primaire. */
export const spellLink = (size: LinkSize = 'md') => `${LINK_BASE} ${LINK_SIZE[size]} text-white border-[#F0ABFC]/60 bg-[linear-gradient(120deg,#7C3AED,#A855F7_45%,#E879F9)] shadow-[0_0_22px_-4px_rgba(232,121,249,0.75)] hover:-translate-y-0.5 hover:shadow-[0_0_32px_-2px_rgba(232,121,249,0.95)]`
/** Lien « fantôme » : contour arcanique. */
export const ghostLink = (size: LinkSize = 'md') => `${LINK_BASE} ${LINK_SIZE[size]} text-[var(--kz-ink)] border-[#C084FC]/40 bg-[rgba(168,85,247,0.08)] hover:bg-[rgba(168,85,247,0.16)] hover:border-[#E879F9]/70`
/** Lien « légendaire » : or. */
export const goldLink = (size: LinkSize = 'md') => `${LINK_BASE} ${LINK_SIZE[size]} text-[#1A0B2E] border-[#FDE68A] bg-[linear-gradient(120deg,#FDE68A,#FACC15_45%,#F59E0B)] shadow-[0_0_22px_-4px_rgba(250,204,21,0.7)] hover:-translate-y-0.5`
export const SPELL_LINK = spellLink('md')
