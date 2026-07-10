import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createIntegration, listIntegrations, type IntegrationInput } from '@/lib/queries/tracking'

// GET /api/admin/tracking
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  return NextResponse.json(await listIntegrations())
}

// POST /api/admin/tracking
export async function POST(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as Partial<IntegrationInput>
  if (!body.name?.trim() || !body.provider || !body.placement || !body.environment || !body.consentCategory) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }
  if (body.provider === 'custom' && !body.customCode?.trim()) {
    return NextResponse.json({ error: 'customCode requis pour un script personnalisé' }, { status: 400 })
  }
  if (body.provider !== 'custom' && !body.identifier?.trim()) {
    return NextResponse.json({ error: 'identifier requis pour ce fournisseur' }, { status: 400 })
  }

  const created = await createIntegration(body as IntegrationInput, adminId)
  return NextResponse.json(created)
}
