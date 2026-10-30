import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createJob, initialJobStatus, listRecruiterJobs } from '@/lib/queries/jobs'
import { canPublishJob, getActiveMembership } from '@/lib/queries/companies'
import { isEmailVerified, UNVERIFIED_PUBLISH_ERROR } from '@/lib/email-verification'

// GET /api/recruiter/jobs — mes offres
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await listRecruiterJobs(userId))
}

// POST /api/recruiter/jobs  { ...payload, status?: 'draft' | 'published', companyId? } → { id }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.role !== 'recruiter' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))

  // L'admin plateforme n'est pas soumis aux quotas d'entreprise.
  let companyId: string | null = body.companyId ?? null
  if (session.user.role !== 'admin') {
    // Permission : seul un membre actif d'une entreprise peut publier.
    const membership = await getActiveMembership(userId)
    if (!membership) {
      return NextResponse.json(
        { error: 'Vous devez rejoindre ou créer une entreprise avant de publier une offre.' },
        { status: 403 },
      )
    }
    companyId = membership.companyId
    // Anti-arnaque : publication réservée aux adresses confirmées (brouillon autorisé).
    if (initialJobStatus(body) === 'published' && !(await isEmailVerified(userId))) {
      return NextResponse.json({ error: UNVERIFIED_PUBLISH_ERROR, code: 'email_unverified' }, { status: 403 })
    }
    // Plafond d'offres actives selon le forfait (un brouillon n'en consomme pas).
    const quota = initialJobStatus(body) === 'published' ? await canPublishJob(companyId) : { ok: true as const }
    if (!quota.ok) {
      const error = quota.reason === 'expired'
        ? 'Votre essai ou abonnement a expiré. Activez votre abonnement pour publier de nouvelles offres.'
        : `Vous avez atteint la limite de ${quota.max} offre(s) active(s) du forfait ${quota.planName}. Désactivez une offre ou passez à un forfait supérieur.`
      return NextResponse.json({ error }, { status: 403 })
    }
  }

  const id = await createJob(userId, body, companyId)
  return NextResponse.json({ id })
}
