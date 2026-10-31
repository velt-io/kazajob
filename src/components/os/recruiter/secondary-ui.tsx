'use client'
/**
 * Petites briques de présentation pour les pages secondaires de l'espace
 * recruteur (formulaires, listes Finder, réglages). Purement visuelles.
 */
import Link from 'next/link'
import { type CSSProperties, type ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WindowBar } from './primitives'

/** Lien de retour façon barre de navigation macOS (chevron + libellé bleu). */
export function BackLink({ href, children, onClick }: { href?: string; children: ReactNode; onClick?: () => void }) {
  const cls = 'group inline-flex items-center gap-0.5 -ml-1.5 mb-5 h-8 pl-1 pr-3 rounded-full text-[14px] font-medium text-[var(--kz-blue)] hover:bg-white/[0.06] transition-colors'
  const inner = <><ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />{children}</>
  if (href) return <Link href={href} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

/** Fenêtre « document » qui encadre un formulaire partagé (feux tricolores + titre). */
export function FormWindow({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('osr-panel overflow-hidden', className)}>
      <WindowBar title={title} />
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

/** Groupe de réglages (style Réglages Système) : titre discret + carte arrondie. */
export function SettingsGroup({ title, footer, children, className, id }: { title?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <div className={cn('min-w-0', className)} id={id}>
      {title && <h2 className="px-1 mb-2 text-[13px] font-semibold text-[var(--kz-mute)]">{title}</h2>}
      <div className="osr-panel p-4 sm:p-5">{children}</div>
      {footer && <p className="px-1 mt-2 text-[12px] text-[var(--kz-mute)] leading-relaxed">{footer}</p>}
    </div>
  )
}

/** Petit indicateur chiffré (valeur + libellé) pour les lignes de liste. */
export function MiniStat({ value, label, icon }: { value: ReactNode; label: string; icon?: ReactNode }) {
  return (
    <div className="text-center min-w-[44px]">
      <div className="text-[15px] font-semibold text-white tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-[var(--kz-mute)] flex items-center justify-center gap-0.5 mt-1">{icon}{label}</div>
    </div>
  )
}

/** Option sélectionnable (remplace les cadres « border-2 ») : teinte + coche discrète. */
export function choiceStyle(selected: boolean, accent = 'var(--kz-blue)') {
  return {
    background: selected ? `color-mix(in srgb, ${accent} 16%, transparent)` : 'var(--osr-fill)',
    borderColor: selected ? `color-mix(in srgb, ${accent} 65%, transparent)` : 'var(--osr-hair)',
    boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${accent} 18%, transparent)` : 'none',
  } as const
}

/** Rang d'apparition pour .osr-in (animation échelonnée). */
export const stagger = (i: number): CSSProperties => ({ '--i': i } as CSSProperties)
