import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { archivePlan } from '@/lib/queries/plans-admin'

// POST /api/admin/plans/archive  { planId }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { planId } = await req.json().catch(() => ({}))
  if (!planId) return NextResponse.json({ error: 'planId requis' }, { status: 400 })

  const { error } = await archivePlan(session.user.id, session.user.email ?? null, planId)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
