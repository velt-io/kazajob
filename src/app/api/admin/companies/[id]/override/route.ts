import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { setCompanyOverride, type AdminOverridePatch } from '@/lib/queries/plans-admin'

// PATCH /api/admin/companies/[id]/override  { adminOverrideEnabled, overrideMaxActiveJobs, overrideReason, overrideUntil }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { id: companyId } = await params
  const body = await req.json().catch(() => ({})) as AdminOverridePatch

  const { error } = await setCompanyOverride(
    session.user.id, session.user.email ?? null, companyId, body,
  )
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
