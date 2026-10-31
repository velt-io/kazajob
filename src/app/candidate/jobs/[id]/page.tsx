'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, MapPin, Clock, Heart, Briefcase, Sparkles, Building2, Check, Brain, ChevronDown, Lightbulb, Wallet,
  ListChecks, Gift, GraduationCap, CheckCircle2, Zap, Eye, Users, Wifi, ArrowRight, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineLoader } from '@/components/ui/LogoLoader'
import { KazaScoreMini } from '@/components/ui/KazaScoreBadge'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { CoverLetterModal } from '@/components/ai/CoverLetterModal'
import { useJob } from '@/features/jobs/useJobs'
import { useApplications } from '@/features/applications/useApplications'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { formatSalary, timeAgo, cn } from '@/lib/utils'
import { getSalaryLabel } from '@/lib/constants'
import { type PrequalQuestion } from '@/lib/prequal'
import { SalaryInsightsCard } from '@/components/jobs/SalaryInsightsCard'
import { TrainingRecoCard } from '@/components/jobs/TrainingRecoCard'
import { EmployerReputation } from '@/components/jobs/EmployerReputation'
import { CompanyMark, MatchRing } from '@/components/os/candidate/primitives'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { job, loading } = useJob(id)
  const { profile } = useAuth()
  const { apply, hasApplied } = useApplications(profile?.id)
  const { isFavorite, toggle } = useFavorites(profile?.id)
  const [applyModal, setApplyModal] = useState(false)
  const [coverLetterModal, setCoverLetterModal] = useState(false)
  const [interviewModal, setInterviewModal] = useState(false)
  const [showMatchDetail, setShowMatchDetail] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [prequalAnswers, setPrequalAnswers] = useState<Record<string, string>>({})
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Présentation : barre compacte quand l'en-tête sort de l'écran, « Lire la suite », cœur animé.
  const heroRef = useRef<HTMLElement>(null)
  const [compact, setCompact] = useState(false)
  const [descOpen, setDescOpen] = useState(false)
  const [heartPop, setHeartPop] = useState(false)
  const jobLoaded = !!job
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-72px 0px 0px 0px', threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [jobLoaded, loading])

  if (loading) return <PageLoader />
  if (!job) return (
    <div className="max-w-md mx-auto text-center py-20">
      <span className="inline-flex w-16 h-16 rounded-[20px] items-center justify-center bg-[var(--kz-line)] text-[var(--kz-mute)] mb-5"><Briefcase size={26} /></span>
      <p className="text-[20px] font-semibold text-[var(--kz-ink)] mb-1">Offre introuvable</p>
      <p className="text-[14px] text-[var(--kz-mute)] mb-6">Elle a peut-être été retirée par le recruteur.</p>
      <Button kind="outline" onClick={() => router.back()}>Retour</Button>
    </div>
  )

  const alreadyApplied = applied || hasApplied(id)

  const prequalQuestions = (((job as unknown as { prequal_questions?: PrequalQuestion[] })?.prequal_questions) ?? []) as PrequalQuestion[]

  const handleApply = async () => {
    setApplying(true); setError('')
    const answers = prequalQuestions.map((q) => ({ questionId: q.id, label: q.label, value: prequalAnswers[q.id] ?? '' }))
    const missing = prequalQuestions.find((q) => q.required && !answers.find((a) => a.questionId === q.id)?.value)
    if (missing) { setError('Merci de répondre à : ' + missing.label); setApplying(false); return }
    const { error: err } = await apply(id, coverLetter, answers.length ? answers : undefined)
    if (err) { setError(err) } else { setApplied(true); setApplyModal(false) }
    setApplying(false)
  }

  const fav = isFavorite(id)
  const onToggleFav = () => { setHeartPop(true); toggle(id) }
  const salary = formatSalary(job.salary_min, job.salary_max)
  const sl = getSalaryLabel(job.salary_min, job.salary_max)
  const missions = (job as unknown as { missions?: string | null }).missions
  const benefits = (job as unknown as { benefits?: string | null }).benefits
  const requiredLevel = (job as unknown as { required_level?: string | null }).required_level
  const longDesc = (job.description ?? '').length > 700

  /** Bouton d'action principal (même logique partout : envoyée / clôturée / postuler). */
  const cta = (size: 'md' | 'lg', full?: boolean) => alreadyApplied ? (
    <span className={cn('osc-fade inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--kz-green)] bg-[var(--kz-green-soft)] border border-[color-mix(in_srgb,var(--kz-green)_35%,transparent)]',
      size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-9 px-4 text-[13px]', full && 'w-full')}>
      <Check size={size === 'lg' ? 17 : 15} strokeWidth={2.6} />Candidature envoyée
    </span>
  ) : !job.is_active ? (
    <span className={cn('inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--kz-mute)] bg-[var(--kz-line)]',
      size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-9 px-4 text-[13px]', full && 'w-full')}>
      <Lock size={14} />Offre clôturée
    </span>
  ) : (
    <Button kind="primary" size={size} full={full} onClick={() => setApplyModal(true)} iconRight={size === 'lg' ? <ArrowRight size={16} /> : undefined}>
      Postuler
    </Button>
  )

  const heartBtn = (
    <button type="button" onClick={onToggleFav}
      aria-label={fav ? 'Retirer des favoris' : 'Sauvegarder l’offre'} aria-pressed={fav} data-pop={heartPop && fav}
      className="osc-heart osc-press w-12 h-12 shrink-0 rounded-full flex items-center justify-center bg-[var(--osc-surface-hi)] border border-[var(--kz-edge)] text-[var(--kz-ink)] hover:bg-[var(--kz-beige)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]">
      <Heart size={19} fill={fav ? 'var(--osc-love)' : 'none'} color={fav ? 'var(--osc-love)' : 'currentColor'} />
    </button>
  )

  const facts: { label: string; value: ReactNode; sub?: ReactNode; icon: ReactNode }[] = [
    { label: 'Salaire', icon: <Wallet size={13} />, value: salary, sub: sl ? <span style={{ color: `color-mix(in srgb, ${sl.color} 70%, white)` }}>{sl.label}</span> : 'brut' },
    { label: 'Contrat', icon: <Briefcase size={13} />, value: job.job_type, sub: job.remote ? 'Télétravail possible' : 'Sur site' },
    { label: 'Lieu', icon: <MapPin size={13} />, value: job.location, sub: 'La Réunion' },
    { label: 'Publiée', icon: <Clock size={13} />, value: timeAgo(job.created_at), sub: requiredLevel ?? 'Tous niveaux' },
    { label: 'Vues', icon: <Eye size={13} />, value: (job.views ?? 0).toLocaleString('fr-FR'), sub: 'consultations' },
    { label: 'Candidats', icon: <Users size={13} />, value: (job.applications_count ?? 0).toLocaleString('fr-FR'), sub: 'ont postulé' },
  ]

  return (
    <div className="max-w-[1080px] mx-auto">
      {/* ── Barre compacte (apparaît quand l'en-tête disparaît) ── */}
      <div className="sticky top-[var(--osc-sticky-top,8px)] z-30 h-0">
        <div data-show={compact} inert={!compact}
          className="osc-compact-bar os-glass mx-auto max-w-[760px] h-14 rounded-full flex items-center gap-3 pl-2 pr-2 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.85)]">
          <button type="button" onClick={() => router.back()} aria-label="Retour"
            className="osc-press w-10 h-10 rounded-full flex items-center justify-center text-[var(--kz-blue)] hover:bg-[var(--kz-line)]">
            <ChevronLeft size={22} />
          </button>
          <CompanyMark name={job.company?.name} size={34} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-[var(--kz-ink)] truncate leading-tight">{job.title}</div>
            <div className="text-[12px] text-[var(--kz-mute)] truncate leading-tight">{job.company?.name}</div>
          </div>
          <div className="hidden sm:block">{cta('md')}</div>
        </div>
      </div>

      {/* ── Retour ── */}
      <button onClick={() => router.back()}
        className="osc-press inline-flex items-center gap-0.5 -ml-1.5 mb-4 h-9 pr-3 pl-1 rounded-full text-[15px] font-medium text-[var(--kz-blue)] hover:bg-[var(--kz-blue-soft)]">
        <ChevronLeft size={20} />Offres
      </button>

      {/* ── En-tête façon fiche App Store ── */}
      <section ref={heroRef} className="osc-mesh relative overflow-hidden rounded-[32px] border border-[var(--kz-edge)] shadow-[var(--os-elevation)]">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,white_35%,transparent),transparent)]" />
        <div className="relative p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-5 sm:items-end">
            <CompanyMark name={job.company?.name} size={88} className="osc-in" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-[color-mix(in_srgb,var(--kz-ink)_75%,transparent)] flex items-center gap-1.5">
                <Building2 size={14} />{job.company?.name}
              </div>
              <ViewTransition name={`job-title-${job.id}`} share="morph">
                <h1 className="text-[28px] sm:text-[36px] lg:text-[42px] font-semibold tracking-[-0.045em] leading-[1.04] text-[var(--kz-ink)] mt-1.5">{job.title}</h1>
              </ViewTransition>
              <div className="flex gap-x-4 gap-y-1 mt-3 flex-wrap text-[13px] text-[color-mix(in_srgb,var(--kz-ink)_78%,transparent)]">
                <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>
                <span className="inline-flex items-center gap-1.5"><Briefcase size={14} />{job.job_type}</span>
                {job.remote && <span className="inline-flex items-center gap-1.5 text-[var(--kz-green)]"><Wifi size={14} />Télétravail</span>}
              </div>
            </div>
            <div className="flex items-center gap-2.5 sm:pb-1">
              <div className="flex-1 sm:flex-none">{cta('lg', true)}</div>
              {heartBtn}
            </div>
          </div>

          {/* Bandeau d'infos (défile horizontalement sur mobile) */}
          <div className="osc-scroll-x mt-7 -mx-5 px-5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-y-4 lg:grid-cols-6 border-t border-[var(--kz-line)] pt-5 [scroll-snap-type:none]">
            {facts.map((f, i) => (
              <div key={f.label} className={cn('shrink-0 min-w-[132px] sm:min-w-0 px-4 sm:px-3 py-1 text-center', i > 0 && 'border-l border-[var(--kz-line)]', i === 3 && 'sm:max-lg:border-l-0')}>
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)]">{f.icon}{f.label}</div>
                <div className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)] mt-1.5 truncate">{f.value}</div>
                {f.sub && <div className="text-[11px] text-[var(--kz-mute)] mt-0.5 truncate">{f.sub}</div>}
              </div>
            ))}
          </div>

          {!!job.skills?.length && (
            <div className="flex gap-2 flex-wrap mt-6">
              {job.skills.map((s) => (
                <span key={s.id} className="inline-flex items-center h-7 px-3 rounded-full text-[12px] font-medium text-[var(--kz-ink)] bg-[color-mix(in_srgb,var(--kz-ink)_10%,transparent)] border border-[var(--kz-line)]">{s.name}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Corps : 2 colonnes sur desktop ── */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-5 mt-5">
        <div className="flex flex-col gap-5 min-w-0">
          {/* Compatibilité IA */}
          {job.match_score !== undefined && (() => {
            const locationMatch = profile?.location && job.location
              ? job.location.toLowerCase().includes(profile.location.toLowerCase().split(',')[0])
                || profile.location.toLowerCase().includes(job.location.toLowerCase().split(',')[0])
              : null
            const rows = [
              {
                label: 'Compétences techniques',
                pct: 50,
                ok: (job.skills?.length ?? 0) > 0,
                tip: job.skills && job.skills.length > 0
                  ? `${job.skills.length} compétence(s) requise(s) : ${job.skills.slice(0,3).map((s: {name:string}) => s.name).join(', ')}${job.skills.length > 3 ? '…' : ''}`
                  : 'Aucune compétence spécifique requise',
              },
              {
                label: 'Localisation',
                pct: 20,
                ok: locationMatch !== false,
                tip: locationMatch
                  ? `Votre ville correspond (${job.location})`
                  : locationMatch === false
                  ? `Votre profil indique ${profile?.location} · poste à ${job.location}`
                  : `Poste à ${job.location}`,
              },
              { label: 'Type de contrat',  pct: 15, ok: true, tip: job.job_type },
              { label: 'Disponibilité',    pct: 15, ok: true, tip: 'Critère validé' },
            ]
            return (
              <div className="osc-card p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <MatchRing value={job.match_score} size={68} stroke={7} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)] flex items-center gap-1.5"><Sparkles size={12} className="text-[var(--kz-violet)]" />Compatibilité KazaIA</div>
                    <div className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)] mt-1 leading-tight">
                      Ce poste te correspond à <span className="os-text-aurora">{job.match_score} %</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMatchDetail(v => !v)}
                    aria-expanded={showMatchDetail}
                    className="osc-press shrink-0 inline-flex items-center gap-1 h-9 px-3.5 rounded-full text-[13px] font-semibold text-[var(--kz-blue)] bg-[var(--kz-blue-soft)] hover:brightness-125"
                  >
                    {showMatchDetail ? 'Masquer' : 'Détail'}
                    <ChevronDown size={14} className={cn('transition-transform duration-300', showMatchDetail && 'rotate-180')} />
                  </button>
                </div>
                {showMatchDetail && (
                  <div className="osc-drop mt-5 pt-4 border-t border-[var(--kz-line)] flex flex-col gap-3.5">
                    {rows.map(row => (
                      <div key={row.label} className="flex items-start gap-3">
                        {row.ok
                          ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--kz-green)]" />
                          : <Zap size={18} className="mt-0.5 shrink-0 text-[var(--kz-orange)]" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[14px] font-medium text-[var(--kz-ink)]">{row.label}</span>
                            <span className="text-[12px] tabular-nums text-[var(--kz-mute)]">{row.pct} %</span>
                          </div>
                          <div className="h-1 rounded-full bg-[var(--kz-line)] mt-1.5 overflow-hidden">
                            <div className="osc-track-fill h-full rounded-full" style={{ width: `${row.pct * 2}%`, background: row.ok ? 'var(--kz-green)' : 'var(--kz-orange)' }} />
                          </div>
                          <p className="text-[12px] text-[var(--kz-mute)] mt-1.5 leading-snug">{row.tip}</p>
                        </div>
                      </div>
                    ))}
                    {job.match_score < 80 && (
                      <a
                        href="/candidate/profile"
                        className="osc-press mt-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full text-[13px] font-semibold text-[var(--kz-ink)] bg-[var(--osc-surface-hi)] border border-[var(--kz-edge)] hover:bg-[var(--kz-beige)]"
                      >
                        Améliorer mon score en complétant mon profil <ArrowRight size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Outils KazaIA */}
          <div className="osc-card os-ring-aurora p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white" style={{ background: 'var(--os-aurora)' }}>
                <Sparkles size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-semibold text-[var(--kz-ink)] tracking-[-0.01em]">KazaIA</div>
                <div className="text-[12px] text-[var(--kz-mute)]">Des outils intelligents pour cette offre</div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-1 rounded-full text-[var(--kz-violet)] bg-[var(--kz-violet-soft)]">Bêta</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button kind="violet" size="lg" full icon={<Sparkles size={15} />} onClick={() => setCoverLetterModal(true)}>
                Générer ma lettre
              </Button>
              <Button kind="outline" size="lg" full icon={<Brain size={15} />} onClick={() => setInterviewModal(true)}>
                Préparer mon entretien
              </Button>
            </div>
          </div>

          {/* KazaIA — Comprendre l'offre en clair */}
          <ExplainJobSection jobId={id} />

          {/* Description */}
          <DetailSection icon={<Briefcase size={15} />} tint="var(--kz-orange)" title="Description du poste">
            <div className={cn('text-[15px] leading-[1.65] text-[var(--kz-text)] whitespace-pre-line', longDesc && !descOpen && 'osc-clamp')} style={{ ['--lines' as string]: 9 }}>
              {job.description}
            </div>
            {longDesc && (
              <button type="button" onClick={() => setDescOpen(v => !v)} aria-expanded={descOpen}
                className="mt-2 text-[14px] font-semibold text-[var(--kz-blue)] hover:brightness-125">
                {descOpen ? 'Réduire' : 'Lire la suite'}
              </button>
            )}
          </DetailSection>

          {missions && (
            <DetailSection icon={<ListChecks size={15} />} tint="var(--kz-violet)" title="Missions attendues">
              <div className="text-[15px] leading-[1.65] text-[var(--kz-text)] whitespace-pre-line">{missions}</div>
            </DetailSection>
          )}

          {job.requirements && (
            <DetailSection icon={<GraduationCap size={15} />} tint="var(--kz-green)" title="Profil recherché"
              aside={requiredLevel ? <span className="text-[11px] font-semibold px-2.5 h-6 inline-flex items-center rounded-full text-[var(--kz-text)] bg-[var(--kz-line)]">{requiredLevel}</span> : undefined}>
              <div className="text-[15px] leading-[1.65] text-[var(--kz-text)] whitespace-pre-line">{job.requirements}</div>
            </DetailSection>
          )}

          {benefits && (
            <DetailSection icon={<Gift size={15} />} tint="var(--kz-yellow)" title="Avantages">
              <div className="text-[15px] leading-[1.65] text-[var(--kz-text)] whitespace-pre-line">{benefits}</div>
            </DetailSection>
          )}

          {/* Pour améliorer vos chances — si pas totalement compatible */}
          {job.match_score !== undefined && job.match_score < 80 && (
            <TrainingRecoCard sector={job.sector} />
          )}

          {/* Fourchette salariale (offre recruteur ou estimation KazaIA) */}
          <SalaryInsightsCard
            sector={job.sector}
            salaryMin={job.salary_min}
            salaryMax={job.salary_max}
            jobTitle={job.title}
            jobType={job.job_type}
          />
        </div>

        {/* ── Colonne latérale (desktop) ── */}
        <aside className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-[calc(var(--osc-sticky-top,8px)+72px)] self-start">
          <div className="os-glass rounded-[26px] p-5 shadow-[var(--os-elevation)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)]">Rémunération</div>
            <div className="text-[26px] font-semibold tracking-[-0.04em] text-[var(--kz-ink)] mt-1 leading-tight">{salary}</div>
            {sl && (
              <span className="inline-flex items-center h-6 px-2.5 mt-2 rounded-full text-[11px] font-semibold"
                style={{ color: `color-mix(in srgb, ${sl.color} 70%, white)`, background: `color-mix(in srgb, ${sl.color} 18%, transparent)` }}>
                {sl.label}
              </span>
            )}
            <div className="text-[13px] text-[var(--kz-mute)] mt-2 mb-5">{job.job_type} · {job.location}</div>
            {cta('lg', true)}
            {!job.is_active && !alreadyApplied && (
              <Link href="/candidate/jobs" className="block text-center mt-3 text-[13px] font-semibold text-[var(--kz-blue)]">Voir les offres en cours</Link>
            )}
            <button type="button" onClick={onToggleFav} aria-pressed={fav} data-pop={heartPop && fav} aria-label={fav ? 'Retirer des favoris' : 'Sauvegarder l’offre'}
              className="osc-heart osc-press w-full mt-2.5 h-11 rounded-full inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-[var(--kz-ink)] bg-[var(--osc-surface-hi)] border border-[var(--kz-edge)] hover:bg-[var(--kz-beige)]">
              <Heart size={16} fill={fav ? 'var(--osc-love)' : 'none'} color={fav ? 'var(--osc-love)' : 'currentColor'} />
              {fav ? 'Dans tes favoris' : 'Sauvegarder'}
            </button>
          </div>

          <div className="osc-card p-5">
            <h3 className="text-[15px] font-semibold text-[var(--kz-ink)] mb-3">À propos</h3>
            <div className="flex items-center gap-3">
              <CompanyMark name={job.company?.name} size={40} />
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[var(--kz-ink)] truncate">{job.company?.name}</div>
                {job.company?.location && <div className="text-[12px] text-[var(--kz-mute)] flex items-center gap-1 truncate"><MapPin size={11} />{job.company.location}</div>}
              </div>
            </div>
            {/* KazaScore recruteur */}
            {job.recruiter_id && (
              <div className="mt-4 pt-3 border-t border-[var(--kz-line)] flex items-center justify-between gap-2">
                <span className="text-[13px] text-[var(--kz-mute)]">Réactivité</span>
                <KazaScoreMini recruiterId={job.recruiter_id} />
              </div>
            )}
          </div>

          {/* Réputation employeur (indicateurs réels) */}
          <EmployerReputation companyId={job.company?.id} />
        </aside>
      </div>

      {/* ── Barre « Postuler » collante (mobile) — laisse la place au bouton KazaIA flottant ── */}
      <div className="lg:hidden sticky bottom-6 z-30 mt-6 mr-[76px]">
        <div className="osc-apply-bar os-glass rounded-full h-14 pl-5 pr-1.5 flex items-center gap-3 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.9)]">
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-[var(--kz-ink)] truncate leading-tight">{salary}</div>
            <div className="text-[11px] text-[var(--kz-mute)] truncate leading-tight">{job.job_type} · {job.location}</div>
          </div>
          {alreadyApplied ? (
            <span className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full text-[13px] font-semibold text-[var(--kz-green)] bg-[var(--kz-green-soft)]"><Check size={15} strokeWidth={2.6} />Envoyée</span>
          ) : !job.is_active ? (
            <Link href="/candidate/jobs" className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full text-[13px] font-semibold text-[var(--kz-mute)] bg-[var(--kz-line)]"><Lock size={13} />Clôturée</Link>
          ) : (
            <Button kind="primary" size="lg" className="!h-11" onClick={() => setApplyModal(true)}>Postuler</Button>
          )}
        </div>
      </div>

      {/* Modal candidature */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Postuler à cette offre">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <CompanyMark name={job.company?.name} size={48} />
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold text-[var(--kz-ink)] truncate">{job.title}</h3>
              <p className="text-[13px] text-[var(--kz-mute)] truncate">{job.company?.name} · {job.location}</p>
            </div>
          </div>
          {error && <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          {prequalQuestions.length > 0 && (
            <div className="flex flex-col gap-4 p-4 rounded-[20px] bg-[var(--osc-surface)] border border-[var(--kz-line)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)]">Questions du recruteur</p>
              {prequalQuestions.map((q) => (
                <div key={q.id}>
                  <label className="block text-[14px] font-medium text-[var(--kz-ink)] mb-2">{q.label}{q.required && <span className="text-[var(--kz-orange)]"> *</span>}</label>
                  {q.type === 'oui_non' ? (
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[var(--osc-surface-hi)]" role="radiogroup" aria-label={q.label}>
                      {['Oui', 'Non'].map((opt) => (
                        <button key={opt} type="button" role="radio" aria-checked={prequalAnswers[q.id] === opt}
                          onClick={() => setPrequalAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className={cn('osc-press h-9 rounded-full text-[14px] font-semibold transition-colors',
                            prequalAnswers[q.id] === opt ? 'bg-[var(--kz-ink)] text-[var(--kz-inverse)] shadow' : 'text-[var(--kz-mute)] hover:text-[var(--kz-ink)]')}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : q.type === 'choix' ? (
                    <select value={prequalAnswers[q.id] ?? ''} onChange={(e) => setPrequalAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      className="w-full h-11 px-3.5 rounded-xl border border-[var(--kz-edge)] text-sm text-[var(--kz-text)] bg-[var(--osc-surface-hi)] outline-none focus:border-[var(--kz-blue)] [&>option]:bg-[#1C1C22]">
                      <option value="">Choisir…</option>
                      {(q.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={prequalAnswers[q.id] ?? ''} onChange={(e) => setPrequalAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      className="w-full h-11 px-3.5 rounded-xl border border-[var(--kz-edge)] text-sm text-[var(--kz-text)] bg-[var(--osc-surface-hi)] outline-none placeholder:text-[var(--kz-mute)] focus:border-[var(--kz-blue)]" placeholder="Votre réponse" />
                  )}
                </div>
              ))}
            </div>
          )}

          <Textarea
            label="Lettre de motivation (optionnel)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Pourquoi ce poste t'intéresse…"
            rows={5}
          />

          {/* Raccourci KazaIA dans le modal */}
          {!coverLetter && (
            <button
              type="button"
              onClick={() => { setApplyModal(false); setCoverLetterModal(true) }}
              className="osc-press os-ring-aurora flex items-center gap-3 text-left p-3.5 rounded-[18px] bg-[var(--osc-surface)] hover:bg-[var(--osc-surface-hi)]"
            >
              <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white shrink-0" style={{ background: 'var(--os-aurora)' }}><Sparkles size={15} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-semibold text-[var(--kz-ink)]">Générer avec KazaIA</span>
                <span className="block text-[12px] text-[var(--kz-mute)]">Une lettre personnalisée en 5 secondes</span>
              </span>
              <ArrowRight size={16} className="text-[var(--kz-mute)]" />
            </button>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <Button kind="soft" size="lg" full onClick={() => setApplyModal(false)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={applying} onClick={handleApply}>Envoyer ma candidature</Button>
          </div>
        </div>
      </Modal>

      {/* Modal KazaIA — Cover Letter */}
      <CoverLetterModal
        open={coverLetterModal}
        onClose={() => setCoverLetterModal(false)}
        jobId={id}
        jobTitle={job.title}
        companyName={job.company?.name ?? 'l\'entreprise'}
        onUseLetter={(letter) => {
          setCoverLetter(letter)
          setApplyModal(true)
        }}
      />

      {/* Modal KazaIA — Préparation entretien */}
      <InterviewPrepModal
        open={interviewModal}
        onClose={() => setInterviewModal(false)}
        jobId={id}
        jobTitle={job.title}
      />
    </div>
  )
}

import { useInterviewPrepAI, useExplainJobAI } from '@/features/ai/useKazaIA'
import { Modal as ModalBase } from '@/components/ui/Modal'
import { ViewTransition } from 'react'

function DetailSection({ icon, tint, title, aside, children }: { icon: ReactNode; tint: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="osc-card p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ color: tint, background: `color-mix(in srgb, ${tint} 16%, transparent)` }}>
          {icon}
        </span>
        <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)] flex-1">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function ExplainJobSection({ jobId }: { jobId: string }) {
  const { generating, explain, raw, error, generate } = useExplainJobAI()
  const [open, setOpen] = useState(false)
  const started = generating || explain || raw || error

  const handleClick = () => {
    setOpen(v => !v)
    if (!started) generate(jobId)
  }

  return (
    <div className={cn('osc-card overflow-hidden transition-colors', open && 'bg-[var(--osc-surface-hi)]')}>
      <button onClick={handleClick} aria-expanded={open} className="flex items-center gap-3 w-full text-left p-5 sm:px-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--kz-blue)] rounded-[24px]">
        <span className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 text-black bg-[var(--kz-green)]">
          <Lightbulb size={16} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[16px] font-semibold text-[var(--kz-ink)] tracking-[-0.01em]">Comprendre l&apos;offre en clair</span>
          <span className="block text-[12px] text-[var(--kz-mute)]">KazaIA résume et décode le jargon</span>
        </span>
        <ChevronDown size={18} className={cn('shrink-0 text-[var(--kz-mute)] transition-transform duration-300', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="osc-drop px-5 sm:px-6 pb-6">
          {generating && (
            <div className="flex flex-col items-center gap-3 py-6">
              <InlineLoader size={40} />
              <p className="text-sm text-[var(--kz-mute)]">KazaIA décrypte l&apos;offre pour toi…</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {!generating && explain && (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)] mb-1.5">Synthèse</p>
                <p className="text-[15px] text-[var(--kz-text)] leading-relaxed">{explain.synthese}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)] mb-2">Les missions, simplement</p>
                <ul className="flex flex-col gap-2">
                  {explain.missions?.map((m, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] text-[var(--kz-text)]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--kz-green)]" />{m}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)] mb-1.5">En langage accessible</p>
                <p className="text-[15px] text-[var(--kz-text)] leading-relaxed">{explain.reformulation}</p>
              </div>
              <div className="p-4 rounded-[18px] bg-[var(--kz-green-soft)] border border-[color-mix(in_srgb,var(--kz-green)_25%,transparent)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-green)] mb-1.5 flex items-center gap-1.5">
                  <Wallet size={13} /> Marché salarial local (indicatif)
                </p>
                <p className="text-[14px] text-[var(--kz-text)] leading-relaxed">{explain.salaire}</p>
              </div>
              {explain.competences?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)] mb-2">Compétences principales recherchées</p>
                  <div className="flex gap-2 flex-wrap">
                    {explain.competences.map((c, i) => (
                      <span key={i} className="inline-flex items-center h-7 px-3 rounded-full text-[12px] font-medium text-[var(--kz-text)] bg-[var(--kz-line)]">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-[var(--kz-mute)]">Généré par KazaIA — à titre indicatif, vérifie toujours l&apos;offre originale.</p>
            </div>
          )}

          {!generating && !explain && raw && (
            <div className="p-4 rounded-[18px] border border-[var(--kz-line)] bg-[var(--osc-surface)] text-sm text-[var(--kz-text)] leading-relaxed whitespace-pre-wrap">
              {raw}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InterviewPrepModal({ open, onClose, jobId, jobTitle }: {
  open: boolean; onClose: () => void; jobId: string; jobTitle: string
}) {
  const { generating, questions, error, generate } = useInterviewPrepAI()

  // Générer dès l'ouverture
  if (open && !questions && !generating && !error) {
    generate(jobId)
  }

  return (
    <ModalBase open={open} onClose={onClose} title={`Préparer l'entretien — ${jobTitle}`} size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3.5 rounded-[18px] bg-[var(--kz-violet-soft)] border border-[color-mix(in_srgb,var(--kz-violet)_25%,transparent)]">
          <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 text-white bg-[var(--kz-violet)]"><Brain size={16} /></span>
          <p className="text-[14px] font-medium text-[var(--kz-ink)]">
            KazaIA génère des questions d&apos;entretien personnalisées pour ce poste.
          </p>
        </div>

        {generating && (
          <div className="flex flex-col items-center gap-3 py-8">
            <InlineLoader size={48} />
            <p className="text-sm text-[var(--kz-mute)]">Analyse du poste en cours…</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {questions && !generating && (
          <div className="osc-drop p-4 rounded-[18px] border border-[var(--kz-line)] bg-[var(--osc-surface)] text-[14px] text-[var(--kz-text)] leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {questions}
          </div>
        )}

        <Button kind="soft" size="lg" onClick={onClose}>Fermer</Button>
      </div>
    </ModalBase>
  )
}
