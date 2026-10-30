import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { rollbackToVersion } from '@/lib/queries/tracking'

// POST /api/admin/tracking/[id]/rollback  { versionId }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  const { versionId } = await req.json().catch(() => ({}))
  if (!versionId) return NextResponse.json({ error: 'versionId requis' }, { status: 400 })

  const { error } = await rollbackToVersion(id, versionId, adminId)
  if (error) return NextResponse.json({ error }, { status: 400 })
  revalidateTag('tracking', 'max')
  return NextResponse.json({ ok: true })
}
