/**
 * KAZAJOB — Versions mises en cache des lectures publiques (landing, layout racine).
 *
 * Permet de pré-générer les pages publiques (ISR) au lieu d'interroger Neon à chaque
 * visite : la bascule candidat ↔ entreprise devient instantanée.
 * Les mutations admin invalident les tags correspondants (revalidateTag).
 */
import { unstable_cache } from 'next/cache'
import { getLandingData } from './landing'
import { getActiveLaunchPublicData } from './launch'
import { getActiveIntegrations } from './tracking'

export const CACHE_TAGS = {
  landing:  'landing',
  launch:   'launch',
  tracking: 'tracking',
} as const

const EMPTY_LANDING: Awaited<ReturnType<typeof getLandingData>> = {
  featuredJobs: [],
  companies: [],
  stats: { jobs: 0, companies: 0, users: 0 },
}

const landingCache = unstable_cache(getLandingData, ['landing-data'], {
  revalidate: 300, tags: [CACHE_TAGS.landing],
})
const launchCache = unstable_cache(getActiveLaunchPublicData, ['launch-public'], {
  revalidate: 300, tags: [CACHE_TAGS.launch],
})
const trackingCache = unstable_cache(getActiveIntegrations, ['tracking-active'], {
  revalidate: 300, tags: [CACHE_TAGS.tracking],
})

// Les erreurs sont rattrapées HORS du cache : une panne Neon ne met pas en cache
// un résultat vide, et la page reste servie au lieu de renvoyer une 500.
export async function getCachedLandingData() {
  return landingCache().catch(() => EMPTY_LANDING)
}

export async function getCachedLaunchPublicData() {
  return launchCache().catch(() => null)
}

export async function getCachedActiveIntegrations(environment: 'production' | 'staging') {
  return trackingCache(environment).catch(() => [])
}
