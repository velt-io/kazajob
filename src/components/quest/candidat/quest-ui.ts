/**
 * KAZAJOB QUEST — Helpers de présentation des pages candidat (logique pure, testable).
 *
 * Tout est dérivé des vraies données (compatibilité, mise en avant, salaire,
 * statut de candidature, date d'entretien) : aucune donnée inventée.
 */
import type { Rarity } from '@/lib/quest-journey'

// ── Raretés des offres (« primes ») ─────────────────────────────

export interface BountyInput {
  match_score?: number | null
  is_boosted?: boolean | null
  salary_min?: number | null
  salary_max?: number | null
}

/** Salaire mensuel de référence (même règle que getSalaryLabel : > 15 000 = brut annuel). */
export function monthlyReference(min?: number | null, max?: number | null): number | null {
  const ref = min ?? max
  if (!ref || ref <= 0) return null
  return ref > 15_000 ? Math.round(ref / 12) : ref
}

/**
 * Rareté d'une offre :
 *  - légendaire : compatibilité ≥ 90 %, ou offre à la une avec prime ≥ 2 500 €/mois ;
 *  - épique     : compatibilité ≥ 75 %, offre à la une, ou prime ≥ 3 000 €/mois ;
 *  - rare       : compatibilité ≥ 60 %, ou prime ≥ 2 000 €/mois ;
 *  - commune    : sinon.
 * `reasons` explique la rareté avec les faits réels qui la justifient.
 */
export function bountyRarity(job: BountyInput): { rarity: Rarity; reasons: string[] } {
  const match = typeof job.match_score === 'number' ? job.match_score : null
  const boosted = !!job.is_boosted
  const monthly = monthlyReference(job.salary_min, job.salary_max)

  const reasons: string[] = []
  if (match !== null && match >= 60) reasons.push(`Compatibilité ${match} %`)
  if (boosted) reasons.push('Offre à la une')
  if (monthly !== null && monthly >= 2000) reasons.push(`Prime ≥ ${(Math.floor(monthly / 500) * 500).toLocaleString('fr-FR')} €/mois`)

  let rarity: Rarity = 'commune'
  if ((match !== null && match >= 90) || (boosted && monthly !== null && monthly >= 2500)) rarity = 'legendaire'
  else if ((match !== null && match >= 75) || boosted || (monthly !== null && monthly >= 3000)) rarity = 'epique'
  else if ((match !== null && match >= 60) || (monthly !== null && monthly >= 2000)) rarity = 'rare'

  return { rarity, reasons }
}

export const RARITY_ORDER: Rarity[] = ['legendaire', 'epique', 'rare', 'commune']

/** Nombre d'offres par rareté (pour le bandeau du tableau des primes). */
export function rarityCounts(jobs: BountyInput[]): Record<Rarity, number> {
  const out: Record<Rarity, number> = { legendaire: 0, epique: 0, rare: 0, commune: 0 }
  for (const j of jobs) out[bountyRarity(j).rarity]++
  return out
}

/** Offre publiée il y a moins de 3 jours. */
export function isFresh(createdAt: string | null | undefined, now: number = Date.now()): boolean {
  if (!createdAt) return false
  const t = new Date(createdAt).getTime()
  return Number.isFinite(t) && now - t < 86_400_000 * 3
}

// ── Candidatures = quêtes actives ───────────────────────────────

export type ApplicationStatus = 'pending' | 'viewed' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'

export const QUEST_STAGES = [
  { key: 'pending',   label: 'Envoyée',  lore: 'Sort lancé' },
  { key: 'viewed',    label: 'Lue',      lore: 'Le recruteur a lu ton parchemin' },
  { key: 'interview', label: 'Épreuve',  lore: 'Entretien planifié' },
  { key: 'offer',     label: 'Offre',    lore: 'Une offre t’attend' },
  { key: 'hired',     label: 'Trésor',   lore: 'Embauche : quête accomplie' },
] as const

export interface ApplicationQuest {
  /** Étape atteinte (0…4), -1 si la quête est terminée sans succès. */
  step: number
  state: 'active' | 'won' | 'lost' | 'abandoned'
  progress: number
  rarity: Rarity
}

export function applicationQuest(status: string): ApplicationQuest {
  if (status === 'rejected') return { step: -1, state: 'lost', progress: 0, rarity: 'commune' }
  if (status === 'withdrawn') return { step: -1, state: 'abandoned', progress: 0, rarity: 'commune' }
  const idx = QUEST_STAGES.findIndex((s) => s.key === status)
  const step = idx < 0 ? 0 : idx
  const rarity: Rarity = step >= 3 ? 'legendaire' : step === 2 ? 'epique' : step === 1 ? 'rare' : 'commune'
  return { step, state: step === 4 ? 'won' : 'active', progress: Math.round((step / 4) * 100), rarity }
}

// ── Rendez-vous (entretiens) ────────────────────────────────────

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Libellé de compte à rebours vers un rendez-vous. */
export function countdownLabel(target: Date, now: Date = new Date()): string {
  const diff = target.getTime() - now.getTime()
  if (diff < 0) return 'Passé'
  const days = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000)
  if (days === 0) {
    const min = Math.round(diff / 60_000)
    if (min < 60) return `Dans ${Math.max(min, 1)} min`
    return `Aujourd’hui · dans ${Math.round(min / 60)} h`
  }
  if (days === 1) return 'Demain'
  return `Dans ${days} jours`
}

/** Grille d'un mois (semaines commençant le lundi) : jours du mois, `null` pour les cases vides. */
export function monthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7 // lundi = 0
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** Clé de jour stable (AAAA-MM-JJ, heure locale). */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Carte de l'île ──────────────────────────────────────────────

/** Emprise de La Réunion utilisée par la mini-carte (lat/lng). */
export const ISLAND_BOUNDS = { north: -20.85, south: -21.4, west: 55.2, east: 55.85 }

/** Projette un point (lat, lng) dans un repère SVG de largeur w et hauteur h. */
export function projectIsland(lat: number, lng: number, w: number, h: number): [number, number] {
  const { north, south, west, east } = ISLAND_BOUNDS
  const x = ((lng - west) / (east - west)) * w
  const y = ((north - lat) / (north - south)) * h
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
}

/** Retrouve les coordonnées d'une ville à partir du libellé de l'offre (« Saint-Denis », « saint-denis (974) »…). */
export function findCityCoords(location: string | null | undefined, coords: Record<string, [number, number]>): { city: string; at: [number, number] } | null {
  if (!location) return null
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const loc = norm(location)
  const entries = Object.entries(coords).sort((a, b) => b[0].length - a[0].length) // « Saint-Pierre » avant « Saint-P… »
  const hit = entries.find(([c]) => loc === norm(c)) ?? entries.find(([c]) => loc.includes(norm(c)))
  return hit ? { city: hit[0], at: hit[1] } : null
}
