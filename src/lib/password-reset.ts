/**
 * KAZAJOB — Jetons de réinitialisation de mot de passe (sans table dédiée).
 * Jeton = base64url(userId.exp) + '.' + HMAC(AUTH_SECRET, userId.exp.passwordHash).
 * Le hash courant entre dans la signature : dès que le mot de passe change,
 * le lien devient invalide (usage unique de fait).
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export const RESET_TTL_MS = 60 * 60 * 1000 // 1 h

function secret(): string {
  const s = process.env.AUTH_SECRET
  if (!s) throw new Error('AUTH_SECRET manquant')
  return s
}

function sign(payload: string, passwordHash: string | null): string {
  return createHmac('sha256', secret()).update(`${payload}.${passwordHash ?? ''}`).digest('base64url')
}

export function createResetToken(userId: string, passwordHash: string | null, now = Date.now()): string {
  const payload = `${userId}.${now + RESET_TTL_MS}`
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload, passwordHash)}`
}

/** Décode le jeton sans le vérifier (pour retrouver le profil à charger). */
export function readResetToken(token: string): { userId: string; exp: number } | null {
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null
  const [userId, expStr] = Buffer.from(encoded, 'base64url').toString().split('.')
  const exp = Number(expStr)
  if (!userId || !Number.isFinite(exp)) return null
  return { userId, exp }
}

export function verifyResetToken(token: string, passwordHash: string | null, now = Date.now()): boolean {
  const parsed = readResetToken(token)
  if (!parsed || parsed.exp < now) return false
  const expected = Buffer.from(sign(`${parsed.userId}.${parsed.exp}`, passwordHash))
  const given = Buffer.from(token.split('.')[1])
  return expected.length === given.length && timingSafeEqual(expected, given)
}
