import { CITY_COORDS } from '@/lib/constants'
import { findCityCoords, projectIsland } from './quest-ui'

const W = 230
const H = 196

// Contour simplifié de La Réunion (lat, lng), dans le sens horaire depuis Saint-Denis.
const OUTLINE: [number, number][] = [
  [-20.872, 55.45], [-20.885, 55.53], [-20.915, 55.6], [-20.955, 55.655], [-21.02, 55.705],
  [-21.09, 55.74], [-21.17, 55.785], [-21.24, 55.815], [-21.31, 55.805], [-21.365, 55.75],
  [-21.385, 55.66], [-21.375, 55.58], [-21.355, 55.5], [-21.32, 55.43], [-21.275, 55.38],
  [-21.22, 55.33], [-21.15, 55.265], [-21.075, 55.225], [-21.005, 55.25], [-20.95, 55.285],
  [-20.925, 55.33], [-20.895, 55.39],
]
const PATH = OUTLINE.map(([la, ln], i) => {
  const [x, y] = projectIsland(la, ln, W, H)
  return `${i ? 'L' : 'M'}${x} ${y}`
}).join(' ') + ' Z'

const PEAKS: { name: string; at: [number, number] }[] = [
  { name: 'Piton des Neiges', at: [-21.098, 55.48] },
  { name: 'Piton de la Fournaise', at: [-21.244, 55.708] },
]

/**
 * Mini-carte de l'île : la quête est marquée d'une gemme pulsante sur la ville
 * de l'offre (coordonnées réelles de CITY_COORDS). Sans ville reconnue, l'île seule.
 */
export function IslandMap({ location, remote, className = '' }: { location: string | null | undefined; remote?: boolean; className?: string }) {
  const hit = findCityCoords(location, CITY_COORDS)
  const pin = hit ? projectIsland(hit.at[0], hit.at[1], W, H) : null

  return (
    <figure className={className}>
      <svg viewBox={`-8 -8 ${W + 16} ${H + 16}`} className="w-full h-auto" role="img"
        aria-label={hit ? `Carte de La Réunion : la quête se déroule à ${hit.city}` : 'Carte de La Réunion'}>
        <defs>
          <radialGradient id="qxc-sea" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#3B0764" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0B0614" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="qxc-land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2E1065" />
            <stop offset="60%" stopColor="#4C1D95" />
            <stop offset="100%" stopColor="#701A75" />
          </linearGradient>
          <filter id="qxc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect x="-8" y="-8" width={W + 16} height={H + 16} fill="url(#qxc-sea)" />
        {/* Halo côtier + terre */}
        <path d={PATH} fill="none" stroke="#C084FC" strokeOpacity="0.25" strokeWidth="8" strokeLinejoin="round" />
        <path d={PATH} fill="url(#qxc-land)" stroke="#E879F9" strokeOpacity="0.75" strokeWidth="1.2" strokeLinejoin="round" />
        {/* Sommets */}
        {PEAKS.map((p) => {
          const [x, y] = projectIsland(p.at[0], p.at[1], W, H)
          return <path key={p.name} d={`M${x - 6} ${y + 4} L${x} ${y - 6} L${x + 6} ${y + 4} Z`} fill="#1A0B2E" stroke="#FDE68A" strokeOpacity="0.55" strokeWidth="0.8"><title>{p.name}</title></path>
        })}
        {/* Villes */}
        {Object.entries(CITY_COORDS).map(([c, [la, ln]]) => {
          const [x, y] = projectIsland(la, ln, W, H)
          return <circle key={c} cx={x} cy={y} r={1.6} fill="#C4B5FD" fillOpacity={hit?.city === c ? 0 : 0.55} />
        })}
        {/* Gemme de la quête */}
        {pin && (
          <g transform={`translate(${pin[0]} ${pin[1]})`}>
            <circle r="6" fill="none" stroke="#FACC15" strokeWidth="1.5" className="qxc-ping" />
            <rect x="-5.5" y="-5.5" width="11" height="11" rx="2" transform="rotate(45)" fill="#FACC15" stroke="#FEF3C7" strokeWidth="1" filter="url(#qxc-glow)" />
          </g>
        )}
      </svg>
      <figcaption className="mt-2 text-center text-[12px] text-[var(--kz-mute)]">
        {hit ? <><span className="text-white font-semibold">{hit.city}</span>{remote ? ' · télétravail possible' : ''}</> : <>{location || 'Lieu non précisé'}{remote ? ' · télétravail possible' : ''}</>}
      </figcaption>
    </figure>
  )
}
