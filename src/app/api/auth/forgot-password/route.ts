/**
 * KAZAJOB — Demande de réinitialisation du mot de passe.
 * Répond toujours { ok: true } pour ne pas révéler quels emails ont un compte.
 */
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { createResetToken } from '@/lib/password-reset'
import { passwordResetEmail } from '@/lib/email/templates'
import { AUTH_LIMITS, clientIp, hitRateLimit, rateLimitKey, retryMessage } from '@/lib/rate-limit'

const FROM = process.env.RESEND_FROM ?? 'Kazajob <contact@velt.re>'
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kazajob.re'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const email = String(body?.email ?? '').toLowerCase().trim()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
  }

  const byIp = await hitRateLimit(rateLimitKey('forgot-ip', clientIp(request.headers)), AUTH_LIMITS.forgotIp)
  if (!byIp.allowed) {
    return NextResponse.json({ error: retryMessage(byIp.retryAfterSec) }, { status: 429 })
  }
  // Par adresse : au-delà de 3 emails/heure on n'envoie plus, sans le signaler
  // (même réponse que pour un compte inexistant).
  const byEmail = await hitRateLimit(rateLimitKey('forgot-email', email), AUTH_LIMITS.forgotEmail)
  if (!byEmail.allowed) return NextResponse.json({ ok: true })

  try {
    const [user] = await db
      .select({ id: profiles.id, fullName: profiles.fullName, passwordHash: profiles.passwordHash })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1)

    if (user && process.env.RESEND_API_KEY) {
      const token = createResetToken(user.id, user.passwordHash)
      const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(token)}`
      const { subject, html } = passwordResetEmail({ fullName: user.fullName || email.split('@')[0], resetUrl })
      await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM, to: email, subject, html })
    }
  } catch (e) {
    console.error('[forgot-password]', e)
  }

  return NextResponse.json({ ok: true })
}
