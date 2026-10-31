'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, MapPin, Clock, Euro, Search, CalendarCheck, X } from 'lucide-react'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { CERTIFICATION_LEVELS } from '@/lib/constants'
import type { TrainingOffer } from '@/lib/types'
import { GlassEmpty, LargeTitle, Pill, markGradient } from '@/components/os/candidate/primitives'

const certLabel = (id: string) =>
  CERTIFICATION_LEVELS.find(c => c.id === id)?.label ?? id

export default function CandidateTrainingPage() {
  const [offers, setOffers]   = useState<TrainingOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/trainings')
        if (res.ok) setOffers((await res.json()) as TrainingOffer[])
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = search
    ? offers.filter(o =>
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.location.toLowerCase().includes(search.toLowerCase()) ||
        (o.certification ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : offers

  if (loading) return <PageLoader />

  return (
    <div className="max-w-[1180px] mx-auto">
      <LargeTitle
        eyebrow="Se former à La Réunion"
        title="Formations"
        subtitle={`${offers.length} formation${offers.length > 1 ? 's' : ''} disponible${offers.length > 1 ? 's' : ''} en 974`}
      />

      <label className="os-glass flex items-center gap-3 h-14 px-5 mb-8 rounded-[22px] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--kz-blue)_55%,transparent)] transition">
        <Search size={18} className="text-[var(--kz-mute)] shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Formation, certification, ville…"
          aria-label="Rechercher une formation"
          className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[var(--kz-ink)] placeholder:text-[var(--kz-mute)]"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} aria-label="Effacer la recherche"
            className="osc-press osc-fade w-6 h-6 rounded-full flex items-center justify-center bg-[var(--kz-mute)] text-[var(--kz-inverse)] shrink-0">
            <X size={13} strokeWidth={3} />
          </button>
        )}
      </label>

      {filtered.length === 0 ? (
        <GlassEmpty title="Aucune formation trouvée" description="Essaie un autre mot-clé ou une autre ville." icon={<GraduationCap size={26} />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((offer, i) => (
            <Link key={offer.id} href={`/candidate/training/${offer.id}`} className="block group rounded-[26px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]">
              <article className="osc-card osc-in osc-lift !rounded-[26px] overflow-hidden flex flex-col h-full" style={{ ['--i' as string]: i }}>
                {/* Visuel */}
                <div className="h-40 relative overflow-hidden" style={{ background: markGradient(offer.company?.name ?? offer.title) }}>
                  {offer.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.image_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/85">
                      <GraduationCap size={44} strokeWidth={1.5} />
                    </div>
                  )}
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(0,0,0,0.55))]" />
                  {offer.info_session && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-semibold text-black bg-[var(--kz-green)]">
                      <CalendarCheck size={11} /> Session d&apos;info
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-2.5 flex-1">
                  <div className="text-[12px] font-medium text-[var(--kz-mute)] truncate">{offer.company?.name ?? 'Organisme de formation'}</div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)] leading-snug line-clamp-2">{offer.title}</h3>

                  <div className="flex flex-wrap gap-1.5">
                    {offer.certification_level && <Pill tone="violet">{certLabel(offer.certification_level)}</Pill>}
                    {offer.is_financed && <Pill tone="green">Financée</Pill>}
                    {offer.remote && <Pill tone="blue">Distanciel</Pill>}
                  </div>

                  <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-[var(--kz-line)] text-[12px] text-[var(--kz-text)]">
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-[var(--kz-mute)]" />{offer.duration_value} {offer.duration_unit}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[var(--kz-mute)]" />{offer.location}</span>
                    {offer.financing_options.length > 0 && (
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Euro size={12} className="text-[var(--kz-mute)] shrink-0" />
                        <span className="truncate">
                          {offer.financing_options.slice(0, 2).join(' · ')}
                          {offer.financing_options.length > 2 && ` +${offer.financing_options.length - 2}`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
