import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { duplicatePlan } from '@/lib/queries/plans-admin'

// POST /api/admin/plans/duplicate  { planId }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { planId } = await req.json().catch(() => ({}))
  if (!planId) return NextResponse.json({ error: 'planId requis' }, { status: 400 })

  const { error, newId } = await duplicatePlan(session.user.id, session.user.email ?? null, planId)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true, newId })
}
