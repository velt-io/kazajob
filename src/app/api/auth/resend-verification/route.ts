/**
 * KAZAJOB — Renvoi de l'email de confirmation (utilisateur connecté).
 */
import { NextResponse } from 'next/server'
import { auth, getCurrentUser } from '@/lib/auth'
import { isEmailVerified, sendVerificationEmail } from '@/lib/email-verification'
import { hitRateLimit, rateLimitKey, retryMessage } from '@/lib/rate-limit'

export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  if (await isEmailVerified(userId)) return NextResponse.json({ ok: true, alreadyVerified: true })

  const limited = await hitRateLimit(rateLimitKey('verify-resend', userId), { limit: 3, windowSec: 60 * 60 })
  if (!limited.allowed) return NextResponse.json({ error: retryMessage(limited.retryAfterSec) }, { status: 429 })

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  await sendVerificationEmail({ id: user.id, email: user.email, fullName: user.fullName })
  return NextResponse.json({ ok: true })
}
