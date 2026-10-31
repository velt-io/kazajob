'use client'

import { Heart, ScrollText } from 'lucide-react'
import { JobCard } from '@/components/cards/JobCard'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import Link from 'next/link'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { QuestEmpty, QuestPageHeader, SPELL_LINK } from '@/components/quest/candidat/QuestKit'

export default function FavoritesPage() {
  const { profile } = useAuth()
  const { favorites, loading, isFavorite, toggle } = useFavorites(profile?.id)

  return (
    <div className="max-w-[1200px] mx-auto">
      <QuestPageHeader
        eyebrow="Grimoire des primes"
        title="Mes"
        accent="favoris"
        icon={<Heart size={20} />}
        subtitle={`${favorites.length} prime${favorites.length > 1 ? 's' : ''} marquée${favorites.length > 1 ? 's' : ''} dans ton grimoire`}
      />

      {loading ? (
        <PageLoader />
      ) : favorites.length === 0 ? (
        <QuestEmpty
          title="Ton grimoire est vide"
          description="Sauvegarde les offres qui t'intéressent pour les retrouver facilement."
          icon={<Heart size={28} />}
          action={<Link href="/candidat/offres" className={SPELL_LINK}><ScrollText size={15} aria-hidden />Explorer les offres</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 pt-2 qxc-stagger">
          {favorites.map((fav) => (
            fav.job && (
              <JobCard
                key={fav.id}
                job={fav.job}
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
