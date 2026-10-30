'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Eye, Users, Edit, Trash2, GraduationCap, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'
import type { TrainingOffer } from '@/lib/types'

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
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="kz-h2 text-[var(--kz-ink)] mb-1">Mes formations</h1>
          <p className="text-sm text-[var(--kz-mute)]">{offers.length} offre{offers.length > 1 ? 's' : ''} de formation</p>
        </div>
        <Link href="/recruteur/formations/nouvelle">
          <Button kind="primary" size="md" icon={<Plus size={15} />}>Nouvelle formation</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-[var(--kz-cream2)] animate-pulse" />)}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          title="Aucune formation publiée"
          description="Publiez votre première offre de formation et trouvez vos futurs stagiaires."
          icon={<GraduationCap size={28} />}
          action={<Link href="/recruteur/formations/nouvelle"><Button kind="primary">Créer une formation</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map(offer => (
            <div key={offer.id} className="kz-card p-4 bg-[var(--kz-paper)] flex items-center gap-4">
              {/* Image */}
              <div className="w-16 h-16 rounded-xl border border-[var(--kz-edge)] overflow-hidden shrink-0"
                style={{ background: KZ.violetSoft }}>
                {offer.image_url
                  ? <img src={offer.image_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap size={24} color={KZ.violet} />
                    </div>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="text-sm font-bold text-[var(--kz-ink)] truncate">{offer.title}</h3>
                  {offer.certification_level && (
                    <Badge color="violet" size="sm">Niv. {offer.certification_level}</Badge>
                  )}
                  {offer.is_financed && <Badge color="green" size="sm">Financement</Badge>}
                </div>
                <div className="text-xs text-[var(--kz-mute)]">
                  {offer.duration_value} {offer.duration_unit} · {offer.location}
                  {offer.start_date && ` · Début ${new Date(offer.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <div className="text-sm font-extrabold text-[var(--kz-ink)]">{offer.views}</div>
                  <div className="text-[10px] text-[var(--kz-mute)] flex items-center gap-0.5"><Eye size={9} />vues</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-[var(--kz-ink)]">{offer.applications_count}</div>
                  <div className="text-[10px] text-[var(--kz-mute)] flex items-center gap-0.5"><Users size={9} />dossiers</div>
                </div>
                <Badge color={offer.is_active ? 'green' : 'cream'} size="sm">
                  {offer.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(offer)} title={offer.is_active ? 'Désactiver' : 'Activer'}>
                  {offer.is_active
                    ? <ToggleRight size={20} color={KZ.green} />
                    : <ToggleLeft size={20} color={KZ.mute} />}
                </button>
                <Link href={`/recruteur/formations/${offer.id}/edit`}>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--kz-cream2)] text-[var(--kz-mute)]">
                    <Edit size={15} />
                  </button>
                </Link>
                <button
                  onClick={() => deleteOffer(offer.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[var(--kz-mute)] hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
