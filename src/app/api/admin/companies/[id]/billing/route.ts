import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCompanyBillingSummary } from '@/lib/queries/billing-summary'

// GET /api/admin/companies/[id]/billing → résumé facturation d'une entreprise (admin)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { id: companyId } = await params
  const summary = await getCompanyBillingSummary(companyId)
  return NextResponse.json(summary)
}
