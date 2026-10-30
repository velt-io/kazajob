/**
 * KAZAJOB — Limitation des tentatives (anti-abus connexion / inscription).
 *
 * Compteurs à fenêtre fixe stockés dans Neon (table auth_rate_limits, cf.
 * migrate-auth-rate-limits.ts) : un compteur en mémoire ne tient pas sur Vercel,
 * où chaque requête peut tomber sur une instance différente.
 * Une seule requête atomique (INSERT … ON CONFLICT) par tentative.
 *
 * Fail-open : si la base ou la table est indisponible, on laisse passer
 * (la connexion ne doit jamais tomber à cause de l'anti-abus).
 * Emails et IP sont hachés : aucune donnée personnelle en clair dans la table.
 */
import { createHash } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export interface RateLimitRule { limit: number; windowSec: number }

export const AUTH_LIMITS = {
  /** Échecs de connexion sur un même compte (remis à zéro après une connexion réussie). */
  loginEmail:  { limit: 8,  windowSec: 15 * 60 },
  loginIp:     { limit: 30, windowSec: 15 * 60 },
  register:    { limit: 5,  windowSec: 60 * 60 },
  forgotEmail: { limit: 3,  windowSec: 60 * 60 },
  forgotIp:    { limit: 10, windowSec: 60 * 60 },
  resetIp:     { limit: 10, windowSec: 15 * 60 },
} satisfies Record<string, RateLimitRule>

/** Clé de compteur : portée + empreinte SHA-256 (tronquée) de la valeur. */
export function rateLimitKey(scope: string, value: string): string {
  const digest = createHash('sha256').update(value.trim().toLowerCase()).digest('hex').slice(0, 32)
  return `${scope}:${digest}`
}

/** IP du client derrière le proxy Vercel (première adresse de x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Message affichable : « Réessaie dans 12 minutes. » */
export function retryMessage(retryAfterSec: number): string {
  const min = Math.max(1, Math.ceil(retryAfterSec / 60))
  return `Trop de tentatives. Réessaie dans ${min} minute${min > 1 ? 's' : ''}.`
}

/** Compte une tentative. allowed = false au-delà de la limite dans la fenêtre courante. */
export async function hitRateLimit(
  key: string,
  rule: RateLimitRule,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  try {
    const window = `${rule.windowSec} seconds`
    const res = await db.execute(sql`
      INSERT INTO auth_rate_limits (key, count, window_start)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count        = CASE WHEN auth_rate_limits.window_start < now() - ${window}::interval
                            THEN 1 ELSE auth_rate_limits.count + 1 END,
        window_start = CASE WHEN auth_rate_limits.window_start < now() - ${window}::interval
                            THEN now() ELSE auth_rate_limits.window_start END
      RETURNING count,
        GREATEST(0, EXTRACT(EPOCH FROM (window_start + ${window}::interval - now())))::int AS retry_after
    `)
    const row = res.rows[0] as { count: number; retry_after: number } | undefined
    if (!row) return { allowed: true, retryAfterSec: 0 }
    return { allowed: Number(row.count) <= rule.limit, retryAfterSec: Number(row.retry_after) }
  } catch (e) {
    console.error('[rate-limit] indisponible, tentative autorisée', e)
    return { allowed: true, retryAfterSec: 0 }
  }
}

/** Remet un compteur à zéro (ex. connexion réussie). */
export async function clearRateLimit(key: string): Promise<void> {
  try {
    await db.execute(sql`DELETE FROM auth_rate_limits WHERE key = ${key}`)
  } catch {
    // sans conséquence
  }
}

/** Cron : supprime les compteurs de plus d'un jour. */
export async function purgeRateLimits(): Promise<number> {
  try {
    const res = await db.execute(sql`DELETE FROM auth_rate_limits WHERE window_start < now() - interval '1 day'`)
    return res.rowCount ?? 0
  } catch {
    return 0
  }
}
