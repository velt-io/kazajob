import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toneColor, type Tone } from './primitives'

type AppStatus = 'pending' | 'viewed' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'

const FLOW = ['Envoyée', 'CV consulté', 'Entretien', 'Offre', 'Embauche'] as const
const INDEX: Record<string, number> = { pending: 0, viewed: 1, interview: 2, offer: 3, hired: 4 }

export const STATUS_TONE: Record<AppStatus, Tone> = {
  pending: 'blue', viewed: 'yellow', interview: 'green', offer: 'violet', hired: 'green', rejected: 'red', withdrawn: 'gray',
}

export const STATUS_HEADLINE: Record<AppStatus, string> = {
  pending: 'Envoyée, en attente de lecture',
  viewed: 'Le recruteur a consulté ton CV',
  interview: 'Entretien planifié',
  offer: 'Tu as reçu une offre',
  hired: 'Félicitations, c’est signé',
  rejected: 'Candidature non retenue',
  withdrawn: 'Candidature retirée',
}

/**
 * Frise de suivi façon « suivi de commande » Apple : étapes reliées par une
 * ligne qui se remplit (ressort), étape en cours qui pulse doucement.
 */
export function StatusTracker({ status, index = 0 }: { status: AppStatus; index?: number }) {
  const rejected = status === 'rejected'
  const steps: string[] = rejected ? ['Envoyée', 'Examinée', 'Non retenue'] : [...FLOW]
  const current = rejected ? steps.length - 1 : (INDEX[status] ?? 0)
  const color = toneColor(STATUS_TONE[status] ?? 'blue')
  const pct = steps.length > 1 ? current / (steps.length - 1) : 0

  return (
    <div className="relative pt-1" style={{ ['--i' as string]: index }}>
      {/* Ligne de fond + remplissage */}
      <div aria-hidden className="absolute left-3 right-3 top-[13px] h-[3px] rounded-full bg-[var(--kz-line)]" />
      <div aria-hidden className="absolute left-3 top-[13px] h-[3px] rounded-full osc-track-fill"
        style={{ width: `calc((100% - 24px) * ${pct})`, background: rejected ? `color-mix(in srgb, ${color} 55%, transparent)` : `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, transparent), ${color})` }} />

      <ol className="relative flex justify-between" aria-label="Avancement de la candidature">
        {steps.map((label, i) => {
          const done = i < current
          const isCurrent = i === current
          const align = i === 0 ? 'items-start text-left' : i === steps.length - 1 ? 'items-end text-right' : 'items-center text-center'
          return (
            <li key={label} className={cn('flex flex-col gap-2 min-w-0 flex-1', align)} aria-current={isCurrent ? 'step' : undefined}>
              <span
                className={cn('osc-step-dot w-6 h-6 rounded-full flex items-center justify-center shrink-0', isCurrent && !rejected && 'osc-pulse')}
                style={{
                  ['--d' as string]: `${200 + i * 120}ms`,
                  color,
                  background: done || isCurrent ? color : 'var(--kz-cream)',
                  border: done || isCurrent ? 'none' : '2px solid color-mix(in srgb, var(--kz-ink) 22%, transparent)',
                  boxShadow: isCurrent ? `0 0 0 4px color-mix(in srgb, ${color} 22%, transparent)` : undefined,
                }}
              >
                {done && <Check size={13} strokeWidth={3} className="text-black/80" />}
                {isCurrent && (rejected ? <X size={13} strokeWidth={3} className="text-white" /> : <span className="w-2 h-2 rounded-full bg-white" />)}
              </span>
              <span className={cn('text-[11px] leading-tight max-w-[72px]', isCurrent ? 'font-semibold text-[var(--kz-ink)]' : done ? 'text-[var(--kz-text)]' : 'text-[var(--kz-mute)]')}>
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
