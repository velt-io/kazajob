'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, MapPin, Clock, Euro, Search, CalendarCheck, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { CERTIFICATION_LEVELS } from '@/lib/constants'
import type { TrainingOffer } from '@/lib/types'
import { QuestEmpty, QuestPageHeader } from '@/components/quest/candidat/QuestKit'

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
    <div className="max-w-[1100px] mx-auto">
      <QuestPageHeader
        eyebrow="Académie de la guilde"
        title="Offres de"
        accent="formation"
        icon={<GraduationCap size={20} />}
        subtitle={`${offers.length} formation${offers.length > 1 ? 's' : ''} disponible${offers.length > 1 ? 's' : ''} à La Réunion 974 · gagne de nouveaux talents.`}
      />

      <div className="qx-panel p-3 sm:p-4 mb-5 qx-rise" style={{ animationDelay: '0.08s' }} role="search">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une formation, certification, ville..."
          aria-label="Rechercher une formation, certification ou ville"
          icon={<Search size={15} />}
        />
      </div>

      {filtered.length === 0 ? (
        <QuestEmpty title="Aucune formation trouvée" icon={<GraduationCap size={28} />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 qxc-stagger">
          {filtered.map(offer => (
            <Link key={offer.id} href={`/candidat/formations/${offer.id}`} className="block rounded-[18px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/50">
              <article data-tilt className="qxc-card overflow-hidden flex flex-col h-full" style={{ ['--r' as string]: offer.is_financed ? '#4ADE80' : 'var(--qx-cyan)' }}>
                {/* Image */}
                <div className="h-36 relative overflow-hidden rounded-t-[18px] bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.25),rgba(46,16,101,0.9))]">
                  {offer.image_url ? (
                    <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={44} className="text-[var(--qx-cyan)] drop-shadow-[0_0_14px_rgba(34,211,238,0.8)]" aria-hidden />
                    </div>
                  )}
                  <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(18,9,34,0.85))]" />
                  {/* Session IC */}
                  {offer.info_session && (
                    <div className="absolute top-2 right-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border border-[#4ADE80]/50 bg-[rgba(12,5,24,0.75)] text-[#86EFAC]">
                        <CalendarCheck size={10} aria-hidden /> Session IC
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--kz-mute)] truncate">{offer.company?.name ?? 'Organisme de formation'}</div>
                  <h3 className="text-[15px] font-bold text-white leading-tight line-clamp-2 font-[family-name:var(--font-epic)] tracking-wide">{offer.title}</h3>

                  <div className="flex flex-wrap gap-1.5">
                    {offer.certification_level && (
                      <span className="text-[10px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-md text-[#D8B4FE] border border-[#A855F7]/45 bg-[rgba(168,85,247,0.16)]">{certLabel(offer.certification_level)}</span>
                    )}
                    {offer.is_financed && <span className="text-[10px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-md text-[#86EFAC] border border-[#4ADE80]/40 bg-[rgba(74,222,128,0.12)]">Financé</span>}
                    {offer.remote && <span className="text-[10px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-md text-[#67E8F9] border border-[#22D3EE]/40 bg-[rgba(34,211,238,0.12)]">Distanciel</span>}
                  </div>

                  <div className="flex flex-col gap-1 mt-auto pt-2.5 border-t border-[#C084FC]/15">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--kz-text)]">
                      <Clock size={11} className="text-[var(--kz-mute)]" aria-hidden /> {offer.duration_value} {offer.duration_unit}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--kz-text)]">
                      <MapPin size={11} className="text-[var(--qx-cyan)]" aria-hidden /> {offer.location}
                    </div>
                    {offer.financing_options.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--kz-text)] min-w-0">
                        <Euro size={11} className="text-[var(--qx-gold)] shrink-0" aria-hidden /> <span className="truncate">{offer.financing_options.slice(0,2).join(' · ')}
                        {offer.financing_options.length > 2 && ` +${offer.financing_options.length - 2}`}</span>
                      </div>
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
