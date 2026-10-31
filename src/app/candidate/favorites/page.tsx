'use client'

import { Heart, ArrowUpRight } from 'lucide-react'
import { JobCard } from '@/components/cards/JobCard'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { GlassEmpty, LargeTitle } from '@/components/os/candidate/primitives'

export default function FavoritesPage() {
  const { profile } = useAuth()
  const { favorites, loading, isFavorite, toggle } = useFavorites(profile?.id)

  return (
    <div className="max-w-[1180px] mx-auto">
      <LargeTitle
        eyebrow="Ma sélection"
        title="Favoris"
        subtitle={`${favorites.length} offre${favorites.length > 1 ? 's' : ''} sauvegardée${favorites.length > 1 ? 's' : ''}`}
        actions={favorites.length > 0 ? <Link href="/candidate/jobs"><Button kind="outline" size="md" iconRight={<ArrowUpRight size={15} />}>Explorer</Button></Link> : undefined}
      />

      {loading ? (
        <PageLoader />
      ) : favorites.length === 0 ? (
        <GlassEmpty
          title="Aucun favori pour l'instant"
          description="Touche le cœur d'une offre pour la retrouver ici en un geste."
          icon={<Heart size={26} />}
          action={<Link href="/candidate/jobs"><Button kind="primary">Explorer les offres</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((fav, i) => (
            fav.job && (
              <JobCard
                key={fav.id}
                job={fav.job}
                index={i}
                isFavorite={isFavorite(fav.job.id)}
                onToggleFavorite={toggle}
              />
            )
          ))}
        </div>
      )}
    </div>
  )
}
