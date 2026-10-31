'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Eye, Users, Edit, Trash2, ToggleLeft, EyeOff, User, Rocket, ArrowRight, AlertTriangle, Info, Send, Pause, Archive, Hourglass, ScrollText, Crown, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Tooltip } from '@/components/ui/radix'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import type { Job } from '@/lib/types'
import type { CompanyBillingSummary } from '@/lib/queries/billing-summary'
import { timeAgo, formatSalary } from '@/lib/utils'
import { KZ, JOB_BOOST_OPTIONS } from '@/lib/constants'
import { island } from '@/lib/island'
import {
  JOB_STATUS_META, JOB_EXPIRY_WARNING_DAYS, JOB_DURATION_DAYS, daysUntilExpiry, recruiterActions, resolveJobStatus,
  type JobAction, type JobStatus,
} from '@/lib/job-lifecycle'
import { QuestHeader, Rune, toneStyle } from '@/components/quest/recruteur/QuestChrome'
import { sparkBurst } from '@/components/quest/recruteur/effects'
import { QUEST_STATUS_LORE, QUEST_STATUS_TONE } from '@/components/quest/recruteur/hero'

type Filter = 'all' | JobStatus
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',       label: 'Toutes' },
  { id: 'published', label: 'En ligne' },
  { id: 'draft',     label: 'Brouillons' },
  { id: 'paused',    label: 'En pause' },
  { id: 'expired',   label: 'Expirées' },
  { id: 'archived',  label: 'Archivées' },
  { id: 'suspended', label: 'Suspendues' },
]

function initialFilter(): Filter {
  if (typeof window === 'undefined') return 'all'
  const s = new URLSearchParams(window.location.search).get('status')
  return FILTERS.find((f) => f.id === s)?.id ?? 'all'
}

const PUBLISH_LABEL: Partial<Record<JobStatus, string>> = {
  draft: 'Publier', paused: 'Remettre en ligne', expired: 'Republier 60 j', archived: 'Republier',
}

export default function RecruiterJobsPage() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [boostFor, setBoostFor] = useState<Job | null>(null)
  const [quota, setQuota] = useState<{ ok: boolean; max: number; used: number; planName: string; reason?: string } | null>(null)
  const [quotaModal, setQuotaModal] = useState(false)
  const [billingSummary, setBillingSummary] = useState<CompanyBillingSummary | null>(null)
  // Filtre initial depuis l'URL (lien des notifications « offre expirée »).
  // Les onglets ne s'affichent qu'après chargement : pas d'écart d'hydratation.
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [actionError, setActionError] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  const fetchJobs = async () => {
    if (!profile) return
    try {
      const [res, q, bs] = await Promise.all([
        fetch('/api/recruiter/jobs'),
        fetch('/api/recruiter/quota'),
        fetch('/api/recruiter/billing-summary'),
      ])
      if (res.ok) setJobs((await res.json()) as Job[])
      if (q.ok) setQuota(await q.json())
      if (bs.ok) setBillingSummary(await bs.json() as CompanyBillingSummary)
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { if (profile) fetchJobs() }, [profile])

  /** Renvoie true si l'action a abouti (utilisé pour la bannière de récompense). */
  const runAction = async (job: Job, action: JobAction): Promise<boolean> => {
    if (action === 'archive' && !confirm('Archiver cette offre ? Elle ne sera plus visible des candidats ; vous pourrez la republier plus tard.')) return false
    setPending(job.id)
    setActionError('')
    let ok = false
    try {
      const res = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setActionError(data.error ?? 'Action impossible. Réessayez.')
      } else ok = true
    } catch {
      setActionError('Connexion impossible. Réessayez.')
    }
    setPending(null)
    fetchJobs()
    return ok
  }

  const publish = async (job: Job, origin: Element | null) => {
    if (await runAction(job, 'publish')) {
      sparkBurst(origin)
      island({ title: 'Quête affichée au tableau', subtitle: job.title, tone: 'success' })
    }
  }

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, draft: 0, published: 0, paused: 0, expired: 0, archived: 0, suspended: 0 }
    for (const j of jobs) {
      const s = resolveJobStatus(j)
      c[s]++
      if (s !== 'archived') c.all++
    }
    return c
  }, [jobs])

  const visibleJobs = jobs.filter((j) => {
    const s = resolveJobStatus(j)
    return filter === 'all' ? s !== 'archived' : s === filter
  })

  const deleteJob = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return
    await fetch(`/api/recruiter/jobs/${id}`, { method: 'DELETE' })
    fetchJobs()
  }

  const quotaPct = quota && quota.max > 0 ? Math.min(100, Math.round((quota.used / quota.max) * 100)) : null

  return (
    <div className="max-w-[1000px] mx-auto">
      <QuestHeader
        eyebrow="Mes offres"
        icon={<ScrollText size={18} />}
        title={<>Quêtes <span className="qx-text-arcane">publiées</span></>}
        subtitle={
          <>
            {counts.all} offre(s)
            {quota && quota.max !== -1 && ` · ${quota.used}/${quota.max} en ligne — forfait ${quota.planName}`}
            {quota && quota.max === -1 && ` · illimité (${quota.planName})`}
            {quotaPct !== null && (
              <span className="block mt-2 max-w-[260px]">
                <span className="qxr-xp-mini block" style={toneStyle(quotaPct >= 100 ? 'var(--kz-orange)' : 'var(--qx-gold)')}
                  role="progressbar" aria-label="Emplacements de quête utilisés" aria-valuenow={quotaPct} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${Math.max(quotaPct, 3)}%` }} />
                </span>
              </span>
            )}
          </>
        }
        actions={quota && !quota.ok ? (
          <Button kind="primary" size="md" icon={<Plus size={16} />} onClick={() => setQuotaModal(true)}>Nouvelle offre</Button>
        ) : (
          <Link href="/recruteur/offres/nouvelle">
            <Button kind="primary" size="md" icon={<Plus size={16} />}>Nouvelle offre</Button>
          </Link>
        )}
      />

      {/* Bannière facturation contextuelle */}
      {billingSummary && (() => {
        const s = billingSummary
        if (s.source === 'campaign' && s.message.severity === 'success') {
          return (
            <div className="mb-4 rounded-xl border border-[#4ADE80]/45 bg-[var(--kz-green-soft)] px-4 py-3 flex items-center gap-2 text-sm">
              <Info size={15} color={KZ.green} className="shrink-0" />
              <span className="text-[var(--kz-ink)]">
                Phase de déploiement active : vos annonces restent publiées et les offres seront disponibles prochainement.
              </span>
            </div>
          )
        }
        if (s.isOverLimit || !s.canPublishJob) {
          return (
            <div className="mb-4 rounded-xl border border-[#FACC15]/45 bg-[var(--kz-yellow-soft)] px-4 py-3 flex items-start gap-2 text-sm">
              <AlertTriangle size={15} color={KZ.yellow} className="shrink-0 mt-0.5" />
              <div className="text-[var(--kz-ink)]">
                <span className="font-semibold">
                  {s.isOverLimit
                    ? 'Vous dépassez actuellement la limite de votre offre.'
                    : s.message.title}
                </span>
                {' '}Vos annonces existantes restent visibles, mais les nouvelles publications sont bloquées.{' '}
                {s.message.primaryActionHref && s.message.primaryActionLabel && (
                  <Link href={s.message.primaryActionHref} className="font-bold text-[var(--qx-magenta)] hover:underline ml-1">
                    {s.message.primaryActionLabel} →
                  </Link>
                )}
              </div>
            </div>
          )
        }
        return null
      })()}

      {actionError && (
        <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError('')} className="font-bold" aria-label="Fermer"><X size={14} /></button>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="qxr-tabs mb-4" role="tablist" aria-label="Filtrer les offres">
          {FILTERS.filter((f) => f.id === 'all' || counts[f.id] > 0 || filter === f.id).map((f) => {
            const active = filter === f.id
            return (
              <button key={f.id} role="tab" aria-selected={active} onClick={() => setFilter(f.id)} className="qxr-tab">
                {f.id !== 'all' && <span className="qxr-column-gem" style={toneStyle(QUEST_STATUS_TONE[f.id])} aria-hidden />}
                {f.label} <span className="qxr-tab-count">{counts[f.id]}</span>
              </button>
            )
          })}
        </div>
      )}

      {loading ? <PageLoader /> : jobs.length === 0 ? (
        <div className="qx-panel">
          <EmptyState
            title="Aucune offre pour l'instant"
            description="Créez votre première offre d'emploi et trouvez les meilleurs talents de La Réunion."
            icon={<Plus size={28} />}
            action={<Link href="/recruteur/offres/nouvelle"><Button kind="primary">Créer une offre</Button></Link>}
          />
        </div>
      ) : visibleJobs.length === 0 ? (
        <p className="text-sm text-[var(--kz-mute)] text-center py-10">Aucune offre dans cette catégorie.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleJobs.map((job, idx) => {
            const status = resolveJobStatus(job)
            const meta = JOB_STATUS_META[status]
            const tone = QUEST_STATUS_TONE[status]
            const daysLeft = status === 'published' ? daysUntilExpiry(job.expires_at) : null
            const urgent = daysLeft !== null && daysLeft <= JOB_EXPIRY_WARNING_DAYS
            const actions = recruiterActions(status)
            const co = (job as unknown as { company?: { name: string; logo_url: string | null } }).company
            const pub = (job as unknown as { publisher?: { full_name: string } }).publisher
            const anonymous = (job as unknown as { is_anonymous?: boolean }).is_anonymous
            const legend = job.is_boosted && status === 'published'
            return (
              <li key={job.id} className="qxr-scroll qx-rise p-4 pl-5" data-legend={legend}
                style={toneStyle(tone, { animationDelay: `${Math.min(idx, 8) * 0.04}s` })}
                aria-busy={pending === job.id}>
                <div className="flex flex-col md:flex-row md:items-center gap-4 transition-opacity" style={{ opacity: pending === job.id ? 0.6 : 1 }}>
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Blason de l'entreprise */}
                    {co && (
                      <span aria-hidden className="w-11 h-11 shrink-0 hidden min-[420px]:flex items-center justify-center rounded-xl border overflow-hidden bg-[#160B2A] text-[11px] font-extrabold text-white"
                        style={{ borderColor: `color-mix(in srgb, ${tone} 55%, transparent)`, boxShadow: `0 0 16px -6px ${tone}` }}>
                        {co.logo_url ? <img src={co.logo_url} alt="" className="w-full h-full object-cover" /> : co.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-md border"
                          style={{ color: tone, borderColor: `color-mix(in srgb, ${tone} 50%, transparent)`, background: `color-mix(in srgb, ${tone} 10%, transparent)` }}>
                          <span className="qxr-column-gem w-1.5 h-1.5" aria-hidden />{meta.label}
                        </span>
                        {job.is_boosted && (
                          <span className="qxr-rarity" style={toneStyle('var(--qx-gold)')}><Crown size={10} aria-hidden />Boostée</span>
                        )}
                        {anonymous && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--kz-mute)] px-1.5 py-0.5 rounded-md border border-[#C084FC]/25">
                            <EyeOff size={10} aria-hidden />Anonyme
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] sm:text-base font-bold text-white leading-snug break-words">{job.title}</h3>
                      <div className="flex items-center gap-x-2 gap-y-1 text-xs text-[var(--kz-mute)] flex-wrap mt-0.5">
                        <span className="inline-flex items-center gap-1"><MapPin size={11} aria-hidden />{job.location}</span>
                        <span>· {job.job_type}</span>
                        <span>· {formatSalary(job.salary_min, job.salary_max)}</span>
                        <span>· {timeAgo(job.created_at)}</span>
                        {pub && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-[var(--kz-line)]" style={{ background: KZ.cream2 }}>
                            <User size={9} aria-hidden />{pub.full_name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] italic mt-1" style={{ color: status === 'suspended' ? '#FCA5A5' : 'var(--kz-mute)' }}>
                        {status === 'suspended' ? 'Suspendue par la modération' : QUEST_STATUS_LORE[status]}
                      </p>

                      {/* Sablier d'expiration */}
                      {daysLeft !== null && (
                        <div className="mt-2.5 max-w-[340px]" style={toneStyle(urgent ? 'var(--kz-orange)' : 'var(--kz-green)')}>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className={`inline-flex items-center gap-1 font-semibold ${urgent ? 'text-[#FDBA74]' : 'text-[var(--kz-text)]'}`}>
                              <Hourglass size={11} aria-hidden />
                              {urgent ? `Expire dans ${daysLeft} j` : `${daysLeft} j restants`}
                            </span>
                            {job.expires_at && <span className="text-[var(--kz-mute)]">jusqu&apos;au {new Date(job.expires_at).toLocaleDateString('fr-FR')}</span>}
                          </div>
                          <div className="qxr-hourglass" aria-hidden>
                            <span style={{ width: `${Math.max(3, Math.min(100, (daysLeft / JOB_DURATION_DAYS) * 100))}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Runes + actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#C084FC]/15">
                    <div className="flex items-center gap-2">
                      <Rune value={job.views} label="vues" icon={<Eye size={9} />} />
                      <Rune value={job.applications_count} label="cand." icon={<Users size={9} />} tone="var(--qx-gold)" />
                    </div>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {actions.includes('publish') && (
                        <Button kind="primary" size="sm" icon={<Send size={13} />} disabled={pending === job.id}
                          onClick={(e) => publish(job, e.currentTarget.closest('li'))}>
                          {PUBLISH_LABEL[status] ?? 'Publier'}
                        </Button>
                      )}
                      {actions.includes('pause') && (
                        <Tooltip content="Mettre en pause">
                          <button onClick={() => runAction(job, 'pause')} disabled={pending === job.id} className="qxr-icon-btn" aria-label="Mettre en pause">
                            <Pause size={15} />
                          </button>
                        </Tooltip>
                      )}
                      {status === 'published' && (
                        <Tooltip content={job.is_boosted ? 'Prolonger la mise en avant' : 'Booster cette offre'}>
                          <button onClick={() => setBoostFor(job)} className="qxr-icon-btn" aria-label="Booster cette offre"
                            style={{ color: job.is_boosted ? 'var(--qx-gold)' : undefined }}>
                            <Rocket size={16} fill={job.is_boosted ? 'currentColor' : 'none'} />
                          </button>
                        </Tooltip>
                      )}
                      {status !== 'suspended' && (
                        <Tooltip content="Modifier">
                          <Link href={`/recruteur/offres/${job.id}/modifier`} aria-label="Modifier" className="qxr-icon-btn">
                            <Edit size={15} />
                          </Link>
                        </Tooltip>
                      )}
                      {actions.includes('archive') && (
                        <Tooltip content="Archiver">
                          <button onClick={() => runAction(job, 'archive')} disabled={pending === job.id} className="qxr-icon-btn" aria-label="Archiver">
                            <Archive size={15} />
                          </button>
                        </Tooltip>
                      )}
                      <Tooltip content="Supprimer">
                        <button onClick={() => deleteJob(job.id)} className="qxr-icon-btn" data-danger aria-label="Supprimer">
                          <Trash2 size={15} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal boost */}
      <BoostModal job={boostFor} onClose={() => setBoostFor(null)} />

      {/* Modal quota atteint */}
      <Modal open={quotaModal} onClose={() => setQuotaModal(false)}
        title={quota?.reason === 'expired' ? 'Abonnement à activer' : 'Limite d\'offres atteinte'} size="sm">
        <div className="flex flex-col gap-4">
          {quota?.reason === 'expired' ? (
            <p className="text-sm text-[var(--kz-text)] leading-relaxed">
              Votre essai ou abonnement a expiré. Activez un forfait pour publier de nouvelles offres.
            </p>
          ) : (
            <p className="text-sm text-[var(--kz-text)] leading-relaxed">
              Vous utilisez <strong>{quota?.used}/{quota?.max}</strong> offre(s) active(s) du forfait <strong>{quota?.planName}</strong>.
              Pour en publier une nouvelle, deux options :
            </p>
          )}
          {quota?.reason !== 'expired' && (
            <ul className="flex flex-col gap-2 text-sm text-[var(--kz-text)]">
              <li className="flex items-start gap-2"><ToggleLeft size={16} className="mt-0.5 shrink-0" />Mettez en pause ou archivez une offre que vous n&apos;utilisez plus (ci-dessous).</li>
              <li className="flex items-start gap-2"><Plus size={16} className="mt-0.5 shrink-0" />Passez à un forfait supérieur pour plus d&apos;offres simultanées.</li>
            </ul>
          )}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button kind="soft" size="lg" full onClick={() => setQuotaModal(false)}>Gérer mes offres</Button>
            <Link href="/recruteur/entreprise" className="flex-1">
              <Button kind="primary" size="lg" full icon={<ArrowRight size={15} />}>Changer de forfait</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function BoostModal({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const [days, setDays] = useState(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const boostedUntil = (job as unknown as { boost_expires_at?: string | null })?.boost_expires_at

  const handleBoost = async () => {
    if (!job) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/billing/boost-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, days }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) { window.location.href = data.url as string; return }
      setError(res.status === 503
        ? 'Le paiement est momentanément indisponible. Réessaie dans un instant.'
        : (data.error as string) || 'Impossible d\'ouvrir le paiement.')
    } catch {
      setError('Connexion au paiement impossible. Réessaie.')
    }
    setLoading(false)
  }

  return (
    <Modal open={!!job} onClose={onClose} title="Booster cette offre" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#FACC15]/40 shadow-[0_0_24px_-12px_rgba(250,204,21,0.9)]" style={{ background: KZ.yellowSoft }}>
          <Crown size={18} className="text-[var(--qx-gold)] shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-bold text-[var(--kz-ink)]">{job?.title}</p>
            <p className="text-xs text-[var(--kz-mute)]">Mise en avant en tête des résultats + badge « À la une ».</p>
          </div>
        </div>

        {job?.is_boosted && boostedUntil && (
          <p className="text-xs text-[var(--kz-mute)]">
            Déjà boostée jusqu&apos;au <strong className="text-[var(--kz-ink)]">{new Date(boostedUntil).toLocaleDateString('fr-FR')}</strong> — un nouvel achat prolonge la durée.
          </p>
        )}

        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Durée du boost">
          {JOB_BOOST_OPTIONS.map((opt) => {
            const selected = days === opt.days
            return (
              <button key={opt.days} type="button" role="radio" aria-checked={selected} onClick={() => setDays(opt.days)}
                className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]/60"
                style={{
                  borderColor: selected ? 'var(--qx-gold)' : KZ.line,
                  background: selected ? KZ.yellowSoft : 'rgba(12,5,24,0.5)',
                  boxShadow: selected ? '0 0 22px -8px var(--qx-gold)' : 'none',
                }}>
                <span className="w-7 h-7 rotate-45 rounded-md border flex items-center justify-center shrink-0"
                  style={{ borderColor: selected ? 'var(--qx-gold)' : KZ.edge, background: selected ? 'var(--qx-gold)' : 'transparent' }}>
                  {selected && <Rocket size={12} color="#1A0B2E" className="-rotate-45" />}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-bold text-[var(--kz-ink)]">{opt.label}</span>
                  {opt.tag && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-[#FACC15]/40 text-[#FDE68A]" style={{ background: KZ.yellowSoft }}>{opt.tag}</span>}
                </div>
                <span className="text-lg font-extrabold qx-text-legend">{Math.floor(opt.priceCts / 100)}€</span>
              </button>
            )
          })}
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        <Button kind="dark" size="lg" full loading={loading} icon={<Rocket size={15} />} onClick={handleBoost}>
          Payer et activer le boost
        </Button>
        <p className="text-[11px] text-center text-[var(--kz-mute)]">Paiement unique sécurisé par Stripe. Sans abonnement.</p>
      </div>
    </Modal>
  )
}
