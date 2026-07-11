import { and, eq, ilike, inArray, or, sql as rawSql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { candidateSkills, jobSkills, skills } from '@/lib/db/schema'
import type { Skill, SkillSource } from '@/lib/types'
import { matchLevel, normalizeSkillName, type SkillLike } from '@/lib/skills'
import { writeAudit } from './audit'
import { serialize } from './_serialize'

export async function searchSkills(q: string, opts: { limit?: number; statusIn?: string[] } = {}): Promise<Skill[]> {
  const limit = opts.limit ?? 20
  const statusIn = opts.statusIn ?? ['approved']

  const conds = [inArray(skills.status, statusIn)]
  if (q.trim()) {
    const like = `%${q.trim()}%`
    conds.push(or(ilike(skills.name, like), ilike(skills.normalizedName, like))!)
  }

  const rows = await db
    .select()
    .from(skills)
    .where(and(...conds))
    .orderBy(rawSql`(SELECT COUNT(*) FROM ${candidateSkills} WHERE ${candidateSkills.skillId} = ${skills.id}) DESC`, skills.name)
    .limit(limit)

  return serialize<Skill[]>(rows)
}

export async function listSkillsForMatch(): Promise<SkillLike[]> {
  const rows = await db
    .select({ id: skills.id, name: skills.name, normalizedName: skills.normalizedName })
    .from(skills)
    .where(inArray(skills.status, ['approved', 'pending']))
  return rows
}

interface ProposeResult {
  status: 'matched' | 'suggestions' | 'created'
  skill?: Skill
  suggestions?: Skill[]
}

export async function proposeSkill(rawName: string, userId: string, source: SkillSource): Promise<ProposeResult> {
  const name = rawName.trim().slice(0, 60)
  const normalized = normalizeSkillName(name)
  const existing = await listSkillsForMatch()
  const match = matchLevel(normalized, existing)

  if (match.level === 'exact' && match.exact) {
    const [full] = await db.select().from(skills).where(eq(skills.id, match.exact.id))
    return { status: 'matched', skill: serialize<Skill>(full) }
  }

  if (match.level === 'close') {
    const full = await db.select().from(skills).where(inArray(skills.id, match.suggestions.map((s) => s.id)))
    return { status: 'suggestions', suggestions: serialize<Skill[]>(full) }
  }

  const [created] = await db
    .insert(skills)
    .values({ name, normalizedName: normalized, status: 'pending', source, createdById: userId })
    .returning()

  await writeAudit({
    actorId: userId, action: 'skill.propose', targetType: 'skill', targetId: created.id,
    newValues: { name, source },
  })

  return { status: 'created', skill: serialize<Skill>(created) }
}

export async function approveSkill(id: string, approvedById: string): Promise<void> {
  await db.update(skills).set({
    status: 'approved', approvedById, approvedAt: new Date(), updatedAt: new Date(),
  }).where(eq(skills.id, id))
  await writeAudit({ actorId: approvedById, action: 'skill.approve', targetType: 'skill', targetId: id })
}

export async function rejectSkill(id: string, reason: string | null, actorId: string): Promise<void> {
  await db.update(skills).set({
    status: 'rejected', rejectionReason: reason, updatedAt: new Date(),
  }).where(eq(skills.id, id))
  await writeAudit({ actorId, action: 'skill.reject', targetType: 'skill', targetId: id, newValues: { reason } })
}

export async function mergeSkills(sourceId: string, targetId: string, actorId: string): Promise<{ error: string | null }> {
  if (sourceId === targetId) return { error: 'Impossible de fusionner une compétence avec elle-même' }

  const [source] = await db.select().from(skills).where(eq(skills.id, sourceId))
  const [target] = await db.select().from(skills).where(eq(skills.id, targetId))
  if (!source || !target) return { error: 'Compétence introuvable' }

  const candidateLinks = await db.select().from(candidateSkills).where(eq(candidateSkills.skillId, sourceId))
  for (const link of candidateLinks) {
    await db.insert(candidateSkills).values({ candidateId: link.candidateId, skillId: targetId, level: link.level }).onConflictDoNothing()
  }
  await db.delete(candidateSkills).where(eq(candidateSkills.skillId, sourceId))

  const jobLinks = await db.select().from(jobSkills).where(eq(jobSkills.skillId, sourceId))
  for (const link of jobLinks) {
    await db.insert(jobSkills).values({ jobId: link.jobId, skillId: targetId, isRequired: link.isRequired }).onConflictDoNothing()
  }
  await db.delete(jobSkills).where(eq(jobSkills.skillId, sourceId))

  await db.update(skills).set({
    status: 'merged', mergedIntoId: targetId, updatedAt: new Date(),
  }).where(eq(skills.id, sourceId))

  await writeAudit({
    actorId, action: 'skill.merge', targetType: 'skill', targetId: sourceId,
    oldValues: { name: source.name }, newValues: { mergedInto: target.name, mergedIntoId: targetId },
  })

  return { error: null }
}
