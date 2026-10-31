import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Routes publiques sous /candidate accessibles sans connexion (SEO + visiteurs)
const PUBLIC_CANDIDATE_PATHS = ['/candidat/offres', '/candidat/formations']

const DASHBOARD: Record<string, string> = {
  candidate: '/candidat/tableau-de-bord',
  recruiter: '/recruteur/tableau-de-bord',
  admin:     '/admin/tableau-de-bord',
}

export default auth((request) => {
  const user = request.auth?.user
  const role = user?.role ?? 'candidate'
  const path = request.nextUrl.pathname

  // Onboarding — protégé
  if (path.startsWith('/premiers-pas') && !user) {
    return NextResponse.redirect(new URL('/inscription', request.url))
  }

  // Routes auth → rediriger si déjà connecté
  if (user && (path === '/connexion' || path === '/inscription')) {
    return NextResponse.redirect(new URL(DASHBOARD[role] ?? DASHBOARD.candidate, request.url))
  }

  // Routes protégées
  const isPublicCandidatePath = PUBLIC_CANDIDATE_PATHS.some(p =>
    path === p || path.startsWith(p + '/')
  )
  const protectedPrefixes = ['/candidat', '/recruteur', '/admin']
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p)) && !isPublicCandidatePath

  if (isProtected && !user) {
    const next = encodeURIComponent(path)
    return NextResponse.redirect(new URL(`/connexion?next=${next}`, request.url))
  }

  // Vérification du rôle — STRICT
  if (user && isProtected) {
    // Accès /candidate → réservé aux candidats et admins
    if (path.startsWith('/candidat') && role !== 'candidate' && role !== 'admin') {
      return NextResponse.redirect(new URL(DASHBOARD[role] ?? DASHBOARD.candidate, request.url))
    }
    // Accès /recruiter → réservé aux recruteurs et admins
    if (path.startsWith('/recruteur') && role !== 'recruiter' && role !== 'admin') {
      return NextResponse.redirect(new URL(DASHBOARD[role] ?? DASHBOARD.candidate, request.url))
    }
    // Accès /admin → réservé aux admins uniquement
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(DASHBOARD[role] ?? DASHBOARD.candidate, request.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
