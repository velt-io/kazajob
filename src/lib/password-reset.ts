/**
 * KAZAJOB — Jetons de réinitialisation de mot de passe (sans table dédiée).
 * Le hash courant du mot de passe entre dans la signature : dès que le mot de
 * passe change, le lien devient invalide (usage unique de fait).
 */
import { createSignedToken, readSignedToken, verifySignedToken } from '@/lib/signed-token'

export const RESET_TTL_MS = 60 * 60 * 1000 // 1 h

export function createResetToken(userId: string, passwordHash: string | null, now = Date.now()): string {
  return createSignedToken('reset', userId, passwordHash, RESET_TTL_MS, now)
}

/** Décode le jeton sans le vérifier (pour retrouver le profil à charger). */
export const readResetToken = readSignedToken

export function verifyResetToken(token: string, passwordHash: string | null, now = Date.now()): boolean {
  return verifySignedToken(token, 'reset', passwordHash, now)
}
