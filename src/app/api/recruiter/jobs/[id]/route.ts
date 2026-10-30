import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { changeJobStatus, deleteRecruiterJob, getRecruiterJob, updateJob } from '@/lib/queries/jobs'
import { canPublishJob } from '@/lib/queries/companies'
import type { JobAction } from '@/lib/job-lifecycle'
import { isEmailVerified, UNVERIFIED_PUBLISH_ERROR } from '@/lib/email-verification'

async function requireUser() {
  const session = await auth()
  return session?.user?.id ?? null
}
const statusFor = (e: string) => (e === 'Non autorisé' ? 403 : 404)

// GET /api/recruiter/jobs/[id] — offre brute (édition)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const job = await getRecruiterJob(userId, id)
  if (!job) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json(job)
}

const RECRUITER_ACTIONS: JobAction[] = ['publish', 'pause', 'archive']

// PATCH /api/recruiter/jobs/[id]
//   { action: 'publish' | 'pause' | 'archive' } → change le statut (cf. job-lifecycle)
//   { ...champs }                               → modifie le contenu, sans toucher au statut
//   { is_active: boolean }                      → ancien format, équivaut à publish / pause
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  // Ancien format accepté uniquement seul : { is_active } dans une édition de contenu est ignoré.
  const legacyToggle = typeof body.is_active === 'boolean' && Object.keys(body).length === 1
  const action: JobAction | undefined = RECRUITER_ACTIONS.includes(body.action)
    ? body.action
    : legacyToggle ? (body.is_active ? 'publish' : 'pause') : undefined

  if (action) {
    const job = await getRecruiterJob(userId, id)
    if (!job) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
    if (action === 'publish' && !(await isEmailVerified(userId))) {
      return NextResponse.json({ error: UNVERIFIED_PUBLISH_ERROR, code: 'email_unverified' }, { status: 403 })
    }
    // Mise en ligne : revérifier le plafond du forfait.
    if (action === 'publish' && !job.is_active && job.company_id) {
      const quota = await canPublishJob(job.company_id)
      if (!quota.ok) {
        const error = quota.reason === 'expired'
          ? 'Votre essai ou abonnement a expiré. Activez votre abonnement pour publier des offres.'
          : `Limite de ${quota.max} offre(s) en ligne atteinte (forfait ${quota.planName}). Mettez une autre offre en pause d'abord.`
        return NextResponse.json({ error }, { status: 403 })
      }
    }
    const result = await changeJobStatus(id, action, 'recruiter')
    if (result.error) return NextResponse.json({ error: result.error }, { status: 409 })
    return NextResponse.json({ ok: true, status: result.status })
  }

  const result = await updateJob(userId, id, body)
  if (result.error) return NextResponse.json({ error: result.error }, { status: statusFor(result.error) })
  return NextResponse.json({ ok: true })
}

// DELETE /api/recruiter/jobs/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  const result = await deleteRecruiterJob(userId, id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: statusFor(result.error) })
  return NextResponse.json({ ok: true })
}
