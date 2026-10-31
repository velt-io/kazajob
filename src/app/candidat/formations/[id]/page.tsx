'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, Users, Euro, Check, CalendarCheck, GraduationCap, BookOpen, ListChecks, Shield, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { CERTIFICATION_LEVELS } from '@/lib/constants'
import type { TrainingOffer } from '@/lib/types'
import { PanelTitle, QuestEmpty } from '@/components/quest/candidat/QuestKit'

const certLabel = (id: string) => CERTIFICATION_LEVELS.find(c => c.id === id)?.label ?? id

const TAG = 'text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border inline-flex items-center gap-1'

export default function TrainingDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { profile } = useAuth()

  const [offer, setOffer]           = useState<TrainingOffer | null>(null)
  const [loading, setLoading]       = useState(true)
  const [applyModal, setApplyModal] = useState(false)
  const [icModal, setIcModal]       = useState(false)
  const [motivation, setMotivation] = useState('')
  const [applying, setApplying]     = useState(false)
  const [applied, setApplied]       = useState(false)
  const [icRegistered, setIcReg]    = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/trainings/${id}`)
        if (res.ok) {
          const { offer: o, is_applied, is_ic_registered } = await res.json()
          setOffer(o as TrainingOffer)
          if (is_applied) setApplied(true)
          if (is_ic_registered) setIcReg(true)
        }
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [id])

  const handleApply = async () => {
    if (!profile?.id) return
    setApplying(true); setError('')
    const res = await fetch(`/api/trainings/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivation }),
    })
    if (res.ok) { setApplied(true); setApplyModal(false) }
    else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Erreur inconnue')
    }
    setApplying(false)
  }

  const handleIcRegister = async () => {
    if (!profile?.id || !offer?.info_session_id) return
    setApplying(true)
    await fetch(`/api/events/${offer.info_session_id}/register`, { method: 'POST' })
    setIcReg(true); setIcModal(false); setApplying(false)
  }

  if (loading) return <PageLoader />
  if (!offer) return (
    <div className="max-w-[560px] mx-auto py-10">
      <QuestEmpty icon={<GraduationCap size={28} />} title="Formation introuvable"
        action={<Button kind="outline" onClick={() => router.back()}>Retour</Button>} />
    </div>
  )

  const hasIC  = !!offer.info_session
  const icDate = hasIC ? new Date((offer.info_session as { date: string }).date) : null

  return (
    <div className="max-w-[1000px] mx-auto">
      <button onClick={() => router.back()}
        className="group flex items-center gap-2 text-sm font-semibold text-[var(--kz-mute)] hover:text-white mb-5 qx-rise">
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Retour aux formations
      </button>

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
        {/* Principal */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Image */}
          {offer.image_url && (
            <div className="qx-panel overflow-hidden h-[200px] sm:h-[240px]">
              <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover rounded-[18px]" />
            </div>
          )}

          {/* En-tête */}
          <article className="qxc-scroll">
            <p className="kz-eyebrow text-[var(--qx-gold)] mb-1.5 flex items-center gap-1.5"><BookOpen size={12} aria-hidden />Académie · {offer.company?.name ?? 'Organisme de formation'}</p>
            <h1 className="text-[24px] sm:text-[30px] font-bold text-white leading-tight mb-3 break-words">{offer.title}</h1>
            <div className="flex flex-wrap gap-2 mb-5">
              {offer.certification_level && <span className={`${TAG} text-[#D8B4FE] border-[#A855F7]/45 bg-[rgba(168,85,247,0.16)]`}>{certLabel(offer.certification_level)}</span>}
              {offer.is_financed && <span className={`${TAG} text-[#86EFAC] border-[#4ADE80]/40 bg-[rgba(74,222,128,0.12)]`}>Formation financée</span>}
              {offer.remote && <span className={`${TAG} text-[#67E8F9] border-[#22D3EE]/40 bg-[rgba(34,211,238,0.12)]`}>Distanciel</span>}
              {hasIC && <span className={`${TAG} text-[#86EFAC] border-[#4ADE80]/40 bg-[rgba(74,222,128,0.12)]`}><CalendarCheck size={11} aria-hidden /> Session IC disponible</span>}
            </div>
            <dl className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { icon: <Clock size={14} />, label: 'Durée', val: `${offer.duration_value} ${offer.duration_unit}` },
                { icon: <MapPin size={14} />, label: 'Lieu', val: offer.location },
                { icon: <Users size={14} />, label: 'Places', val: `${offer.max_participants} max` },
                ...(offer.start_date ? [{ icon: <CalendarCheck size={14} />, label: 'Début', val: new Date(offer.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }] : []),
                ...(offer.financing_options.length > 0 ? [{ icon: <Euro size={14} />, label: 'Financement', val: offer.financing_options.join(', ') }] : []),
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl border border-[#C084FC]/20 bg-[rgba(12,5,24,0.5)] min-w-0">
                  <dt className="flex items-center gap-1.5 text-[var(--qx-cyan)] mb-0.5">{item.icon}<span className="text-[10px] font-bold uppercase tracking-wider text-[var(--kz-mute)]">{item.label}</span></dt>
                  <dd className="text-xs font-bold text-white break-words">{item.val}</dd>
                </div>
              ))}
            </dl>
          </article>

          <section className="qx-panel p-5 sm:p-6">
            <PanelTitle icon={<ScrollText size={13} />}>À propos de la formation</PanelTitle>
            <p className="text-sm leading-relaxed text-[var(--kz-text)] whitespace-pre-line break-words">{offer.description}</p>
          </section>

          {offer.program && (
            <section className="qx-panel p-5 sm:p-6">
              <PanelTitle icon={<ListChecks size={13} />} color="var(--qx-neon)">Programme pédagogique</PanelTitle>
              <p className="text-sm leading-relaxed text-[var(--kz-text)] whitespace-pre-line break-words">{offer.program}</p>
            </section>
          )}

          {offer.prerequisites && (
            <section className="qx-panel p-5 sm:p-6">
              <PanelTitle icon={<Shield size={13} />} color="var(--qx-cyan)">Prérequis d&apos;accès</PanelTitle>
              <p className="text-sm leading-relaxed text-[var(--kz-text)] whitespace-pre-line break-words">{offer.prerequisites}</p>
            </section>
          )}
        </div>

        {/* Colonne latérale */}
        <aside className="flex flex-col gap-5 min-w-0">
          <div className="qx-panel p-5">
            {offer.certification && (
              <div className="text-[18px] font-bold qx-text-legend font-[family-name:var(--font-epic)] mb-1">{offer.certification}</div>
            )}
            <div className="text-sm text-[var(--kz-mute)] mb-4">{offer.duration_value} {offer.duration_unit} · {offer.location}</div>

            {applied ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#FACC15]/40 bg-[rgba(250,204,21,0.07)]" role="status">
                <span className="qxc-seal qxc-seal-gold w-10 h-10 shrink-0"><Check size={18} aria-hidden /></span>
                <span className="text-sm font-bold text-white">Dossier envoyé !</span>
              </div>
            ) : (
              <Button kind="primary" size="lg" full onClick={() => setApplyModal(true)} icon={<GraduationCap size={16} />}>
                Postuler à la formation
              </Button>
            )}
          </div>

          {hasIC && icDate && (
            <div className="qxc-card p-5" style={{ ['--r' as string]: '#4ADE80' }}>
              <PanelTitle icon={<CalendarCheck size={13} />} color="#4ADE80" as="h3">Session d&apos;information collective</PanelTitle>
              <div className="text-xs text-[var(--kz-mute)] mb-1">
                {(offer.info_session as { title: string }).title}
              </div>
              <div className="text-sm font-bold text-white mb-3 capitalize">
                {icDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' à '}{icDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {icRegistered ? (
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[#4ADE80]/40 bg-[rgba(74,222,128,0.1)]" role="status">
                  <Check size={14} className="text-[#86EFAC]" aria-hidden />
                  <span className="text-xs font-bold text-white">Inscrit à la session IC</span>
                </div>
              ) : (
                <Button kind="outline" size="sm" full onClick={() => setIcModal(true)}>
                  S&apos;inscrire à la session IC
                </Button>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Modal candidature */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Postuler à cette formation">
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-white">{offer.title}</h3>
          {error && <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <Textarea
            label="Lettre de motivation (optionnel)"
            value={motivation}
            onChange={e => setMotivation(e.target.value)}
            placeholder="Pourquoi souhaitez-vous suivre cette formation ? Votre projet professionnel..."
            rows={5}
          />
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button kind="outline" size="lg" full onClick={() => setApplyModal(false)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={applying} onClick={handleApply}>
              Envoyer mon dossier
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal IC */}
      <Modal open={icModal} onClose={() => setIcModal(false)} title="Session d'Information Collective">
        <div className="flex flex-col gap-4">
          {hasIC && icDate && (
            <>
              <div className="p-4 rounded-xl border border-[#4ADE80]/35 bg-[rgba(74,222,128,0.08)]">
                <div className="text-sm font-bold text-white mb-1">{(offer.info_session as { title: string }).title}</div>
                <div className="text-xs text-[var(--kz-mute)]">
                  {icDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' à '}{icDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <p className="text-sm text-[var(--kz-text)]">
                Cette session vous permettra de découvrir la formation en détail, poser vos questions et rencontrer l&apos;équipe pédagogique.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button kind="outline" size="lg" full onClick={() => setIcModal(false)}>Annuler</Button>
                <Button kind="primary" size="lg" full loading={applying} onClick={handleIcRegister}
                  icon={<CalendarCheck size={15} />}>
                  S&apos;inscrire
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
