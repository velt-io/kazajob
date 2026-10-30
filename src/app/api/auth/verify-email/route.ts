/**
 * KAZAJOB — Lien de confirmation d'email (cliqué depuis la boîte mail).
 * Redirige vers /auth/email-verified avec le résultat.
 */
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { markEmailVerified, readVerifyToken, verifyVerifyToken } from '@/lib/email-verification'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const done = (status: 'ok' | 'invalid') => NextResponse.redirect(new URL(`/email-confirme?status=${status}`, req.url))

  const parsed = readVerifyToken(token)
  if (!parsed) return done('invalid')

  const [user] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, parsed.userId))
    .limit(1)

  if (!user || !verifyVerifyToken(token, user.email)) return done('invalid')

  await markEmailVerified(user.id)
  return done('ok')
}
