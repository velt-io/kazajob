'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Eye, Users, Edit, Trash2, ToggleLeft, EyeOff, User, Rocket, ArrowRight, AlertTriangle, Info, Send, Pause, Archive, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import type { Job } from '@/lib/types'
import type { CompanyBillingSummary } from '@/lib/queries/billing-summary'
import { timeAgo, formatSalary } from '@/lib/utils'
import { KZ, JOB_BOOST_OPTIONS } from '@/lib/constants'
import {
  JOB_STATUS_META, JOB_EXPIRY_WARNING_DAYS, daysUntilExpiry, recruiterActions, resolveJobStatus,
  type JobAction, type JobStatus,
} from '@/lib/job-lifecycle'

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

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="kz-h2 text-[#1A1410] mb-1">Mes offres</h1>
          <p className="text-sm text-[#6B5A4A]">
            {counts.all} offre(s)
            {quota && quota.max !== -1 && ` · ${quota.used}/${quota.max} en ligne — forfait ${quota.planName}`}
            {quota && quota.max === -1 && ` · illimité (${quota.planName})`}
          </p>
        </div>
        {quota && !quota.ok ? (
          <Button kind="primary" size="md" icon={<Plus size={16} />} onClick={() => setQuotaModal(true)}>Nouvelle offre</Button>
        ) : (
          <Link href="/recruiter/jobs/new">
            <Button kind="primary" size="md" icon={<Plus size={16} />}>Nouvelle offre</Button>
          </Link>
        )}
      </div>

      {/* Bannière facturation contextuelle */}
      {billingSummary && (() => {
        const s = billingSummary
        if (s.source === 'campaign' && s.message.severity === 'success') {
          return (
            <div className="mb-4 rounded-xl border border-[#19A974] bg-[#D6F0E0] px-4 py-3 flex items-center gap-2 text-sm">
              <Info size={15} color={KZ.green} className="shrink-0" />
              <span className="text-[#1A1410]">
                Phase de déploiement active : vos annonces restent publiées et les offres seront disponibles prochainement.
              </span>
            </div>
          )
        }
        if (s.isOverLimit || !s.canPublishJob) {
          return (
            <div className="mb-4 rounded-xl border border-[#FFC93C] bg-[#FFF1C2] px-4 py-3 flex items-start gap-2 text-sm">
              <AlertTriangle size={15} color="#B45309" className="shrink-0 mt-0.5" />
              <div className="text-[#1A1410]">
                <span className="font-semibold">
                  {s.isOverLimit
                    ? 'Vous dépassez actuellement la limite de votre offre.'
                    : s.message.title}
                </span>
                {' '}Vos annonces existantes restent visibles, mais les nouvelles publications sont bloquées.{' '}
                {s.message.primaryActionHref && s.message.primaryActionLabel && (
                  <Link href={s.message.primaryActionHref} className="font-bold text-[#6D3BEB] hover:underline ml-1">
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
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span className="flex-1">{actionError}</span>
          <button onClick={() => setActionError('')} className="font-bold" aria-label="Fermer">×</button>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1" role="tablist">
          {FILTERS.filter((f) => f.id === 'all' || counts[f.id] > 0 || filter === f.id).map((f) => {
            const active = filter === f.id
            return (
              <button key={f.id} role="tab" aria-selected={active} onClick={() => setFilter(f.id)}
                className="px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-colors"
                style={{ borderColor: KZ.ink, background: active ? KZ.ink : 'white', color: active ? KZ.cream : KZ.ink }}>
                {f.label} <span className="opacity-60">{counts[f.id]}</span>
              </button>
            )
          })}
        </div>
      )}

      {loading ? <PageLoader /> : jobs.length === 0 ? (
        <EmptyState
          title="Aucune offre pour l'instant"
          description="Créez votre première offre d'emploi et trouvez les meilleurs talents de La Réunion."
          icon={<Plus size={28} />}
          action={<Link href="/recruiter/jobs/new"><Button kind="primary">Créer une offre</Button></Link>}
        />
      ) : visibleJobs.length === 0 ? (
        <p className="text-sm text-[#6B5A4A] text-center py-10">Aucune offre dans cette catégorie.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleJobs.map((job) => {
            const status = resolveJobStatus(job)
            const meta = JOB_STATUS_META[status]
            const daysLeft = status === 'published' ? daysUntilExpiry(job.expires_at) : null
            const actions = recruiterActions(status)
            return (
            <div key={job.id} className="kz-card p-4 bg-white flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-3"
              style={{ opacity: pending === job.id ? 0.6 : 1 }}>
              {/* Logo entreprise */}
              {(() => {
                const co = (job as unknown as { company?: { name: string; logo_url: string | null } }).company
                return co ? (
                  <div className="w-11 h-11 rounded-xl border border-[#1A1410] flex items-center justify-center text-xs font-extrabold shrink-0"
                    style={{ background: KZ.orangeSoft }}>
                    {co.logo_url
                      ? <img src={co.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                      : co.name.slice(0, 2).toUpperCase()}
                  </div>
                ) : null
              })()}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="text-sm font-bold text-[#1A1410]">{job.title}</h3>
                  <Badge color={meta.color} size="sm">{meta.label}</Badge>
                  {daysLeft !== null && daysLeft <= JOB_EXPIRY_WARNING_DAYS && (
                    <Badge color="yellow" size="sm"><span className="flex items-center gap-1"><Clock size={10} />Expire dans {daysLeft} j</span></Badge>
                  )}
                  {job.is_boosted && <Badge color="orange" size="sm">Boostée</Badge>}
                  {(job as unknown as { is_anonymous?: boolean }).is_anonymous && (
                    <Badge color="cream" size="sm"><span className="flex items-center gap-1"><EyeOff size={10} />Anonyme</span></Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6B5A4A] flex-wrap">
                  <span>{job.location} · {job.job_type} · {formatSalary(job.salary_min, job.salary_max)}</span>
                  <span>· {timeAgo(job.created_at)}</span>
                  {daysLeft !== null && job.expires_at && daysLeft > JOB_EXPIRY_WARNING_DAYS && (
                    <span>· en ligne jusqu&apos;au {new Date(job.expires_at).toLocaleDateString('fr-FR')}</span>
                  )}
                  {status === 'suspended' && <span className="font-semibold text-[#B45309]">· suspendue par la modération</span>}
                  {/* Auteur */}
                  {(() => {
                    const pub = (job as unknown as { publisher?: { full_name: string } }).publisher
                    return pub ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-[#E8DDC9]"
                        style={{ background: KZ.cream2 }}>
                        <User size={9} />{pub.full_name}
                      </span>
                    ) : null
                  })()}
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <div className="text-sm font-extrabold text-[#1A1410]">{job.views}</div>
                  <div className="text-[10px] text-[#6B5A4A] flex items-center gap-0.5"><Eye size={9} />vues</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-[#1A1410]">{job.applications_count}</div>
                  <div className="text-[10px] text-[#6B5A4A] flex items-center gap-0.5"><Users size={9} />cand.</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                {actions.includes('publish') && (
                  <Button kind="primary" size="sm" icon={<Send size={13} />} disabled={pending === job.id}
                    onClick={() => runAction(job, 'publish')}>
                    {PUBLISH_LABEL[status] ?? 'Publier'}
                  </Button>
                )}
                {actions.includes('pause') && (
                  <button onClick={() => runAction(job, 'pause')} disabled={pending === job.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FBEFE0] text-[#6B5A4A] hover:text-[#1A1410]"
                    title="Mettre en pause" aria-label="Mettre en pause">
                    <Pause size={15} />
                  </button>
                )}
                {status === 'published' && (
                  <button
                    onClick={() => setBoostFor(job)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FFE0CF]"
                    style={{ color: job.is_boosted ? KZ.orange : KZ.mute }}
                    title={job.is_boosted ? 'Prolonger la mise en avant' : 'Booster cette offre'}
                    aria-label="Booster cette offre"
                  >
                    <Rocket size={16} fill={job.is_boosted ? KZ.orange : 'none'} />
                  </button>
                )}
                {status !== 'suspended' && (
                  <Link href={`/recruiter/jobs/${job.id}/edit`} title="Modifier" aria-label="Modifier"
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FBEFE0] text-[#6B5A4A] hover:text-[#1A1410]">
                    <Edit size={15} />
                  </Link>
                )}
                {actions.includes('archive') && (
                  <button onClick={() => runAction(job, 'archive')} disabled={pending === job.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FBEFE0] text-[#6B5A4A] hover:text-[#1A1410]"
                    title="Archiver" aria-label="Archiver">
                    <Archive size={15} />
                  </button>
                )}
                <button
                  onClick={() => deleteJob(job.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B5A4A] hover:text-red-600"
                  title="Supprimer" aria-label="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
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
            <p className="text-sm text-[#2A2018] leading-relaxed">
              Votre essai ou abonnement a expiré. Activez un forfait pour publier de nouvelles offres.
            </p>
          ) : (
            <p className="text-sm text-[#2A2018] leading-relaxed">
              Vous utilisez <strong>{quota?.used}/{quota?.max}</strong> offre(s) active(s) du forfait <strong>{quota?.planName}</strong>.
              Pour en publier une nouvelle, deux options :
            </p>
          )}
          {quota?.reason !== 'expired' && (
            <ul className="flex flex-col gap-2 text-sm text-[#2A2018]">
              <li className="flex items-start gap-2"><ToggleLeft size={16} className="mt-0.5 shrink-0" />Mettez en pause ou archivez une offre que vous n&apos;utilisez plus (ci-dessous).</li>
              <li className="flex items-start gap-2"><Plus size={16} className="mt-0.5 shrink-0" />Passez à un forfait supérieur pour plus d&apos;offres simultanées.</li>
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
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.orangeSoft }}>
          <Rocket size={18} color={KZ.orange} />
          <div>
            <p className="text-sm font-bold text-[#1A1410]">{job?.title}</p>
            <p className="text-xs text-[#6B5A4A]">Mise en avant en tête des résultats + badge « À la une ».</p>
          </div>
        </div>

        {job?.is_boosted && boostedUntil && (
          <p className="text-xs text-[#6B5A4A]">
            Déjà boostée jusqu&apos;au <strong className="text-[#1A1410]">{new Date(boostedUntil).toLocaleDateString('fr-FR')}</strong> — un nouvel achat prolonge la durée.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {JOB_BOOST_OPTIONS.map((opt) => {
            const selected = days === opt.days
            return (
              <button key={opt.days} onClick={() => setDays(opt.days)}
                className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                style={{ borderColor: selected ? KZ.orange : KZ.line, background: selected ? KZ.orangeSoft : 'white' }}>
                <div className="w-7 h-7 rounded-full border-2 border-[#1A1410] flex items-center justify-center shrink-0"
                  style={{ background: selected ? KZ.orange : 'white' }}>
                  {selected && <Rocket size={12} color="white" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-[#1A1410]">{opt.label}</span>
                  {opt.tag && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]" style={{ background: KZ.yellowSoft }}>{opt.tag}</span>}
                </div>
                <span className="text-lg font-extrabold text-[#1A1410]">{Math.floor(opt.priceCts / 100)}€</span>
              </button>
            )
          })}
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        <Button kind="primary" size="lg" full loading={loading} icon={<Rocket size={15} />} onClick={handleBoost}>
          Payer et activer le boost
        </Button>
        <p className="text-[11px] text-center text-[#6B5A4A]">Paiement unique sécurisé par Stripe. Sans abonnement.</p>
      </div>
    </Modal>
  )
}
