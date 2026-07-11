import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateProfile } from '@/lib/queries/profiles'

// PATCH /api/profile  { ...champs autorisés }
export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const patch = await req.json().catch(() => null)
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  try {
    await updateProfile(userId, patch)
  } catch (err) {
    console.error('[api/profile] échec update', String(err).slice(0, 300))
    return NextResponse.json({ error: 'Échec de l\'enregistrement' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
