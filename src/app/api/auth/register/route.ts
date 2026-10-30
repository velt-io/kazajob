/**
 * KAZAJOB — Inscription (création d'un profil + hash bcrypt).
 * La connexion est ensuite déclenchée côté client via signIn('credentials').
 */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { markEmailPending, sendVerificationEmail } from '@/lib/email-verification'
import { AUTH_LIMITS, clientIp, hitRateLimit, rateLimitKey, retryMessage } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const limited = await hitRateLimit(rateLimitKey('register-ip', clientIp(request.headers)), AUTH_LIMITS.register)
  if (!limited.allowed) {
    return NextResponse.json({ error: retryMessage(limited.retryAfterSec), code: 'rate_limited' }, { status: 429 })
  }

  let body: { email?: string; password?: string; fullName?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const email = String(body.email ?? '').toLowerCase().trim()
  const password = String(body.password ?? '')
  const fullName = String(body.fullName ?? '').trim()
  const role = body.role === 'recruiter' ? 'recruiter' : 'candidate'

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password too short' }, { status: 400 })
  }

  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1)

  if (existing) {
    return NextResponse.json({ error: 'already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const [created] = await db.insert(profiles).values({
    email,
    passwordHash,
    fullName: fullName || email.split('@')[0],
    role,
  }).returning({ id: profiles.id, fullName: profiles.fullName })

  // Adresse à confirmer : lien envoyé tout de suite (le compte reste utilisable).
  if (created) {
    await markEmailPending(created.id)
    await sendVerificationEmail({ id: created.id, email, fullName: created.fullName })
  }

  return NextResponse.json({ ok: true })
}
