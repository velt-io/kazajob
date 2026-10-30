/**
 * KAZAJOB — Requêtes Drizzle pour les offres (jobs).
 * Couche serveur uniquement. Renvoie des objets conformes à `Job` (snake_case).
 */
import { cache } from 'react'
import { and, asc, desc, eq, gte, ilike, inArray, lt, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { candidateSkills, jobs, notifications, profiles, skills } from '@/lib/db/schema'
import type { Job, JobFilters } from '@/lib/types'
import {
  jobStatusPatch, nextJobStatus, resolveJobStatus,
  type JobAction, type JobActor, type JobStatus,
} from '@/lib/job-lifecycle'
import { matchScore } from '@/lib/utils'
import { serialize } from './_serialize'

export const getJobSeo = cache(async (id: string) => {
  const row = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    columns: {
      title: true, description: true, location: true, remote: true, jobType: true,
      salaryMin: true, salaryMax: true, isActive: true, status: true, createdAt: true,
    },
    with: { company: { columns: { name: true } } },
  })
  if (!row || !isPubliclyViewable(row.status)) return null
  const r = row as typeof row & { company?: { name: string } | null }
  return {
    title: r.title, description: r.description, location: r.location, remote: r.remote,
    jobType: r.jobType, salaryMin: r.salaryMin, salaryMax: r.salaryMax,
    isActive: r.isActive, createdAt: r.createdAt, company: r.company?.name ?? null,
  }
})

/** Brouillons et offres suspendues : jamais exposés publiquement (404). */
function isPubliclyViewable(status: string | null | undefined): boolean {
  return status !== 'draft' && status !== 'suspended'
}

type JobRow = typeof jobs.$inferSelect & {
  company: unknown
  jobSkills: Array<{ skill: unknown }>
}

function mapJob(row: JobRow): Job {
  const { jobSkills, company, ...rest } = row
  // Annonce externe (admin sans entreprise) → on affiche le nom saisi.
  const ext = (row as { externalCompany?: string | null }).externalCompany
  return serialize<Job>({
    ...rest,
    company: company ?? (ext ? { name: ext } : null),
    skills: jobSkills?.map((js) => js.skill) ?? [],
  })
}

function buildwhere(f: JobFilters): SQL | undefined {
  const conds: SQL[] = [eq(jobs.isActive, true)]
  if (f.q) conds.push(or(ilike(jobs.title, `%${f.q}%`), ilike(jobs.description, `%${f.q}%`))!)
  if (f.locations && f.locations.length > 0) {
    conds.push(inArray(jobs.location, f.locations))
  } else if (f.location) {
    conds.push(eq(jobs.location, f.location))
  }
  if (f.job_type) conds.push(eq(jobs.jobType, f.job_type))
  if (f.sector) conds.push(eq(jobs.sector, f.sector))
  if (f.remote !== undefined) conds.push(eq(jobs.remote, f.remote))
  if (f.salary_min) conds.push(gte(jobs.salaryMin, f.salary_min))
  if (f.date_range === 'week') conds.push(gte(jobs.createdAt, new Date(Date.now() - 7 * 86_400_000)))
  else if (f.date_range === 'month') conds.push(gte(jobs.createdAt, new Date(Date.now() - 30 * 86_400_000)))
  if (f.level) conds.push(eq(jobs.requiredLevel, f.level))
  if (f.internship_paid !== undefined) conds.push(eq(jobs.internshipPaid, f.internship_paid))
  if (f.internship_duration) conds.push(eq(jobs.internshipDuration, f.internship_duration))
  return and(...conds)
}

export async function listJobs(f: JobFilters): Promise<{ data: Job[]; count: number }> {
  const page = f.page ?? 1
  const limit = f.limit ?? 12
  const offset = (page - 1) * limit
  const where = buildwhere(f)

  const rows = await db.query.jobs.findMany({
    where,
    with: { company: true, jobSkills: { with: { skill: true } } },
    orderBy: (j, { asc: a, desc: d }) =>
      f.sort === 'salary_desc' ? [d(j.isBoosted), d(j.salaryMax)] :
      f.sort === 'salary_asc'  ? [d(j.isBoosted), a(j.salaryMin)] :
      [d(j.isBoosted), d(j.createdAt)],
    limit,
    offset,
  })

  const [{ value }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(jobs)
    .where(where)

  return { data: (rows as JobRow[]).map(mapJob), count: value }
}

/**
 * Offres recommandées pour un candidat — matching réel.
 * Score = 60% compétences (part des compétences requises possédées)
 *       + 25% localisation (même ville) + 15% base. Trié décroissant.
 */
export async function getRecommendedJobs(candidateId: string, limit = 4): Promise<Job[]> {
  // Compétences techniques du candidat
  const cand = await db
    .select({ name: skills.name })
    .from(candidateSkills)
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(eq(candidateSkills.candidateId, candidateId))
  const candidateSkillNames = cand.map((s) => s.name)

  const [prof] = await db
    .select({ location: profiles.location })
    .from(profiles).where(eq(profiles.id, candidateId)).limit(1)
  const candLoc = prof?.location?.toLowerCase().split(',')[0]?.trim() ?? ''

  const rows = await db.query.jobs.findMany({
    where: eq(jobs.isActive, true),
    with: { company: true, jobSkills: { with: { skill: true } } },
    orderBy: (j, { desc: d }) => [d(j.isBoosted), d(j.createdAt)],
    limit: 60,
  })

  const scored = (rows as JobRow[]).map(mapJob).map((job) => {
    const jobSkillNames = (job.skills ?? []).map((s) => s.name)
    const skillScore = matchScore(candidateSkillNames, jobSkillNames)
    const jobLoc = job.location?.toLowerCase().split(',')[0]?.trim() ?? ''
    const locMatch = !!candLoc && !!jobLoc && (jobLoc.includes(candLoc) || candLoc.includes(jobLoc))
    const match_score = Math.min(100, Math.round(0.6 * skillScore + 0.25 * (locMatch ? 100 : 0) + 15))
    return { ...job, match_score }
  })

  scored.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
  return scored.slice(0, limit)
}

export async function getJobOwner(jobId: string): Promise<{ recruiterId: string; title: string } | null> {
  const [row] = await db
    .select({ recruiterId: jobs.recruiterId, title: jobs.title })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1)
  return row ?? null
}

export async function activateJobBoost(jobId: string, days: number): Promise<void> {
  if (!days || days <= 0) return
  // Prolonge depuis l'échéance en cours si déjà boostée, sinon depuis maintenant
  const [cur] = await db
    .select({ expiresAt: jobs.boostExpiresAt, boosted: jobs.isBoosted })
    .from(jobs).where(eq(jobs.id, jobId)).limit(1)
  const base = cur?.boosted && cur.expiresAt && cur.expiresAt > new Date() ? cur.expiresAt : new Date()
  const expires = new Date(base.getTime() + days * 86_400_000)
  await db.update(jobs)
    .set({ isBoosted: true, boostExpiresAt: expires })
    .where(eq(jobs.id, jobId))
}

export async function expireJobBoosts(): Promise<number> {
  const rows = await db.update(jobs)
    .set({ isBoosted: false })
    .where(and(eq(jobs.isBoosted, true), lt(jobs.boostExpiresAt, new Date())))
    .returning({ id: jobs.id })
  return rows.length
}

export async function listRecruiterJobs(recruiterId: string): Promise<Job[]> {
  const rows = await db.query.jobs.findMany({
    where: eq(jobs.recruiterId, recruiterId),
    with: {
      company: { columns: { name: true, logoUrl: true } },
      publisher: { columns: { fullName: true } },
    },
    orderBy: (j, { desc: d }) => [d(j.createdAt)],
  })
  return serialize<Job[]>(rows)
}

export async function getRecruiterJob(recruiterId: string, id: string): Promise<Job | null> {
  const [row] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1)
  if (!row || row.recruiterId !== recruiterId) return null
  return serialize<Job>(row)
}

// Champs d'offre modifiables : clé API (snake_case) → colonne Drizzle.
const JOB_FIELDS: Record<string, keyof typeof jobs.$inferInsert> = {
  title: 'title', description: 'description', requirements: 'requirements',
  location: 'location', job_type: 'jobType', sector: 'sector', remote: 'remote',
  salary_min: 'salaryMin', salary_max: 'salaryMax', salary_currency: 'salaryCurrency',
  is_anonymous: 'isAnonymous',
  prequal_questions: 'prequalQuestions',
  missions: 'missions', benefits: 'benefits', required_level: 'requiredLevel',
  contact_email: 'contactEmail', external_company: 'externalCompany',
  internship_duration: 'internshipDuration', internship_paid: 'internshipPaid',
  internship_compensation: 'internshipCompensation',
  internship_agreement_required: 'internshipAgreementRequired',
}

function mapJobPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const set: Record<string, unknown> = {}
  for (const [apiKey, col] of Object.entries(JOB_FIELDS)) {
    if (apiKey in payload) set[col] = payload[apiKey]
  }
  return set
}

/** Statut initial demandé à la création : brouillon ou publication immédiate (défaut). */
export function initialJobStatus(payload: Record<string, unknown>): JobStatus {
  return payload.status === 'draft' ? 'draft' : 'published'
}

export async function createJob(
  recruiterId: string,
  payload: Record<string, unknown>,
  companyId: string | null,
): Promise<string | undefined> {
  const values = {
    ...mapJobPayload(payload),
    ...jobStatusPatch(initialJobStatus(payload)),
    recruiterId,
    publishedBy: recruiterId,
    companyId: companyId ?? null,
  } as typeof jobs.$inferInsert
  const [row] = await db.insert(jobs).values(values).returning({ id: jobs.id })
  return row?.id
}

export async function updateJob(
  recruiterId: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const [job] = await db.select({ recruiterId: jobs.recruiterId }).from(jobs).where(eq(jobs.id, id)).limit(1)
  if (!job) return { error: 'Offre introuvable' }
  if (job.recruiterId !== recruiterId) return { error: 'Non autorisé' }

  const set = mapJobPayload(payload)
  if (Object.keys(set).length > 0) {
    set.updatedAt = new Date()
    await db.update(jobs).set(set as Partial<typeof jobs.$inferInsert>).where(eq(jobs.id, id))
  }
  return { error: null }
}

/**
 * Change le statut d'une offre (publier, mettre en pause, archiver, suspendre).
 * Le contrôle du propriétaire et du quota est fait par l'appelant.
 */
export async function changeJobStatus(
  id: string,
  action: JobAction,
  actor: JobActor,
): Promise<{ error: string | null; status?: JobStatus }> {
  const [job] = await db.select({ status: jobs.status, isActive: jobs.isActive }).from(jobs).where(eq(jobs.id, id)).limit(1)
  if (!job) return { error: 'Offre introuvable' }
  const current = resolveJobStatus({ status: job.status, is_active: job.isActive })
  const next = nextJobStatus(current, action, actor)
  if (!next) {
    return {
      error: current === 'suspended'
        ? 'Cette offre a été suspendue par la modération Kazajob. Contactez-nous pour la rétablir.'
        : 'Action impossible pour une offre dans cet état.',
    }
  }
  await db.update(jobs).set({ ...jobStatusPatch(next), updatedAt: new Date() }).where(eq(jobs.id, id))
  return { error: null, status: next }
}

/**
 * Cron quotidien : passe en « expirée » les offres publiées arrivées à échéance
 * et prévient le recruteur (notification in-app).
 */
export async function expirePublishedJobs(): Promise<number> {
  const rows = await db.update(jobs)
    .set({ ...jobStatusPatch('expired'), updatedAt: new Date() })
    .where(and(eq(jobs.status, 'published'), lt(jobs.expiresAt, new Date())))
    .returning({ id: jobs.id, recruiterId: jobs.recruiterId, title: jobs.title })
  if (rows.length > 0) {
    await db.insert(notifications).values(rows.map((r) => ({
      userId: r.recruiterId,
      type: 'job_expired',
      title: 'Offre expirée',
      message: `« ${r.title} » n'est plus visible des candidats. Republiez-la en un clic pour 60 jours de plus.`,
      link: '/recruteur/offres?status=expired',
      data: { jobId: r.id },
    })))
  }
  return rows.length
}

export async function deleteRecruiterJob(recruiterId: string, id: string): Promise<{ error: string | null }> {
  const [job] = await db.select({ recruiterId: jobs.recruiterId }).from(jobs).where(eq(jobs.id, id)).limit(1)
  if (!job) return { error: 'Offre introuvable' }
  if (job.recruiterId !== recruiterId) return { error: 'Non autorisé' }
  await db.delete(jobs).where(eq(jobs.id, id))
  return { error: null }
}

export async function getJobAIContext(id: string): Promise<{
  title: string; description: string; location: string; job_type: string
  company_name: string; skills: string[]
  salary_min: number | null; salary_max: number | null; requirements: string | null
} | null> {
  const row = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    columns: { title: true, description: true, location: true, jobType: true, salaryMin: true, salaryMax: true, requirements: true },
    with: {
      company: { columns: { name: true } },
      jobSkills: { with: { skill: { columns: { name: true } } } },
    },
  })
  if (!row) return null
  const r = row as typeof row & {
    company?: { name: string } | null
    jobSkills?: Array<{ skill?: { name: string } | null }>
  }
  return {
    title: r.title,
    description: r.description,
    location: r.location,
    job_type: r.jobType,
    company_name: r.company?.name ?? "l'entreprise",
    skills: (r.jobSkills ?? []).map((js) => js.skill?.name).filter(Boolean) as string[],
    salary_min: r.salaryMin ?? null,
    salary_max: r.salaryMax ?? null,
    requirements: r.requirements ?? null,
  }
}

export async function getJob(id: string): Promise<Job | null> {
  const row = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    with: { company: true, jobSkills: { with: { skill: true } } },
  })
  if (!row || !isPubliclyViewable(row.status)) return null

  if (row.isActive) {
    await db
      .update(jobs)
      .set({ views: sql`${jobs.views} + 1` })
      .where(eq(jobs.id, id))
  }

  return mapJob(row as JobRow)
}
