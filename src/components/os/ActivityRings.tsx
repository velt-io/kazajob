/**
 * Anneaux d'activité (inspirés de l'Apple Watch) : la gamification Kazajob
 * version « OS 2027 ». Chaque anneau = une progression (0–100 %), dessiné du
 * plus grand au plus petit, avec un dégradé et une extrémité arrondie.
 */
export interface Ring {
  value: number            // 0–100 (peut dépasser : l'anneau fait alors plus d'un tour visuel plafonné)
  from: string             // couleur de début du dégradé
  to: string               // couleur de fin
  label?: string
}

export function ActivityRings({ rings, size = 120, stroke = 14, gap = 3, className }: {
  rings: Ring[]
  size?: number
  stroke?: number
  gap?: number
  className?: string
}) {
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} role="img"
      aria-label={rings.map((r) => `${r.label ?? ''} ${Math.round(r.value)} %`).join(', ')}>
      <defs>
        {rings.map((r, i) => (
          <linearGradient key={i} id={`kz-ring-${i}-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={r.from} />
            <stop offset="100%" stopColor={r.to} />
          </linearGradient>
        ))}
      </defs>
      {rings.map((r, i) => {
        const radius = c - stroke / 2 - i * (stroke + gap)
        if (radius <= stroke / 2) return null
        const circ = 2 * Math.PI * radius
        const pct = Math.max(0, Math.min(100, r.value))
        return (
          <g key={i} transform={`rotate(-90 ${c} ${c})`}>
            <circle cx={c} cy={c} r={radius} fill="none" stroke={r.from} strokeOpacity={0.18} strokeWidth={stroke} />
            <circle
              cx={c} cy={c} r={radius} fill="none"
              stroke={`url(#kz-ring-${i}-${size})`} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circ} ${circ}`}
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
            />
          </g>
        )
      })}
    </svg>
  )
}

/** Couleurs officielles des anneaux Kazajob. */
export const RING_COLORS = {
  move:  { from: '#FA114F', to: '#FF6B8A' },  // XP / niveau
  exercise: { from: '#92E82A', to: '#C6FF5C' }, // candidatures de la semaine
  stand: { from: '#1EEAEF', to: '#7DF9FF' },  // profil complété
} as const
