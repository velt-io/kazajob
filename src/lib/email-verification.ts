/**
 * KAZAJOB — Vérification de l'adresse email.
 *
 * Table email_verifications (cf. migrate-email-verifications.ts) : une ligne
 * est créée à l'inscription par email/mot de passe, verified_at = null tant
 * que le lien n'a pas été cliqué.
 *  - Pas de ligne = compte antérieur à la fonctionnalité ou connexion Google /
 *    LinkedIn (email déjà vérifié par le fournisseur) → considéré vérifié.
 *  - Fail-open : table absente ou base indisponible → considéré vérifié
 *    (la vérification ne doit jamais empêcher de se connecter).
 */
import { sql } from 'drizzle-orm'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { createSignedToken, readSignedToken, verifySignedToken } from '@/lib/signed-token'
import { verifyEmailEmail } from '@/lib/email/templates'

export const VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

const FROM = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kazajob.re'

/** Le lien est lié à l'adresse : changer d'email invalide les anciens liens. */
export function createVerifyToken(userId: string, email: string, now = Date.now()): string {
  return createSignedToken('verify-email', userId, email.toLowerCase(), VERIFY_TTL_MS, now)
}

export const readVerifyToken = readSignedToken

export function verifyVerifyToken(token: string, email: string, now = Date.now()): boolean {
  return verifySignedToken(token, 'verify-email', email.toLowerCase(), now)
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  try {
    const res = await db.execute(sql`SELECT verified_at FROM email_verifications WHERE user_id = ${userId}`)
    const row = res.rows[0] as { verified_at: string | null } | undefined
    return !row || row.verified_at !== null
  } catch (e) {
    console.error('[email-verification] indisponible, compte considéré vérifié', e)
    return true
  }
}

/** Inscription par email : l'adresse est à confirmer. */
export async function markEmailPending(userId: string): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO email_verifications (user_id, verified_at) VALUES (${userId}, NULL)
      ON CONFLICT (user_id) DO NOTHING`)
  } catch (e) {
    console.error('[email-verification] markEmailPending', e)
  }
}

export async function markEmailVerified(userId: string): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE email_verifications SET verified_at = now()
      WHERE user_id = ${userId} AND verified_at IS NULL`)
  } catch (e) {
    console.error('[email-verification] markEmailVerified', e)
  }
}

export async function sendVerificationEmail(user: { id: string; email: string; fullName: string }): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  const token = createVerifyToken(user.id, user.email)
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`
  const { subject, html } = verifyEmailEmail({ fullName: user.fullName || user.email.split('@')[0], verifyUrl })
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to: user.email, subject, html })
  } catch (e) {
    console.error('[email-verification] envoi', e)
  }
}

export const UNVERIFIED_PUBLISH_ERROR =
  'Confirmez votre adresse email pour publier une offre : cliquez sur le lien reçu à l’inscription (ou renvoyez-le depuis le bandeau en haut de page).'
