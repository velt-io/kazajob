import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { applications, favorites, profiles } from '@/lib/db/schema'
import { computeQuests } from '@/lib/gamification'
import { getCandidateSkills } from './profiles'
import { serialize } from './_serialize'
import type { Profile } from '@/lib/types'

export interface QuestSyncResult {
  xpGained: number
  newXp: number
  newlyCompleted: string[]
}

// Recalcule les quêtes à partir des données réelles en base et attribue l'XP des quêtes
// nouvellement complétées, une seule fois chacune (idempotent via claimed_quests).
export async function syncQuestXp(userId: string): Promise<QuestSyncResult> {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, userId))
  if (!row) return { xpGained: 0, newXp: 0, newlyCompleted: [] }
  const profile = serialize<Profile>(row)

  const [apps, favs, skills] = await Promise.all([
    db.select({ id: applications.id }).from(applications).where(eq(applications.candidateId, userId)),
    db.select({ id: favorites.id }).from(favorites).where(eq(favorites.candidateId, userId)),
    getCandidateSkills(userId),
  ])

  const quests = computeQuests(profile, apps.length, favs.length, skills.length)
  const claimed = new Set(row.claimedQuests ?? [])
  const newlyCompleted = quests.filter((q) => q.completed && !claimed.has(q.id))

  if (newlyCompleted.length === 0) {
    return { xpGained: 0, newXp: row.xp, newlyCompleted: [] }
  }

  const xpGained = newlyCompleted.reduce((sum, q) => sum + q.xpReward, 0)
  const newClaimedIds = [...claimed, ...newlyCompleted.map((q) => q.id)]

  const [updated] = await db.update(profiles)
    .set({
      xp: sql`${profiles.xp} + ${xpGained}`,
      claimedQuests: newClaimedIds,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning({ xp: profiles.xp })

  return { xpGained, newXp: updated.xp, newlyCompleted: newlyCompleted.map((q) => q.id) }
}
