/**
 * KAZAJOB — Cycle de vie des offres d'emploi (logique pure, sans base).
 *
 *   brouillon ──publier──▶ publiée ──pause──▶ en pause ──publier──▶ publiée
 *                            │  (60 jours)
 *                            ├──échéance──▶ expirée ──republier──▶ publiée
 *                            └──archiver──▶ archivée ──republier──▶ publiée
 *   L'admin peut suspendre n'importe quelle offre ; seul l'admin la rétablit.
 *
 * Invariant : jobs.is_active === (status === 'published'). Toutes les listes
 * publiques continuent donc de filtrer sur is_active.
 */
import type { BadgeColor } from '@/lib/types'

export const JOB_STATUSES = ['draft', 'published', 'paused', 'expired', 'archived', 'suspended'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export type JobAction = 'publish' | 'pause' | 'archive' | 'suspend'
export type JobActor = 'recruiter' | 'admin'

/** Durée de publication avant expiration automatique. */
export const JOB_DURATION_DAYS = 60
/** En dessous de ce nombre de jours, l'offre est signalée « expire bientôt ». */
export const JOB_EXPIRY_WARNING_DAYS = 7

const DAY_MS = 86_400_000

export const JOB_STATUS_META: Record<JobStatus, { label: string; color: BadgeColor }> = {
  draft:     { label: 'Brouillon', color: 'violet' },
  published: { label: 'Publiée',   color: 'green'  },
  paused:    { label: 'En pause',  color: 'cream'  },
  expired:   { label: 'Expirée',   color: 'yellow' },
  archived:  { label: 'Archivée',  color: 'cream'  },
  suspended: { label: 'Suspendue', color: 'orange' },
}

export function isJobStatus(v: unknown): v is JobStatus {
  return typeof v === 'string' && (JOB_STATUSES as readonly string[]).includes(v)
}

/** Statut d'une offre, y compris pour une ligne antérieure à la migration (status absent). */
export function resolveJobStatus(job: { status?: string | null; is_active?: boolean }): JobStatus {
  if (isJobStatus(job.status)) return job.status
  return job.is_active ? 'published' : 'paused'
}

const TRANSITIONS: Record<JobAction, { from: readonly JobStatus[]; to: JobStatus; adminOnly?: boolean }> = {
  publish: { from: ['draft', 'paused', 'expired', 'archived'], to: 'published' },
  pause:   { from: ['published'], to: 'paused' },
  archive: { from: ['draft', 'published', 'paused', 'expired'], to: 'archived' },
  suspend: { from: ['draft', 'published', 'paused', 'expired', 'archived'], to: 'suspended', adminOnly: true },
}

/** Statut atteint par `action`, ou null si la transition est interdite pour cet acteur. */
export function nextJobStatus(current: JobStatus, action: JobAction, actor: JobActor): JobStatus | null {
  const t = TRANSITIONS[action]
  if (!t) return null
  if (t.adminOnly && actor !== 'admin') return null
  // Une offre suspendue ne peut être rétablie que par l'admin (publish depuis suspended).
  if (current === 'suspended') return actor === 'admin' && action === 'publish' ? 'published' : null
  return t.from.includes(current) ? t.to : null
}

/** Actions proposées au recruteur pour un statut donné (ordre d'affichage). */
export function recruiterActions(status: JobStatus): JobAction[] {
  return (['publish', 'pause', 'archive'] as const).filter((a) => nextJobStatus(status, a, 'recruiter') !== null)
}

/** Colonnes à écrire pour passer au statut `status` (maintient l'invariant is_active). */
export function jobStatusPatch(status: JobStatus, now = new Date()): {
  status: JobStatus; isActive: boolean; publishedAt?: Date; expiresAt?: Date
} {
  if (status !== 'published') return { status, isActive: false }
  return {
    status, isActive: true,
    publishedAt: now,
    expiresAt: new Date(now.getTime() + JOB_DURATION_DAYS * DAY_MS),
  }
}

/** Jours restants avant expiration (arrondi supérieur), ou null si non applicable. */
export function daysUntilExpiry(expiresAt: string | Date | null | undefined, now = Date.now()): number | null {
  if (!expiresAt) return null
  const t = new Date(expiresAt).getTime()
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.ceil((t - now) / DAY_MS))
}
