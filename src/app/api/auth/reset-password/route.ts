/**
 * KAZAJOB — Choix d'un nouveau mot de passe à partir du lien reçu par email.
 */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { readResetToken, verifyResetToken } from '@/lib/password-reset'

const INVALID = 'Ce lien est invalide ou a expiré. Refais une demande de réinitialisation.'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const token = String(body?.token ?? '')
  const password = String(body?.password ?? '')

  if (password.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })
  }

  const parsed = readResetToken(token)
  if (!parsed) return NextResponse.json({ error: INVALID }, { status: 400 })

  const [user] = await db
    .select({ id: profiles.id, passwordHash: profiles.passwordHash })
    .from(profiles)
    .where(eq(profiles.id, parsed.userId))
    .limit(1)

  if (!user || !verifyResetToken(token, user.passwordHash)) {
    return NextResponse.json({ error: INVALID }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await db.update(profiles).set({ passwordHash, updatedAt: new Date() }).where(eq(profiles.id, user.id))

  return NextResponse.json({ ok: true })
}
