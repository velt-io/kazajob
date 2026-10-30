import type { Metadata } from 'next'
import { NavLanding } from '@/components/layout/NavLanding'
import { Footer } from '@/components/layout/Footer'
import { EnterpriseLanding } from '@/components/landing/EnterpriseLanding'
import { KZ } from '@/lib/constants'
import { getCachedLandingData, getCachedLaunchPublicData } from '@/lib/queries/cached'
import { launchDaysLeft } from '@/lib/launch'

// Page pré-générée (ISR) : bascule candidat ↔ recruteur instantanée.
export const revalidate = 300

export const metadata: Metadata = {
  title: 'Recruter à La Réunion — Publiez vos offres d\'emploi 974',
  description:
    'Recrutez les meilleurs talents de La Réunion avec Kazajob : offres illimitées, tri IA des candidatures, pipeline Kanban, multidiffusion. Lancement gratuit, sans carte bancaire.',
  alternates: { canonical: 'https://kazajob.re/entreprise' },
  openGraph: {
    url: 'https://kazajob.re/entreprise',
    title: 'Kazajob Entreprises — Recrutez les talents du 974',
    description: 'Offres illimitées, tri IA, pipeline Kanban. Le recrutement local, simple et rapide.',
    images: ['/kazajob.png'],
  },
}

export default async function EnterprisePage() {
  const [{ stats }, launchData] = await Promise.all([
    getCachedLandingData(),
    getCachedLaunchPublicData(),
  ])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: KZ.cream }}>
      <NavLanding view="entreprise" />
      <EnterpriseLanding stats={stats} launchDays={launchDaysLeft(launchData?.endsAt ?? null)} />
      <Footer />
    </div>
  )
}
