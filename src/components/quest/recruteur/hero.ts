/**
 * KAZAJOB QUEST — Vocabulaire visuel de la guilde (espace recruteur).
 * Aides de présentation pures : rien n'est inventé, tout dérive de champs réels
 * (XP du candidat, statut de candidature, catégorie du vivier, statut d'offre).
 */
import { getLevel, getNextLevel, getXpProgress } from '@/lib/gamification'
import { RARITY_META, type Rarity } from '@/lib/quest-journey'
import type { Application } from '@/lib/types'
import type { JobStatus } from '@/lib/job-lifecycle'

export { RARITY_META, ROMAN } from '@/lib/quest-journey'
export type { Rarity }

/** Couleurs de rareté exprimées par les jetons du thème. */
export const RARITY_TONE: Record<Rarity, string> = {
  commune:    RARITY_META.commune.color,
  rare:       'var(--qx-cyan)',
  epique:     'var(--qx-neon)',
  legendaire: 'var(--qx-gold)',
}

/** Rareté d'un héros d'après son niveau réel (paliers d'XP de la gamification). */
export function rarityFromLevel(level: number): Rarity {
  if (level >= 5) return 'legendaire'
  if (level >= 3) return 'epique'
  if (level === 2) return 'rare'
  return 'commune'
}

export interface HeroRank {
  level: number
  title: string
  rarity: Rarity
  /** Progression (0–100) vers le palier suivant. */
  progress: number
  nextTitle: string
  xp: number
}

/** Rang d'un candidat calculé depuis son XP (null si l'XP est inconnue). */
export function heroRank(xp: number | null | undefined): HeroRank | null {
  if (typeof xp !== 'number' || Number.isNaN(xp)) return null
  const lvl = getLevel(xp)
  return {
    level: lvl.level,
    title: lvl.title,
    rarity: rarityFromLevel(lvl.level),
    progress: getXpProgress(xp),
    nextTitle: getNextLevel(xp).title,
    xp,
  }
}

/** Rareté d'une fiche du vivier d'après la catégorie choisie par le recruteur. */
export const POOL_RARITY: Record<string, Rarity> = {
  profil_rare:    'legendaire',
  metier_tension: 'epique',
  a_contacter:    'rare',
  plus_tard:      'commune',
}

// ── Pipeline de recrutement ────────────────────────────────────

export type AppStatus = Application['status']

/** Étapes actives, dans l'ordre de progression. */
export const PIPELINE_ORDER: AppStatus[] = ['pending', 'viewed', 'interview', 'offer', 'hired']
/** Étapes terminales hors progression. */
export const PIPELINE_CLOSED: AppStatus[] = ['rejected', 'withdrawn']

export const STAGE_META: Record<AppStatus, { lore: string; tone: string }> = {
  pending:   { lore: 'Nouvelles recrues',      tone: RARITY_META.commune.color },
  viewed:    { lore: 'Dossier étudié',         tone: 'var(--qx-cyan)' },
  interview: { lore: "L'épreuve",              tone: 'var(--qx-neon)' },
  offer:     { lore: 'Pacte proposé',          tone: 'var(--qx-magenta)' },
  hired:     { lore: 'Ont rejoint la guilde',  tone: 'var(--qx-gold)' },
  rejected:  { lore: 'Chemins séparés',        tone: '#8B7FB0' },
  withdrawn: { lore: 'Retirées par le héros',  tone: '#8B7FB0' },
}

/** Étape suivante dans la progression (null si terminale ou dernière). */
export function nextStage(status: AppStatus): AppStatus | null {
  const i = PIPELINE_ORDER.indexOf(status)
  return i >= 0 && i < PIPELINE_ORDER.length - 1 ? PIPELINE_ORDER[i + 1] : null
}

/** Vrai si le passage de `from` à `to` fait avancer le héros dans la quête. */
export function isAdvance(from: AppStatus, to: AppStatus): boolean {
  const a = PIPELINE_ORDER.indexOf(from)
  const b = PIPELINE_ORDER.indexOf(to)
  return a >= 0 && b > a
}

// ── Offres = quêtes publiées ───────────────────────────────────

export const QUEST_STATUS_TONE: Record<JobStatus, string> = {
  draft:     'var(--qx-neon)',
  published: 'var(--kz-green)',
  paused:    RARITY_META.commune.color,
  expired:   'var(--kz-orange)',
  archived:  '#8B7FB0',
  suspended: '#F87171',
}

export const QUEST_STATUS_LORE: Record<JobStatus, string> = {
  draft:     'Parchemin en préparation',
  published: 'Affichée au tableau des quêtes',
  paused:    'Quête suspendue par vos soins',
  expired:   'Le sablier s’est écoulé',
  archived:  'Rangée dans les archives',
  suspended: 'Scellée par la modération',
}

/** Initiales sûres pour un nom. */
export function initialsOf(name: string | null | undefined, fallback = '?'): string {
  if (!name) return fallback
  const s = name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return s || fallback
}
