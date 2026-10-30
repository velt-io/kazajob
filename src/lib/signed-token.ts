/**
 * KAZAJOB — Jetons signés sans table (liens envoyés par email).
 * Jeton = base64url(userId.exp) + '.' + HMAC(AUTH_SECRET, purpose.userId.exp.binding).
 *  - purpose : sépare les usages (un lien de réinitialisation ne confirme pas un email) ;
 *  - binding : valeur courante qui invalide le lien quand elle change
 *    (hash du mot de passe, adresse email…).
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export type TokenPurpose = 'reset' | 'verify-email'

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET manquant')
  return s
}

function sign(purpose: TokenPurpose, payload: string, binding: string | null): string {
  return createHmac('sha256', secret()).update(`${purpose}.${payload}.${binding ?? ''}`).digest('base64url')
}

export function createSignedToken(
  purpose: TokenPurpose, userId: string, binding: string | null, ttlMs: number, now = Date.now(),
): string {
  const payload = `${userId}.${now + ttlMs}`
  return `${Buffer.from(payload).toString('base64url')}.${sign(purpose, payload, binding)}`
}

/** Décode le jeton sans le vérifier (pour retrouver le profil à charger). */
export function readSignedToken(token: string): { userId: string; exp: number } | null {
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null
  const [userId, expStr] = Buffer.from(encoded, 'base64url').toString().split('.')
  const exp = Number(expStr)
  if (!userId || !Number.isFinite(exp)) return null
  return { userId, exp }
}

export function verifySignedToken(
  token: string, purpose: TokenPurpose, binding: string | null, now = Date.now(),
): boolean {
  const parsed = readSignedToken(token)
  if (!parsed || parsed.exp < now) return false
  const expected = Buffer.from(sign(purpose, `${parsed.userId}.${parsed.exp}`, binding))
  const given = Buffer.from(token.split('.')[1])
  return expected.length === given.length && timingSafeEqual(expected, given)
}
