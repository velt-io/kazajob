/**
 * Petits utilitaires de présentation pour les pages admin (thème OS 2027).
 * Aucune logique : classes et en-têtes de sections.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** <select> natif habillé façon menu macOS (sans changer son comportement). */
export const OSR_SELECT =
  'h-8 pl-2.5 pr-7 rounded-[9px] text-[12px] font-semibold text-[var(--kz-ink)] bg-[var(--osr-fill-2)] border border-[var(--osr-hair)] cursor-pointer outline-none transition-colors hover:bg-[var(--osr-fill-3)] focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)] [&>option]:bg-[#1C1C22]'

/** Champ texte compact (formulaires d'admin). */
export const OSR_FIELD =
  'h-10 px-3 rounded-xl text-[14px] text-[var(--kz-ink)] bg-[var(--osr-fill-2)] border border-[var(--osr-hair)] outline-none transition-all placeholder:text-[var(--kz-mute)] focus:border-[var(--kz-blue)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--kz-blue)_22%,transparent)]'

/** Titre de section sobre (au-dessus d'un panneau). */
export function SectionTitle({ children, icon, aside, className }: { children: ReactNode; icon?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-3', className)}>
      <h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-white min-w-0">
        {icon && <span className="text-[var(--kz-mute)] shrink-0 inline-flex">{icon}</span>}
        <span className="truncate">{children}</span>
      </h2>
      {aside}
    </div>
  )
}
