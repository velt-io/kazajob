import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { syncQuestXp } from '@/lib/queries/gamification'

// POST /api/gamification/sync — recalcule et attribue l'XP des quêtes nouvellement complétées
export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { xpGained, newXp, newlyCompleted } = await syncQuestXp(userId)
  return NextResponse.json({ xp_gained: xpGained, new_xp: newXp, newly_completed: newlyCompleted })
}
