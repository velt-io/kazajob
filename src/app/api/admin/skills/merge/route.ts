import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { mergeSkills } from '@/lib/queries/skills'

// POST /api/admin/skills/merge  { sourceId, targetId }
export async function POST(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const { sourceId, targetId } = await req.json().catch(() => ({}))
  if (!sourceId || !targetId) return NextResponse.json({ error: 'sourceId et targetId requis' }, { status: 400 })

  const { error } = await mergeSkills(sourceId, targetId, adminId)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
