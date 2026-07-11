import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { proposeSkill } from '@/lib/queries/skills'
import type { SkillSource } from '@/lib/types'

// POST /api/skills/propose  { name }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { name } = await req.json().catch(() => ({}))
  if (!name?.trim()) return NextResponse.json({ error: 'name requis' }, { status: 400 })
  if (name.trim().length > 60) return NextResponse.json({ error: 'Nom trop long (60 caractères max)' }, { status: 400 })

  const source: SkillSource = role === 'recruiter' ? 'recruiter' : 'candidate'
  const result = await proposeSkill(name, userId, source)
  return NextResponse.json(result)
}
