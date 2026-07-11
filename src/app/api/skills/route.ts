import { NextRequest, NextResponse } from 'next/server'
import { listSkills } from '@/lib/queries/profiles'
import { searchSkills } from '@/lib/queries/skills'

// GET /api/skills            — référentiel complet
// GET /api/skills?q=...      — recherche paginée sur les compétences approuvées
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (q === null) return NextResponse.json(await listSkills())
  return NextResponse.json(await searchSkills(q, { limit: 20 }))
}
