'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, Heart, Briefcase, Sparkles, Building2, Check, Brain, ChevronDown, ChevronUp, Lightbulb, Wallet, ListChecks, Gift, GraduationCap, Coins, Swords, Zap, Eye, Users, ScrollText, Map as MapIcon, Shield, Stamp } from 'lucide-react'
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
import { formatSalary, timeAgo } from '@/lib/utils'
import { getSalaryLabel } from '@/lib/constants'
import { type PrequalQuestion } from '@/lib/prequal'
import type { Job } from '@/lib/types'
import { SalaryInsightsCard } from '@/components/jobs/SalaryInsightsCard'
import { TrainingRecoCard } from '@/components/jobs/TrainingRecoCard'
import { EmployerReputation } from '@/components/jobs/EmployerReputation'
import { bountyRarity } from '@/components/quest/candidat/quest-ui'
import { Crest, PanelTitle, QuestEmpty, RarityBadge, rarityVars } from '@/components/quest/candidat/QuestKit'
import { IslandMap } from '@/components/quest/candidat/IslandMap'

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

  if (loading) return <PageLoader />
  if (!job) return (
    <div className="max-w-[560px] mx-auto py-10">
      <QuestEmpty
        icon={<ScrollText size={28} />}
        title="Parchemin introuvable"
        description="Cette prime a disparu du tableau."
        action={<Button kind="outline" onClick={() => router.back()}>Retour</Button>}
      />
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

  const { rarity, reasons } = bountyRarity(job)
  const fav = isFavorite(id)
  const missions = (job as unknown as { missions?: string | null }).missions
  const requiredLevel = (job as unknown as { required_level?: string | null }).required_level
  const benefits = (job as unknown as { benefits?: string | null }).benefits

  const rewardProps = {
    job, alreadyApplied, justApplied: applied, fav,
    onApply: () => setApplyModal(true),
    onToggleFav: () => toggle(id),
  }

  return (
    <div className="max-w-[1120px] mx-auto">
      <button onClick={() => router.back()} className="group flex items-center gap-2 text-sm font-semibold text-[var(--kz-mute)] hover:text-white mb-5 qx-rise">
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />Retour au tableau des primes
      </button>

      {/* Layout : pile sur mobile, 2 colonnes sur desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
        {/* Parchemin principal */}
        <div className="flex flex-col gap-5 min-w-0">
          <article className="qxc-scroll" style={rarityVars(rarity)} aria-labelledby="quest-title">
            <div className="flex gap-4 items-start mb-4">
              <Crest rarity={rarity} size={64} className="hidden min-[400px]:grid">{(job.company?.name ?? 'CO').slice(0, 2).toUpperCase()}</Crest>
              <div className="flex-1 min-w-0">
                <p className="kz-eyebrow text-[var(--qx-gold)] mb-1.5 flex items-center gap-1.5"><Swords size={12} aria-hidden />Avis de quête · {job.company?.name}</p>
                <ViewTransition name={`job-title-${job.id}`} share="morph">
                  <h1 id="quest-title" className="text-[24px] sm:text-[30px] lg:text-[34px] font-bold text-white leading-[1.1] break-words">{job.title}</h1>
                </ViewTransition>
                <div className="flex gap-x-3 gap-y-1.5 mt-3 flex-wrap text-[12px] text-[var(--kz-text)]">
                  <span className="flex items-center gap-1"><MapPin size={13} className="text-[var(--qx-cyan)]" aria-hidden />{job.location}</span>
                  <span className="flex items-center gap-1"><Clock size={13} className="text-[var(--kz-mute)]" aria-hidden />Affichée · {timeAgo(job.created_at)}</span>
                  <span className="flex items-center gap-1"><Briefcase size={13} className="text-[var(--qx-neon)]" aria-hidden />{job.job_type}</span>
                  {job.remote && <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-[0.1em] text-[#86EFAC] border border-[#4ADE80]/40 bg-[rgba(74,222,128,0.1)]">Télétravail</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-5">
              <RarityBadge rarity={rarity} />
              {reasons.map((r) => (
                <span key={r} className="text-[11px] font-semibold text-[var(--kz-text)] px-2 py-0.5 rounded-md border border-[#C084FC]/20 bg-[rgba(12,5,24,0.45)]">{r}</span>
              ))}
            </div>

            {(job.skills?.length ?? 0) > 0 && (
              <div className="mb-5">
                <h2 className="qxc-rune-title text-[13px] uppercase mb-3"><Shield size={14} className="text-[var(--qx-gold)]" aria-hidden />Prérequis</h2>
                <ul className="flex gap-2 flex-wrap">
                  {job.skills?.map((s) => (
                    <li key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-white border border-[#22D3EE]/35 bg-[rgba(34,211,238,0.08)]">
                      <span className="qxc-gem" style={{ ['--r' as string]: 'var(--qx-cyan)' }} aria-hidden />{s.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {job.match_score !== undefined && (() => {
              const locationMatch = profile?.location && job.location
                ? job.location.toLowerCase().includes(profile.location.toLowerCase().split(',')[0])
                  || profile.location.toLowerCase().includes(job.location.toLowerCase().split(',')[0])
                : null
              return (
                <div className="rounded-xl border border-[#E879F9]/30 bg-[rgba(12,5,24,0.55)] overflow-hidden">
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sparkles size={15} className="text-[var(--qx-magenta)]" aria-hidden />
                      <span className="text-sm font-bold text-white">
                        Affinité avec ton héros : <span className="qx-text-arcane">{job.match_score}%</span>
                      </span>
                      <button
                        onClick={() => setShowMatchDetail(v => !v)}
                        aria-expanded={showMatchDetail}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold text-[var(--qx-neon)] hover:text-white"
                      >
                        {showMatchDetail ? 'Masquer' : 'Détail'}
                        {showMatchDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                    <div className="qx-xp" role="progressbar" aria-valuenow={job.match_score} aria-valuemin={0} aria-valuemax={100} aria-label="Score de compatibilité"><span style={{ width: `${job.match_score}%` }} /></div>
                  </div>
                  {showMatchDetail && (
                    <div className="px-3.5 pb-3.5 flex flex-col gap-2.5 border-t border-[#C084FC]/20 pt-3 qx-rise">
                      <p className="text-xs font-bold text-white mb-0.5">Détail du score :</p>
                      {[
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
                      ].map(row => (
                        <div key={row.label} className="flex items-start gap-2.5">
                          <span className={`mt-0.5 w-5 h-5 rounded-md rotate-45 grid place-items-center shrink-0 ${row.ok ? 'bg-[#FACC15] text-[#1A0B2E]' : 'border border-[#FB923C] text-[#FDBA74]'}`} aria-label={row.ok ? 'Validé' : 'À améliorer'}>
                            <span className="-rotate-45 inline-flex">{row.ok ? <Check size={11} strokeWidth={3} /> : <Zap size={11} />}</span>
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white">{row.label}</span>
                              <span className="text-[10px] text-[var(--kz-mute)]">({row.pct}%)</span>
                            </div>
                            <p className="text-[11px] text-[var(--kz-mute)] mt-0.5 leading-tight">{row.tip}</p>
                          </div>
                        </div>
                      ))}
                      {job.match_score < 80 && (
                        <a
                          href="/candidat/profil"
                          className="mt-1 text-xs font-bold text-center py-2 rounded-lg border border-[#E879F9]/50 text-[#F5D0FE] transition-colors hover:bg-[rgba(232,121,249,0.15)]"
                        >
                          Améliorer mon score → compléter ma feuille de personnage
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </article>

          {/* Outils KazaIA */}
          <div className="qx-panel p-4 sm:p-5">
            <PanelTitle icon={<Sparkles size={13} />} color="var(--qx-magenta)"
              extra={<span className="text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-md text-[#D8B4FE] border border-[#A855F7]/45 bg-[rgba(168,85,247,0.16)]">Beta</span>}>
              Grimoire KazaIA
            </PanelTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button kind="violet" size="md" full icon={<Sparkles size={15} />} onClick={() => setCoverLetterModal(true)} className="whitespace-normal h-auto min-h-9 py-2">
                Générer ma lettre de motivation
              </Button>
              <Button kind="outline" size="md" full icon={<Brain size={15} />} onClick={() => setInterviewModal(true)} className="whitespace-normal h-auto min-h-9 py-2">
                Préparer mon entretien
              </Button>
            </div>
          </div>

          {/* KazaIA — Comprendre l'offre en clair */}
          <ExplainJobSection jobId={id} />

          {/* Récompense — mobile */}
          <div className="lg:hidden">
            <RewardPanel {...rewardProps} />
          </div>

          {/* ── Description ── */}
          <section className="qx-panel p-5 sm:p-6">
            <PanelTitle icon={<ScrollText size={13} />}>Ordre de mission</PanelTitle>
            <div className="text-sm leading-relaxed text-[var(--kz-text)] whitespace-pre-line break-words">{job.description}</div>
          </section>

          {/* ── Missions ── */}
          {missions && (
            <section className="qx-panel p-5 sm:p-6">
              <PanelTitle icon={<ListChecks size={13} />} color="var(--qx-neon)">Missions attendues</PanelTitle>
              <div className="text-sm leading-relaxed text-[var(--kz-text)] whitespace-pre-line break-words">{missions}</div>
            </section>
          )}

          {/* ── Profil recherché ── */}
          {job.requirements && (
            <section className="qx-panel p-5 sm:p-6">
              <PanelTitle icon={<GraduationCap size={13} />} color="var(--qx-cyan)"
                extra={requiredLevel ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border border-[#22D3EE]/40 text-[#67E8F9] bg-[rgba(34,211,238,0.08)]">{requiredLevel}</span> : null}>
                Héros recherché
              </PanelTitle>
              <div className="text-sm leading-relaxed text-[var(--kz-text)] whitespace-pre-line break-words">{job.requirements}</div>
            </section>
          )}

          {/* ── Avantages ── */}
          {benefits && (
            <section className="qx-panel p-5 sm:p-6">
              <PanelTitle icon={<Gift size={13} />}>Butin & avantages</PanelTitle>
              <div className="text-sm leading-relaxed text-[var(--kz-text)] whitespace-pre-line break-words">{benefits}</div>
            </section>
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

        {/* Colonne latérale */}
        <aside className="flex flex-col gap-5 min-w-0" aria-label="Récompense et guilde">
          <div className="hidden lg:block">
            <RewardPanel {...rewardProps} />
          </div>

          <div className="qx-panel p-5">
            <PanelTitle icon={<MapIcon size={13} />} color="var(--qx-cyan)" as="h3">Lieu de la quête</PanelTitle>
            <IslandMap location={job.location} remote={job.remote} />
          </div>

          <div className="qx-panel p-5">
            <PanelTitle icon={<Building2 size={13} />} as="h3">La guilde</PanelTitle>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-white font-semibold"><Building2 size={14} className="text-[var(--kz-mute)]" aria-hidden />{job.company?.name}</div>
              {job.company?.location && <div className="flex items-center gap-2 text-sm text-[var(--kz-text)]"><MapPin size={14} className="text-[var(--kz-mute)]" aria-hidden />{job.company.location}</div>}
              {/* KazaScore recruteur */}
              {job.recruiter_id && (
                <div className="mt-2 pt-3 border-t border-[#C084FC]/20 flex items-center gap-2">
                  <span className="text-xs text-[var(--kz-mute)]">Réactivité :</span>
                  <KazaScoreMini recruiterId={job.recruiter_id} />
                </div>
              )}
            </div>
          </div>

          {/* Réputation employeur (indicateurs réels) */}
          <EmployerReputation companyId={job.company?.id} />

          <div className="qx-panel p-4 grid grid-cols-2 gap-3">
            <div className="text-center">
              <Eye size={14} className="mx-auto text-[var(--qx-neon)] mb-1" aria-hidden />
              <div className="text-2xl font-bold text-white font-[family-name:var(--font-epic)] tabular-nums">{job.views}</div>
              <div className="text-[11px] text-[var(--kz-mute)]">regards posés</div>
            </div>
            <div className="text-center">
              <Users size={14} className="mx-auto text-[var(--qx-gold)] mb-1" aria-hidden />
              <div className="text-2xl font-bold text-white font-[family-name:var(--font-epic)] tabular-nums">{job.applications_count}</div>
              <div className="text-[11px] text-[var(--kz-mute)]">candidatures</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal candidature */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Accepter la quête">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Crest rarity={rarity} size={44}>{(job.company?.name ?? 'CO').slice(0, 2).toUpperCase()}</Crest>
            <div className="min-w-0">
              <h3 className="font-bold text-white truncate">{job.title}</h3>
              <p className="text-sm text-[var(--kz-mute)] truncate">{job.company?.name} · {job.location}</p>
            </div>
          </div>
          {error && <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          {prequalQuestions.length > 0 && (
            <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-[#FACC15]/30 bg-[rgba(250,204,21,0.05)]">
              <p className="text-sm font-bold text-[#FDE68A] flex items-center gap-1.5"><Shield size={14} aria-hidden />Épreuve du recruteur</p>
              {prequalQuestions.map((q) => (
                <div key={q.id}>
                  <label htmlFor={`pq-${q.id}`} className="block text-sm font-semibold text-[var(--kz-text)] mb-1.5">{q.label}{q.required && ' *'}</label>
                  {q.type === 'oui_non' ? (
                    <div className="flex gap-2" role="radiogroup" aria-label={q.label}>
                      {['Oui', 'Non'].map((opt) => (
                        <button key={opt} type="button" role="radio" aria-checked={prequalAnswers[q.id] === opt}
                          onClick={() => setPrequalAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className="qxc-chip flex-1 justify-center h-10">
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : q.type === 'choix' ? (
                    <select id={`pq-${q.id}`} value={prequalAnswers[q.id] ?? ''} onChange={(e) => setPrequalAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      className="w-full h-11 px-3 rounded-xl border border-[#C084FC]/30 text-sm text-[var(--kz-text)] bg-[rgba(12,5,24,0.7)] outline-none focus:border-[#E879F9] [&>option]:bg-[#1A0B2E]">
                      <option value="">Choisir…</option>
                      {(q.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input id={`pq-${q.id}`} value={prequalAnswers[q.id] ?? ''} onChange={(e) => setPrequalAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      className="w-full h-11 px-3 rounded-xl border border-[#C084FC]/30 text-sm text-[var(--kz-text)] bg-[rgba(12,5,24,0.7)] outline-none focus:border-[#E879F9] placeholder:text-[var(--kz-mute)]" placeholder="Votre réponse" />
                  )}
                </div>
              ))}
            </div>
          )}

          <Textarea
            label="Lettre de motivation (optionnel)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Pourquoi ce poste t'interesse..."
            rows={5}
          />

          {/* Raccourci KazaIA dans le modal */}
          {!coverLetter && (
            <button
              type="button"
              onClick={() => { setApplyModal(false); setCoverLetterModal(true) }}
              className="flex flex-wrap items-center gap-2 text-sm font-semibold p-3 rounded-xl border border-[#E879F9]/35 bg-[rgba(232,121,249,0.08)] text-left transition-all hover:border-[#E879F9]/70 hover:shadow-[0_0_20px_-8px_rgba(232,121,249,0.9)]"
            >
              <Sparkles size={15} className="text-[var(--qx-magenta)]" aria-hidden />
              <span className="text-[#F5D0FE]">Générer avec KazaIA</span>
              <span className="text-xs text-[var(--kz-mute)]">→ Lettre personnalisée en 5 secondes</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button kind="outline" size="lg" full onClick={() => setApplyModal(false)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={applying} onClick={handleApply} icon={<Stamp size={16} />}>Envoyer ma candidature</Button>
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

/** Panneau « Récompense » : prime, contrat et appel à l'action « Accepter la quête ». */
function RewardPanel({ job, alreadyApplied, justApplied, fav, onApply, onToggleFav }: {
  job: Job
  alreadyApplied: boolean
  justApplied: boolean
  fav: boolean
  onApply: () => void
  onToggleFav: () => void
}) {
  const sl = getSalaryLabel(job.salary_min, job.salary_max)
  const hasSalary = !!(job.salary_min || job.salary_max)
  return (
    <div className="qx-panel p-5 relative overflow-hidden">
      <div aria-hidden className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[radial-gradient(closest-side,rgba(250,204,21,0.22),transparent)] pointer-events-none" />
      <p className="kz-eyebrow text-[var(--kz-mute)] mb-1.5 flex items-center gap-1.5"><Coins size={12} className="text-[var(--qx-gold)]" aria-hidden />Récompense</p>
      <div className={`text-[26px] font-bold tracking-tight leading-tight font-[family-name:var(--font-epic)] mb-1.5 ${hasSalary ? 'qx-text-legend' : 'text-white'}`}>{formatSalary(job.salary_min, job.salary_max)}</div>
      {sl && (
        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border mb-2"
          style={{ color: `color-mix(in srgb, ${sl.color} 65%, white)`, borderColor: `color-mix(in srgb, ${sl.color} 50%, transparent)`, background: `color-mix(in srgb, ${sl.color} 12%, transparent)` }}>
          {sl.label}
        </span>
      )}
      <div className="text-sm text-[var(--kz-mute)] mb-4">{job.job_type} · {job.location}</div>
      {alreadyApplied ? (
        <div className="relative flex items-center gap-3 p-3 rounded-xl border border-[#FACC15]/40 bg-[rgba(250,204,21,0.07)]" role="status">
          <span className={`qxc-seal qxc-seal-gold relative w-12 h-12 shrink-0 ${justApplied ? 'qxc-stamp' : ''}`} style={justApplied ? undefined : { transform: 'rotate(-8deg)' }}>
            {justApplied && <span className="qxc-shockwave" aria-hidden />}
            <Stamp size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white font-[family-name:var(--font-epic)] tracking-wide">Quête acceptée</div>
            <div className="text-xs text-[var(--kz-mute)]">Candidature envoyée · suis-la dans tes quêtes actives</div>
          </div>
        </div>
      ) : !job.is_active ? (
        <div className="flex items-start gap-2 p-3 rounded-xl border border-[#C084FC]/30 bg-[rgba(168,85,247,0.08)]">
          <Clock size={16} className="shrink-0 mt-0.5 text-[var(--kz-mute)]" aria-hidden />
          <span className="text-sm text-[var(--kz-ink)]">
            <strong>Cette offre n&apos;est plus disponible.</strong>{' '}
            <Link href="/candidat/offres" className="font-bold underline text-[var(--qx-gold)]">Voir les offres en cours</Link>
          </span>
        </div>
      ) : (
        <Button kind="primary" size="lg" full onClick={onApply} icon={<Swords size={17} />} className="qx-pulse">Accepter la quête</Button>
      )}
      {alreadyApplied && (
        <Link href="/candidat/candidatures" className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--qx-neon)] hover:text-white">Voir mes quêtes actives →</Link>
      )}
      <Button kind="outline" size="md" full className="mt-2" aria-pressed={fav}
        icon={<Heart size={15} fill={fav ? 'var(--qx-magenta)' : 'none'} color={fav ? 'var(--qx-magenta)' : 'currentColor'} />}
        onClick={onToggleFav}>
        {fav ? 'Retirer des favoris' : 'Sauvegarder'}
      </Button>
    </div>
  )
}

import { useInterviewPrepAI, useExplainJobAI } from '@/features/ai/useKazaIA'
import { Modal as ModalBase } from '@/components/ui/Modal'
import { ViewTransition } from 'react'

function ExplainJobSection({ jobId }: { jobId: string }) {
  const { generating, explain, raw, error, generate } = useExplainJobAI()
  const [open, setOpen] = useState(false)
  const started = generating || explain || raw || error

  const handleClick = () => {
    setOpen(v => !v)
    if (!started) generate(jobId)
  }

  return (
    <div className="qx-panel p-4 sm:p-5">
      <button onClick={handleClick} aria-expanded={open} className="flex items-center gap-2.5 w-full text-left">
        <span aria-hidden className="w-7 h-7 rounded-md rotate-45 grid place-items-center shrink-0 border border-[#4ADE80]/55 bg-[rgba(74,222,128,0.12)] text-[#86EFAC]">
          <span className="-rotate-45 inline-flex"><Lightbulb size={13} /></span>
        </span>
        <span className="text-[15px] font-bold text-white font-[family-name:var(--font-epic)] tracking-wide">Déchiffrer le parchemin</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-md text-[#86EFAC] border border-[#4ADE80]/40 bg-[rgba(74,222,128,0.12)]">KazaIA</span>
        <span className="ml-auto text-[var(--kz-mute)]">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>
      <p className="text-xs text-[var(--kz-mute)] mt-1.5 ml-[38px]">L&apos;offre en langage clair, missions et salaire local.</p>

      {open && (
        <div className="mt-4 qx-rise">
          {generating && (
            <div className="flex flex-col items-center gap-3 py-6">
              <InlineLoader size={40} />
              <p className="text-sm text-[var(--kz-mute)]">KazaIA décrypte l&apos;offre pour toi…</p>
            </div>
          )}

          {error && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {!generating && explain && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--qx-gold)] mb-1">Synthèse</p>
                <p className="text-sm text-[var(--kz-text)] leading-relaxed">{explain.synthese}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--qx-gold)] mb-1.5">Les missions, simplement</p>
                <ul className="flex flex-col gap-1.5">
                  {explain.missions?.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--kz-text)]">
                      <Check size={14} className="mt-0.5 shrink-0 text-[#86EFAC]" aria-hidden />{m}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--qx-gold)] mb-1">En langage accessible</p>
                <p className="text-sm text-[var(--kz-text)] leading-relaxed">{explain.reformulation}</p>
              </div>
              <div className="p-3 rounded-xl border border-[#4ADE80]/30 bg-[rgba(74,222,128,0.07)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#86EFAC] mb-1 flex items-center gap-1.5">
                  <Wallet size={13} aria-hidden /> Marché salarial local (indicatif)
                </p>
                <p className="text-sm text-[var(--kz-text)] leading-relaxed">{explain.salaire}</p>
              </div>
              {explain.competences?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--qx-gold)] mb-1.5">Compétences principales recherchées</p>
                  <div className="flex gap-2 flex-wrap">
                    {explain.competences.map((c, i) => (
                      <span key={i} className="px-2 py-1 text-xs font-semibold rounded-md text-[var(--kz-ink)] bg-[rgba(168,85,247,0.12)] border border-[#C084FC]/25">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-[var(--kz-mute)] italic">Généré par KazaIA — à titre indicatif, vérifie toujours l&apos;offre originale.</p>
            </div>
          )}

          {!generating && !explain && raw && (
            <div className="p-4 rounded-xl border border-[#C084FC]/25 bg-[rgba(12,5,24,0.55)] text-sm text-[var(--kz-text)] leading-relaxed whitespace-pre-wrap">
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
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E879F9]/30 bg-[rgba(232,121,249,0.08)]">
          <Brain size={18} className="text-[var(--qx-magenta)] shrink-0" aria-hidden />
          <p className="text-sm font-semibold text-white">
            KazaIA prépare des questions d&apos;entretien personnalisées pour cette épreuve.
          </p>
        </div>

        {generating && (
          <div className="flex flex-col items-center gap-3 py-8">
            <InlineLoader size={48} />
            <p className="text-sm text-[var(--kz-mute)]">Analyse du poste en cours...</p>
          </div>
        )}

        {error && (
          <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {questions && !generating && (
          <div className="p-4 rounded-xl border border-[#C084FC]/25 bg-[rgba(12,5,24,0.55)] text-sm text-[var(--kz-text)] leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {questions}
          </div>
        )}

        <Button kind="outline" size="md" onClick={onClose}>Fermer</Button>
      </div>
    </ModalBase>
  )
}
