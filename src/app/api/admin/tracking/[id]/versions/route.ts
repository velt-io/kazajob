import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { listVersions } from '@/lib/queries/tracking'

// GET /api/admin/tracking/[id]/versions
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  return NextResponse.json(await listVersions(id))
}
