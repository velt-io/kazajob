'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, Clock, Users, Euro, Check, CalendarCheck, GraduationCap, BookOpen, ListChecks, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { CERTIFICATION_LEVELS } from '@/lib/constants'
import type { TrainingOffer } from '@/lib/types'
import { CompanyMark, Pill, markGradient } from '@/components/os/candidate/primitives'

const certLabel = (id: string) => CERTIFICATION_LEVELS.find(c => c.id === id)?.label ?? id

function Section({ icon, tint, title, children }: { icon: ReactNode; tint: string; title: string; children: ReactNode }) {
  return (
    <section className="osc-card p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ color: tint, background: `color-mix(in srgb, ${tint} 16%, transparent)` }}>{icon}</span>
        <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

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
    <div className="max-w-md mx-auto text-center py-20">
      <span className="inline-flex w-16 h-16 rounded-[20px] items-center justify-center bg-[var(--kz-line)] text-[var(--kz-mute)] mb-5"><GraduationCap size={26} /></span>
      <p className="text-[20px] font-semibold text-[var(--kz-ink)] mb-6">Formation introuvable</p>
      <Button kind="outline" onClick={() => router.back()}>Retour</Button>
    </div>
  )

  const hasIC  = !!offer.info_session
  const icDate = hasIC ? new Date((offer.info_session as { date: string }).date) : null
  const icWhen = icDate ? `${icDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${icDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''

  const facts = [
    { icon: <Clock size={13} />, label: 'Durée', val: `${offer.duration_value} ${offer.duration_unit}` },
    { icon: <MapPin size={13} />, label: 'Lieu', val: offer.location },
    { icon: <Users size={13} />, label: 'Places', val: `${offer.max_participants} max` },
    ...(offer.start_date ? [{ icon: <CalendarCheck size={13} />, label: 'Début', val: new Date(offer.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }] : []),
    ...(offer.financing_options.length > 0 ? [{ icon: <Euro size={13} />, label: 'Financement', val: offer.financing_options.join(', ') }] : []),
  ]

  const cta = applied ? (
    <span className="osc-fade w-full inline-flex items-center justify-center gap-2 h-12 rounded-full text-[15px] font-semibold text-[var(--kz-green)] bg-[var(--kz-green-soft)] border border-[color-mix(in_srgb,var(--kz-green)_35%,transparent)]">
      <Check size={17} strokeWidth={2.6} />Dossier envoyé
    </span>
  ) : (
    <Button kind="primary" size="lg" full icon={<GraduationCap size={16} />} onClick={() => setApplyModal(true)}>
      Postuler à la formation
    </Button>
  )

  return (
    <div className="max-w-[1080px] mx-auto">
      <button onClick={() => router.back()}
        className="osc-press inline-flex items-center gap-0.5 -ml-1.5 mb-4 h-9 pr-3 pl-1 rounded-full text-[15px] font-medium text-[var(--kz-blue)] hover:bg-[var(--kz-blue-soft)]">
        <ChevronLeft size={20} />Formations
      </button>

      {/* En-tête */}
      <section className="relative overflow-hidden rounded-[32px] border border-[var(--kz-edge)] shadow-[var(--os-elevation)]">
        <div className="relative h-44 sm:h-56" style={{ background: markGradient(offer.company?.name ?? offer.title) }}>
          {offer.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={offer.image_url} alt="" className="w-full h-full object-cover" />
          )}
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),color-mix(in_srgb,var(--kz-cream)_92%,transparent))]" />
        </div>
        <div className="relative -mt-16 px-5 sm:px-8 pb-6 sm:pb-8">
          <CompanyMark name={offer.company?.name ?? 'Organisme'} size={72} className="ring-4 ring-[var(--kz-cream)]" />
          <div className="text-[14px] font-medium text-[var(--kz-mute)] mt-3">{offer.company?.name ?? 'Organisme de formation'}</div>
          <h1 className="text-[28px] sm:text-[38px] font-semibold tracking-[-0.045em] leading-[1.05] text-[var(--kz-ink)] mt-1">{offer.title}</h1>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {offer.certification_level && <Pill tone="violet">{certLabel(offer.certification_level)}</Pill>}
            {offer.is_financed && <Pill tone="green">Formation financée</Pill>}
            {offer.remote && <Pill tone="blue">Distanciel</Pill>}
            {hasIC && <Pill tone="green" dot>Session d&apos;info disponible</Pill>}
          </div>

          <div className="osc-scroll-x mt-6 -mx-5 px-5 sm:mx-0 sm:px-0 pt-5 border-t border-[var(--kz-line)] [scroll-snap-type:none]">
            {facts.map((f, i) => (
              <div key={f.label} className={`shrink-0 min-w-[130px] max-w-[220px] px-4 first:pl-0 ${i > 0 ? 'border-l border-[var(--kz-line)]' : ''}`}>
                <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)]">{f.icon}{f.label}</div>
                <div className="text-[15px] font-semibold text-[var(--kz-ink)] mt-1.5 line-clamp-2">{f.val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-5 mt-5">
        <div className="flex flex-col gap-5 min-w-0">
          <Section icon={<BookOpen size={15} />} tint="var(--kz-blue)" title="À propos de la formation">
            <p className="text-[15px] leading-[1.65] text-[var(--kz-text)] whitespace-pre-line">{offer.description}</p>
          </Section>
          {offer.program && (
            <Section icon={<ListChecks size={15} />} tint="var(--kz-violet)" title="Programme pédagogique">
              <p className="text-[15px] leading-[1.65] text-[var(--kz-text)] whitespace-pre-line">{offer.program}</p>
            </Section>
          )}
          {offer.prerequisites && (
            <Section icon={<KeyRound size={15} />} tint="var(--kz-orange)" title="Prérequis d'accès">
              <p className="text-[15px] leading-[1.65] text-[var(--kz-text)] whitespace-pre-line">{offer.prerequisites}</p>
            </Section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-[var(--osc-sticky-top,16px)] self-start w-full">
          <div className="os-glass rounded-[26px] p-5 shadow-[var(--os-elevation)]">
            {offer.certification && (
              <div className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)]">{offer.certification}</div>
            )}
            <div className="text-[13px] text-[var(--kz-mute)] mt-1 mb-5">{offer.duration_value} {offer.duration_unit} · {offer.location}</div>
            {cta}
          </div>

          {hasIC && icDate && (
            <div className="osc-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-[11px] flex items-center justify-center text-black bg-[var(--kz-green)]"><CalendarCheck size={16} /></span>
                <h3 className="text-[15px] font-semibold text-[var(--kz-ink)] leading-tight">Information collective</h3>
              </div>
              <div className="text-[13px] text-[var(--kz-mute)]">{(offer.info_session as { title: string }).title}</div>
              <div className="text-[14px] font-semibold text-[var(--kz-ink)] mt-1 mb-4 first-letter:uppercase">{icWhen}</div>
              {icRegistered ? (
                <span className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full text-[13px] font-semibold text-[var(--kz-green)] bg-[var(--kz-green-soft)]">
                  <Check size={15} strokeWidth={2.6} />Inscrit à la session
                </span>
              ) : (
                <Button kind="outline" size="md" full onClick={() => setIcModal(true)}>
                  S&apos;inscrire à la session
                </Button>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Modal candidature */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Postuler à cette formation">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <CompanyMark name={offer.company?.name ?? 'Organisme'} size={44} />
            <h3 className="text-[16px] font-semibold text-[var(--kz-ink)] leading-snug">{offer.title}</h3>
          </div>
          {error && <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <Textarea
            label="Lettre de motivation (optionnel)"
            value={motivation}
            onChange={e => setMotivation(e.target.value)}
            placeholder="Pourquoi souhaitez-vous suivre cette formation ? Votre projet professionnel…"
            rows={5}
          />
          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <Button kind="soft" size="lg" full onClick={() => setApplyModal(false)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={applying} onClick={handleApply}>
              Envoyer mon dossier
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal IC */}
      <Modal open={icModal} onClose={() => setIcModal(false)} title="Information collective">
        <div className="flex flex-col gap-5">
          {hasIC && icDate && (
            <>
              <div className="p-4 rounded-[18px] bg-[var(--kz-green-soft)] border border-[color-mix(in_srgb,var(--kz-green)_25%,transparent)]">
                <div className="text-[15px] font-semibold text-[var(--kz-ink)] mb-1">{(offer.info_session as { title: string }).title}</div>
                <div className="text-[13px] text-[var(--kz-text)] first-letter:uppercase">{icWhen}</div>
              </div>
              <p className="text-[14px] leading-relaxed text-[var(--kz-text)]">
                Cette session vous permettra de découvrir la formation en détail, poser vos questions et rencontrer l&apos;équipe pédagogique.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5">
                <Button kind="soft" size="lg" full onClick={() => setIcModal(false)}>Annuler</Button>
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
