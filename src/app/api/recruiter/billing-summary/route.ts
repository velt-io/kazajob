import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getActiveMembership } from '@/lib/queries/companies'
import { getCompanyBillingSummary } from '@/lib/queries/billing-summary'

// GET /api/recruiter/billing-summary → résumé facturation de l'entreprise du recruteur
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const membership = await getActiveMembership(userId)
  if (!membership) return NextResponse.json({ error: 'Aucune entreprise active.' }, { status: 400 })

  const summary = await getCompanyBillingSummary(membership.companyId)
  return NextResponse.json(summary)
}
