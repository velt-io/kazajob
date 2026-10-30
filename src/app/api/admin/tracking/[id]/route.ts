import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { deleteIntegration, toggleIntegrationActive, updateIntegration, type IntegrationInput } from '@/lib/queries/tracking'

// PATCH /api/admin/tracking/[id]  { ...champs } ou { isActive }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => ({})) as Partial<IntegrationInput>

  if (Object.keys(body).length === 1 && 'isActive' in body) {
    await toggleIntegrationActive(id, !!body.isActive, adminId)
    revalidateTag('tracking', 'max')
    return NextResponse.json({ ok: true })
  }

  await updateIntegration(id, body, adminId)
  revalidateTag('tracking', 'max')
  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/tracking/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  const { id } = await params
  await deleteIntegration(id, adminId)
  revalidateTag('tracking', 'max')
  return NextResponse.json({ ok: true })
}
