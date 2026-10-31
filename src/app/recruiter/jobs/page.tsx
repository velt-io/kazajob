'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Eye, Users, Edit, Trash2, ToggleLeft, EyeOff, User, Rocket, ArrowRight, AlertTriangle, Info, Send, Pause, Archive, Clock, Briefcase, MapPin, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Tooltip } from '@/components/ui/radix'
import { useAuth } from '@/features/auth/useAuth'
import type { Job } from '@/lib/types'
import type { CompanyBillingSummary } from '@/lib/queries/billing-summary'
import { timeAgo, formatSalary } from '@/lib/utils'
import { JOB_BOOST_OPTIONS } from '@/lib/constants'
import { island } from '@/lib/island'
import {
  JOB_STATUS_META, JOB_EXPIRY_WARNING_DAYS, daysUntilExpiry, recruiterActions, resolveJobStatus,
  type JobAction, type JobStatus,
} from '@/lib/job-lifecycle'
import {
  ACCENT, BADGE_ACCENT, EmptyPanel, IconButton, Monogram, PageHeader, Segmented, SkeletonList, StatusPill, accentStyle, tint,
} from '@/components/os/recruiter/primitives'

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

const ACTION_DONE: Record<JobAction, string> = {
  publish: 'Offre en ligne', pause: 'Offre en pause', archive: 'Offre archivée', suspend: 'Offre suspendue',
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

  const runAction = async (job: Job, action: JobAction) => {
    if (action === 'archive' && !confirm('Archiver cette offre ? Elle ne sera plus visible des candidats ; vous pourrez la republier plus tard.')) return
    setPending(job.id)
    setActionError('')
    try {
      const res = await fetch(`/api/recruiter/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setActionError(data.error ?? 'Action impossible. Réessayez.')
      } else {
        island({ title: ACTION_DONE[action], subtitle: job.title, tone: action === 'publish' ? 'success' : 'info' })
      }
    } catch {
      setActionError('Connexion impossible. Réessayez.')
    }
    setPending(null)
    fetchJobs()
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

  const maxApps = Math.max(1, ...visibleJobs.map((j) => j.applications_count ?? 0))
  const quotaPct = quota && quota.max > 0 ? Math.min(100, (quota.used / quota.max) * 100) : 0

  return (
    <div className="max-w-[1080px] mx-auto">
      <PageHeader
        eyebrow="Recrutement"
        title="Mes offres"
        subtitle={<>
          <span className="text-white font-medium tabular-nums">{counts.all}</span> offre(s)
          {quota && quota.max === -1 && ` · illimité (${quota.planName})`}
        </>}
        actions={quota && !quota.ok ? (
          <Button kind="primary" size="lg" icon={<Plus size={16} />} onClick={() => setQuotaModal(true)}>Nouvelle offre</Button>
        ) : (
          <Link href="/recruiter/jobs/new">
            <Button kind="primary" size="lg" icon={<Plus size={16} />}>Nouvelle offre</Button>
          </Link>
        )}
      />

      {/* Jauge du forfait (façon stockage macOS) */}
      {quota && quota.max !== -1 && (
        <div className="osr-panel flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-5 py-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: quota.ok ? ACCENT.blue : ACCENT.orange }}>
              <Briefcase size={16} />
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-white">Forfait {quota.planName}</div>
              <div className="text-[12px] text-[var(--kz-mute)] tabular-nums">{quota.used} sur {quota.max} offre(s) en ligne</div>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="osr-bar flex-1" role="meter" aria-valuenow={quota.used} aria-valuemin={0} aria-valuemax={quota.max} aria-label="Offres en ligne">
              <span style={{ width: `${Math.max(2, quotaPct)}%`, background: quotaPct >= 100 ? ACCENT.orange : 'linear-gradient(90deg, var(--kz-blue), var(--kz-violet))' }} />
            </div>
            <span className="text-[13px] font-semibold text-white tabular-nums shrink-0">{Math.round(quotaPct)} %</span>
          </div>
          {!quota.ok && (
            <Link href="/recruiter/company" className="text-[13px] font-medium text-[var(--kz-blue)] hover:brightness-125 shrink-0">Changer de forfait</Link>
          )}
        </div>
      )}

      {/* Bannière facturation contextuelle */}
      {billingSummary && (() => {
        const s = billingSummary
        if (s.source === 'campaign' && s.message.severity === 'success') {
          return (
            <div className="mb-4 rounded-2xl px-4 py-3 flex items-center gap-3 text-[13px]" style={{ background: tint(ACCENT.green, 10), boxShadow: `inset 0 0 0 1px ${tint(ACCENT.green, 30)}` }}>
              <Info size={16} style={{ color: ACCENT.green }} className="shrink-0" />
              <span className="text-[var(--kz-ink)]">
                Phase de déploiement active : vos annonces restent publiées et les offres seront disponibles prochainement.
              </span>
            </div>
          )
        }
        if (s.isOverLimit || !s.canPublishJob) {
          return (
            <div className="mb-4 rounded-2xl px-4 py-3 flex items-start gap-3 text-[13px]" style={{ background: tint(ACCENT.yellow, 9), boxShadow: `inset 0 0 0 1px ${tint(ACCENT.yellow, 30)}` }}>
              <AlertTriangle size={16} style={{ color: ACCENT.yellow }} className="shrink-0 mt-0.5" />
              <div className="text-[var(--kz-ink)] leading-relaxed">
                <span className="font-semibold">
                  {s.isOverLimit
                    ? 'Vous dépassez actuellement la limite de votre offre.'
                    : s.message.title}
                </span>
                {' '}Vos annonces existantes restent visibles, mais les nouvelles publications sont bloquées.{' '}
                {s.message.primaryActionHref && s.message.primaryActionLabel && (
                  <Link href={s.message.primaryActionHref} className="font-semibold text-[var(--kz-blue)] hover:brightness-125 ml-1 inline-flex items-center gap-0.5">
                    {s.message.primaryActionLabel} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          )
        }
        return null
      })()}

      {actionError && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2 animate-slide-up" role="alert">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError('')} className="osr-icon-btn !w-6 !h-6" aria-label="Fermer"><X size={14} /></button>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="mb-4">
          <Segmented<Filter>
            ariaLabel="Filtrer les offres"
            value={filter}
            onChange={setFilter}
            items={FILTERS.filter((f) => f.id === 'all' || counts[f.id] > 0 || filter === f.id).map((f) => ({ id: f.id, label: f.label, count: counts[f.id] }))}
          />
        </div>
      )}

      {loading ? <SkeletonList rows={5} height={84} /> : jobs.length === 0 ? (
        <div className="os-glass rounded-[28px]">
          <EmptyPanel
            icon={<Plus size={28} />}
            title="Aucune offre pour l'instant"
            description="Créez votre première offre d'emploi et trouvez les meilleurs talents de La Réunion."
            action={<Link href="/recruiter/jobs/new"><Button kind="primary">Créer une offre</Button></Link>}
          />
        </div>
      ) : visibleJobs.length === 0 ? (
        <p className="text-sm text-[var(--kz-mute)] text-center py-10">Aucune offre dans cette catégorie.</p>
      ) : (
        <div className="os-glass rounded-[26px] p-1.5 osr-sep">
          {visibleJobs.map((job, idx) => {
            const status = resolveJobStatus(job)
            const meta = JOB_STATUS_META[status]
            const daysLeft = status === 'published' ? daysUntilExpiry(job.expires_at) : null
            const actions = recruiterActions(status)
            const co = (job as unknown as { company?: { name: string; logo_url: string | null } }).company
            const pub = (job as unknown as { publisher?: { full_name: string } }).publisher
            const isPending = pending === job.id
            return (
            <div key={job.id} className="osr-in" style={{ ['--i' as string]: idx }}>
            <div className={`osr-row flex flex-wrap md:flex-nowrap items-center gap-x-4 gap-y-3 px-3 py-3.5 ${isPending ? 'osr-skel' : ''}`}
              aria-busy={isPending || undefined}
              style={{ opacity: isPending ? 0.75 : 1 }}>
              {/* Logo entreprise */}
              {co ? <Monogram name={co.name} src={co.logo_url} size={44} /> : <Monogram name={job.title} size={44} gradient={`linear-gradient(145deg, ${BADGE_ACCENT[meta.color]}, ${tint(BADGE_ACCENT[meta.color], 40)})`} />}

              <div className="flex-1 min-w-0 basis-[calc(100%-60px)] md:basis-auto">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-white truncate max-w-full">{job.title}</h3>
                  <StatusPill accent={BADGE_ACCENT[meta.color]} live={status === 'published'}>{meta.label}</StatusPill>
                  {daysLeft !== null && daysLeft <= JOB_EXPIRY_WARNING_DAYS && (
                    <span className="osr-chip" style={{ color: ACCENT.yellow, background: tint(ACCENT.yellow, 14) }}><Clock size={11} />Expire dans {daysLeft} j</span>
                  )}
                  {job.is_boosted && <span className="osr-chip" style={{ color: ACCENT.orange, background: tint(ACCENT.orange, 14) }}><Rocket size={11} />Boostée</span>}
                  {(job as unknown as { is_anonymous?: boolean }).is_anonymous && (
                    <span className="osr-chip"><EyeOff size={11} />Anonyme</span>
                  )}
                </div>
                <div className="flex items-center gap-x-2 gap-y-1 text-[12px] text-[var(--kz-mute)] flex-wrap">
                  <span className="inline-flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                  <span aria-hidden>·</span><span>{job.job_type}</span>
                  <span aria-hidden>·</span><span>{formatSalary(job.salary_min, job.salary_max)}</span>
                  <span aria-hidden>·</span><span>{timeAgo(job.created_at)}</span>
                  {daysLeft !== null && job.expires_at && daysLeft > JOB_EXPIRY_WARNING_DAYS && (
                    <><span aria-hidden>·</span><span>en ligne jusqu&apos;au {new Date(job.expires_at).toLocaleDateString('fr-FR')}</span></>
                  )}
                  {status === 'suspended' && <span className="font-semibold" style={{ color: ACCENT.orange }}>· suspendue par la modération</span>}
                  {/* Auteur */}
                  {pub && <span className="osr-chip !h-5"><User size={10} />{pub.full_name}</span>}
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center gap-4 shrink-0 md:w-[150px]">
                <Tooltip content="Vues">
                  <div className="text-right" tabIndex={0}>
                    <div className="text-[15px] font-semibold text-white tabular-nums leading-none">{job.views}</div>
                    <div className="text-[10px] text-[var(--kz-mute)] flex items-center justify-end gap-0.5 mt-1"><Eye size={10} />vues</div>
                  </div>
                </Tooltip>
                <Tooltip content="Candidatures">
                  <div className="flex-1 min-w-[64px]" tabIndex={0}>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-[15px] font-semibold text-white tabular-nums leading-none">{job.applications_count}</span>
                      <Users size={10} className="text-[var(--kz-mute)]" />
                    </div>
                    <div className="osr-bar mt-1.5" style={{ height: 3 }}>
                      <span style={{ width: `${Math.max(4, ((job.applications_count ?? 0) / maxApps) * 100)}%`, background: 'var(--os-aurora)' }} />
                    </div>
                  </div>
                </Tooltip>
              </div>

              <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                {actions.includes('publish') && (
                  <Button kind="primary" size="sm" icon={<Send size={13} />} disabled={isPending} className="mr-1"
                    onClick={() => runAction(job, 'publish')}>
                    {PUBLISH_LABEL[status] ?? 'Publier'}
                  </Button>
                )}
                <div className="osr-reveal flex items-center gap-0.5">
                  {actions.includes('pause') && (
                    <IconButton label="Mettre en pause" onClick={() => runAction(job, 'pause')} disabled={isPending}>
                      <Pause size={15} />
                    </IconButton>
                  )}
                  {status === 'published' && (
                    <IconButton label={job.is_boosted ? 'Prolonger la mise en avant' : 'Booster cette offre'} tone="accent" onClick={() => setBoostFor(job)}
                      className={job.is_boosted ? '!text-[var(--kz-orange)]' : ''}>
                      <Rocket size={16} fill={job.is_boosted ? 'currentColor' : 'none'} />
                    </IconButton>
                  )}
                  {status !== 'suspended' && (
                    <Tooltip content="Modifier">
                      <Link href={`/recruiter/jobs/${job.id}/edit`} aria-label="Modifier" className="osr-icon-btn">
                        <Edit size={15} />
                      </Link>
                    </Tooltip>
                  )}
                  {actions.includes('archive') && (
                    <IconButton label="Archiver" onClick={() => runAction(job, 'archive')} disabled={isPending}>
                      <Archive size={15} />
                    </IconButton>
                  )}
                  <IconButton label="Supprimer" tone="danger" onClick={() => deleteJob(job.id)}>
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </div>
            </div>
            </div>
            )
          })}
        </div>
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
              <li className="osr-inset flex items-start gap-2.5 p-3"><ToggleLeft size={16} className="mt-0.5 shrink-0 text-[var(--kz-blue)]" />Mettez en pause ou archivez une offre que vous n&apos;utilisez plus (ci-dessous).</li>
              <li className="osr-inset flex items-start gap-2.5 p-3"><Plus size={16} className="mt-0.5 shrink-0 text-[var(--kz-violet)]" />Passez à un forfait supérieur pour plus d&apos;offres simultanées.</li>
            </ul>
          )}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button kind="soft" size="lg" full onClick={() => setQuotaModal(false)}>Gérer mes offres</Button>
            <Link href="/recruiter/company" className="flex-1">
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
        <div className="osr-glow flex items-center gap-3 p-3.5 rounded-2xl" style={{ ...accentStyle(ACCENT.orange), background: tint(ACCENT.orange, 10) }}>
          <span className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(145deg, var(--kz-orange), var(--osr-pink))' }}>
            <Rocket size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-white truncate">{job?.title}</p>
            <p className="text-[12px] text-[var(--kz-mute)]">Mise en avant en tête des résultats + badge « À la une ».</p>
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
                className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--kz-blue)_40%,transparent)]"
                style={{
                  background: selected ? tint(ACCENT.orange, 14) : 'var(--osr-fill)',
                  boxShadow: selected ? `inset 0 0 0 1px ${tint(ACCENT.orange, 65)}, 0 12px 30px -18px ${ACCENT.orange}` : 'inset 0 0 0 1px var(--osr-hair)',
                }}>
                <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{ background: selected ? ACCENT.orange : 'transparent', boxShadow: selected ? 'none' : 'inset 0 0 0 1.5px var(--osr-fill-3)' }}>
                  {selected && <Check size={13} strokeWidth={3} className="text-white" />}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-semibold text-white">{opt.label}</span>
                  {opt.tag && <span className="ml-2 osr-chip !h-5" style={{ color: ACCENT.yellow, background: tint(ACCENT.yellow, 14) }}>{opt.tag}</span>}
                </div>
                <span className="text-[19px] font-semibold tracking-[-0.03em] text-white tabular-nums">{Math.floor(opt.priceCts / 100)} €</span>
              </button>
            )
          })}
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        <Button kind="primary" size="lg" full loading={loading} icon={<Rocket size={15} />} onClick={handleBoost}>
          Payer et activer le boost
        </Button>
        <p className="text-[11px] text-center text-[var(--kz-mute)]">Paiement unique sécurisé par Stripe. Sans abonnement.</p>
      </div>
    </Modal>
  )
}
