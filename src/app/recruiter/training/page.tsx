'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Eye, Users, Edit, Trash2, GraduationCap, MapPin, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Switch, Tooltip } from '@/components/ui/radix'
import { useAuth } from '@/features/auth/useAuth'
import type { TrainingOffer } from '@/lib/types'
import { ACCENT, EmptyPanel, IconButton, PageHeader, SkeletonList, StatusPill } from '@/components/os/recruiter/primitives'
import { MiniStat, stagger } from '@/components/os/recruiter/secondary-ui'

export default function RecruiterTrainingPage() {
  const { profile } = useAuth()
  const [offers, setOffers]   = useState<TrainingOffer[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!profile?.id) return
    try {
      const res = await fetch('/api/recruiter/trainings')
      if (res.ok) setOffers((await res.json()) as TrainingOffer[])
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { if (profile?.id) load() }, [profile?.id])

  const toggleActive = async (offer: TrainingOffer) => {
    await fetch(`/api/recruiter/trainings/${offer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !offer.is_active }),
    })
    load()
  }

  const deleteOffer = async (id: string) => {
    if (!confirm('Supprimer cette offre de formation ?')) return
    await fetch(`/api/recruiter/trainings/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="max-w-[960px] mx-auto">
      <PageHeader
        eyebrow="Recrutement"
        title="Mes formations"
        subtitle={`${offers.length} offre${offers.length > 1 ? 's' : ''} de formation`}
        actions={
          <Link href="/recruiter/training/new">
            <Button kind="primary" size="md" icon={<Plus size={15} />}>Nouvelle formation</Button>
          </Link>
        }
      />

      {loading ? (
        <div className="osr-panel p-3"><SkeletonList rows={3} height={76} /></div>
      ) : offers.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel
            icon={<GraduationCap size={28} />}
            accent={ACCENT.teal}
            title="Aucune formation publiée"
            description="Publiez votre première offre de formation et trouvez vos futurs stagiaires."
            action={<Link href="/recruiter/training/new"><Button kind="primary">Créer une formation</Button></Link>}
          />
        </div>
      ) : (
        <div className="osr-panel p-2 osr-sep">
          {offers.map((offer, i) => (
            <div key={offer.id} className="osr-row osr-in flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-3 px-3 py-3.5" style={stagger(i)}>
              {/* Vignette */}
              <div className="w-14 h-14 rounded-[15px] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center text-white"
                style={{ background: `linear-gradient(145deg, ${ACCENT.teal}, ${ACCENT.indigo})` }}>
                {offer.image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={offer.image_url} alt="" className="w-full h-full object-cover" />
                  : <GraduationCap size={22} />}
              </div>

              <div className="flex-1 min-w-0 basis-[calc(100%-72px)] sm:basis-auto">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-white truncate">{offer.title}</h3>
                  {offer.certification_level && <StatusPill accent={ACCENT.violet}>Niv. {offer.certification_level}</StatusPill>}
                  {offer.is_financed && <StatusPill accent={ACCENT.green}>Financement</StatusPill>}
                </div>
                <div className="text-[12px] text-[var(--kz-mute)] flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{offer.duration_value} {offer.duration_unit}</span>
                  <span className="flex items-center gap-1"><MapPin size={11} />{offer.location}</span>
                  {offer.start_date && (
                    <span className="flex items-center gap-1"><CalendarDays size={11} />Début {new Date(offer.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <MiniStat value={offer.views} label="vues" icon={<Eye size={9} />} />
                <MiniStat value={offer.applications_count} label="dossiers" icon={<Users size={9} />} />
                <StatusPill accent={offer.is_active ? ACCENT.green : ACCENT.mute} live={offer.is_active} className="ml-1">
                  {offer.is_active ? 'Active' : 'Inactive'}
                </StatusPill>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <Tooltip content={offer.is_active ? 'Désactiver' : 'Activer'}>
                  <span className="inline-flex mr-1.5">
                    <Switch checked={offer.is_active} onCheckedChange={() => toggleActive(offer)}
                      aria-label={offer.is_active ? 'Désactiver' : 'Activer'} className="scale-[0.8]" />
                  </span>
                </Tooltip>
                <Tooltip content="Modifier">
                  <Link href={`/recruiter/training/${offer.id}/edit`} aria-label="Modifier" className="osr-icon-btn">
                    <Edit size={15} />
                  </Link>
                </Tooltip>
                <IconButton label="Supprimer" tone="danger" onClick={() => deleteOffer(offer.id)}>
                  <Trash2 size={15} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
