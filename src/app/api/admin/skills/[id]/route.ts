import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { deleteSkill } from '@/lib/queries/admin'
import { approveSkill, rejectSkill } from '@/lib/queries/skills'

// DELETE /api/admin/skills/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  await deleteSkill(id)
  return NextResponse.json({ ok: true })
}

// PATCH /api/admin/skills/[id]  { action: 'approve' | 'reject', reason? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  const { action, reason } = await req.json().catch(() => ({}))

  if (action === 'approve') await approveSkill(id, adminId)
  else if (action === 'reject') await rejectSkill(id, reason ?? null, adminId)
  else return NextResponse.json({ error: 'action invalide' }, { status: 400 })

  return NextResponse.json({ ok: true })
}
