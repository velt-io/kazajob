'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Calendar, Clock, Heart, GraduationCap,
  Euro, FileCheck, Building2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useJob } from '@/features/jobs/useJobs'
import { useApplications } from '@/features/applications/useApplications'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { timeAgo } from '@/lib/utils'
import { KZ, INTERNSHIP_LEVELS } from '@/lib/constants'

function StageInfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--kz-line)] bg-[var(--kz-paper)] text-xs font-medium text-[var(--kz-text)]">
      {icon}
      {label}
    </div>
  )
}

export default function StageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { job, loading } = useJob(id)
  const { profile } = useAuth()
  const { apply, hasApplied } = useApplications(profile?.id)
  const { isFavorite, toggle } = useFavorites(profile?.id)
  const [applyModal, setApplyModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState('')
  const [showDesc, setShowDesc] = useState(true)
  const router = useRouter()

  if (loading) return <PageLoader />
  if (!job) return (
    <div className="text-center py-16">
      <p className="text-[var(--kz-mute)] mb-4">Offre introuvable.</p>
      <Button kind="outline" onClick={() => router.back()}>Retour</Button>
    </div>
  )

  const alreadyApplied = applied || hasApplied(id)
  const levelLabel = INTERNSHIP_LEVELS.find((l) => l.id === job.required_level)?.label

  const handleApply = async () => {
    setApplying(true)
    setError('')
    const { error: err } = await apply(id, coverLetter)
    if (err) setError(err)
    else { setApplied(true); setApplyModal(false) }
    setApplying(false)
  }

  return (
    <div className="min-h-screen" style={{ background: KZ.cream }}>
      <div className="max-w-[900px] mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--kz-mute)] hover:text-[var(--kz-ink)] mb-5"
        >
          <ArrowLeft size={16} />Retour aux stages
        </button>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-5">
          {/* Colonne principale */}
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="kz-card p-5 bg-[var(--kz-paper)]">
              <div className="flex gap-4 items-start mb-4">
                <div
                  className="w-14 h-14 rounded-xl border border-[var(--kz-edge)] flex items-center justify-center text-lg font-extrabold text-[var(--kz-ink)] shrink-0"
                  style={{ background: KZ.violetSoft }}
                >
                  {(job.company?.name ?? 'CO').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--kz-mute)]">
                    {(job.company as { name?: string } | null)?.name}
                  </div>
                  <h1 className="text-xl lg:text-[26px] font-extrabold tracking-tight text-[var(--kz-ink)] leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--kz-edge)]"
                      style={{ background: KZ.violetSoft, color: KZ.violet }}
                    >
                      Stage
                    </span>
                    {job.internship_paid === true && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--kz-edge)]" style={{ background: KZ.greenSoft }}>
                        Gratifié
                      </span>
                    )}
                    {job.internship_paid === false && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--kz-line)]" style={{ color: 'var(--kz-mute)' }}>
                        Non gratifié
                      </span>
                    )}
                    {job.remote && <Badge color="green" size="sm">Remote</Badge>}
                  </div>
                </div>
              </div>

              {/* Infos pratiques */}
              <div className="flex flex-wrap gap-2 mb-4">
                {job.location && <StageInfoPill icon={<MapPin size={12} />} label={job.location} />}
                {job.internship_duration && <StageInfoPill icon={<Calendar size={12} />} label={job.internship_duration} />}
                {job.start_date && <StageInfoPill icon={<Clock size={12} />} label={`Début : ${job.start_date}`} />}
                {job.internship_compensation && <StageInfoPill icon={<Euro size={12} />} label={job.internship_compensation} />}
                {levelLabel && <StageInfoPill icon={<GraduationCap size={12} />} label={levelLabel} />}
                {job.sector && <StageInfoPill icon={<Building2 size={12} />} label={job.sector} />}
                {job.internship_agreement_required && (
                  <StageInfoPill icon={<FileCheck size={12} />} label="Convention requise" />
                )}
              </div>

              {/* Compétences */}
              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s) => <Tag key={s.id}>{s.name}</Tag>)}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="kz-card p-5 bg-[var(--kz-paper)]">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowDesc(!showDesc)}
              >
                <h2 className="text-base font-extrabold text-[var(--kz-ink)]">Description du stage</h2>
                {showDesc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showDesc && (
                <p className="text-sm text-[var(--kz-text)] leading-relaxed mt-3 whitespace-pre-line">
                  {job.description}
                </p>
              )}
            </div>

            {/* Missions */}
            {job.missions && (
              <div className="kz-card p-5 bg-[var(--kz-paper)]">
                <h2 className="text-base font-extrabold text-[var(--kz-ink)] mb-3">Missions</h2>
                <p className="text-sm text-[var(--kz-text)] leading-relaxed whitespace-pre-line">{job.missions}</p>
              </div>
            )}

            {/* Profil recherché */}
            {job.requirements && (
              <div className="kz-card p-5 bg-[var(--kz-paper)]">
                <h2 className="text-base font-extrabold text-[var(--kz-ink)] mb-3">Profil recherché</h2>
                <p className="text-sm text-[var(--kz-text)] leading-relaxed whitespace-pre-line">{job.requirements}</p>
              </div>
            )}
          </div>

          {/* Colonne action */}
          <div className="flex flex-col gap-3">
            <div className="kz-card p-4 bg-[var(--kz-paper)] sticky top-4">
              <p className="text-xs text-[var(--kz-mute)] mb-3">Publié {timeAgo(job.created_at)}</p>
              {alreadyApplied ? (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-semibold"
                  style={{ background: KZ.greenSoft, color: KZ.green }}
                >
                  ✓ Candidature envoyée
                </div>
              ) : (
                <Button kind="primary" size="lg" full onClick={() => {
                  if (!profile) { router.push('/auth/login'); return }
                  setApplyModal(true)
                }}>
                  Candidater
                </Button>
              )}
              <button
                onClick={() => toggle(job.id)}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-[var(--kz-mute)] hover:text-[var(--kz-ink)] transition-colors"
              >
                <Heart size={14} fill={isFavorite(job.id) ? 'var(--kz-orange)' : 'none'} stroke="var(--kz-mute)" />
                {isFavorite(job.id) ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
            </div>

            {/* Avantages */}
            {job.benefits && (
              <div className="kz-card p-4 bg-[var(--kz-paper)]">
                <h3 className="text-sm font-extrabold text-[var(--kz-ink)] mb-2">Avantages</h3>
                <p className="text-xs text-[var(--kz-text)] leading-relaxed whitespace-pre-line">{job.benefits}</p>
              </div>
            )}

            <Link href="/stages" className="text-xs text-center font-semibold text-[var(--kz-mute)] hover:text-[var(--kz-ink)] underline">
              ← Voir tous les stages
            </Link>
          </div>
        </div>
      </div>

      {/* Modal candidature */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Candidater à ce stage">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--kz-mute)]">
            Votre CV et profil Kazajob seront transmis à l&apos;entreprise.
          </p>
          <Textarea
            label="Message / lettre de motivation (optionnel)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={5}
            placeholder="Présentez votre motivation pour ce stage..."
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button kind="outline" full onClick={() => setApplyModal(false)}>Annuler</Button>
            <Button kind="primary" full loading={applying} onClick={handleApply}>
              Envoyer ma candidature
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
