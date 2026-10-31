'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, ArrowRight, Edit3, Globe, Star, Landmark, Target, Briefcase, Search, Rss, CreditCard, Check, RefreshCw, XCircle, AlertTriangle, CheckCircle2, Info, ShieldAlert, BadgeCheck, MapPin, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/useAuth'
import { SUBSCRIPTION_PLANS, PARTNERS, MULTIDIFFUSION_ENABLED } from '@/lib/constants'
import type { CompanyBillingSummary } from '@/lib/queries/billing-summary'
import { ACCENT, CountUp, EmptyPanel, Monogram, PageHeader, SkeletonList, StatusPill, Widget, accentStyle, tint } from '@/components/os/recruiter/primitives'
import { choiceStyle, stagger } from '@/components/os/recruiter/secondary-ui'

const PARTNER_ICONS: Record<string, React.ReactNode> = {
  Landmark:  <Landmark  size={12} />,
  Target:    <Target    size={12} />,
  Briefcase: <Briefcase size={12} />,
  Search:    <Search    size={12} />,
  Rss:       <Rss       size={12} />,
}
import type { Company, CompanySubscription } from '@/lib/types'

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  info:    <Info         size={18} />,
  warning: <AlertTriangle size={18} />,
  danger:  <ShieldAlert  size={18} />,
}
const SEVERITY_ACCENT: Record<string, string> = {
  success: ACCENT.green,
  info:    ACCENT.blue,
  warning: ACCENT.yellow,
  danger:  ACCENT.orange,
}

export default function CompanyPage() {
  const { profile } = useAuth()
  const [company, setCompany]       = useState<Company | null>(null)
  const [sub, setSub]               = useState<CompanySubscription | null>(null)
  const [billingSummary, setBillingSummary] = useState<CompanyBillingSummary | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [jobCount, setJobCount]     = useState(0)
  const [loading, setLoading]       = useState(true)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingBanner, setBillingBanner]   = useState<'success' | 'cancel' | null>(null)
  const [planModal, setPlanModal]   = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError]     = useState('')

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      try {
        const [res, bsRes] = await Promise.all([
          fetch(`/api/companies/${profile.company_id}`),
          fetch('/api/recruiter/billing-summary'),
        ])
        if (res.ok) {
          const d = await res.json()
          setCompany(d.company as Company)
          setSub(d.subscription as CompanySubscription | null)
          setMemberCount(d.member_count ?? 0)
          setJobCount(d.job_count ?? 0)
        }
        if (bsRes.ok) setBillingSummary(await bsRes.json() as CompanyBillingSummary)
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [profile?.company_id])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('billing')
    if (p === 'success' || p === 'cancel') setBillingBanner(p)
  }, [])

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub?.plan_id)

  if (!profile?.company_id) {
    return (
      <div className="max-w-[600px] mx-auto py-10">
        <div className="osr-panel">
          <EmptyPanel
            icon={<Building2 size={28} />}
            accent={ACCENT.indigo}
            title="Aucune entreprise configurée"
            description="Configurez votre espace entreprise pour commencer à recruter."
            action={
              <Link href="/recruiter/company-setup">
                <Button kind="primary" size="lg" icon={<ArrowRight size={15} />}>Configurer mon entreprise</Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  if (loading) return <div className="max-w-[860px] mx-auto"><SkeletonList rows={4} height={110} /></div>

  const isOwner = company?.owner_id === profile?.id

  const startCheckout = async () => {
    setBillingLoading(true)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: sub?.plan_id }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.url) window.location.href = data.url as string
    else { alert(data.error ?? 'Paiement indisponible.'); setBillingLoading(false) }
  }

  const openPortal = async () => {
    setBillingLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.url) window.location.href = data.url as string
    else { alert(data.error ?? 'Gestion indisponible.'); setBillingLoading(false) }
  }

  const changePlan = async (planId: string) => {
    setActionLoading(true); setActionError('')
    const res = await fetch('/api/billing/change-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { window.location.reload() }
    else { setActionError(data.error ?? 'Échec du changement de forfait.'); setActionLoading(false) }
  }

  const cancelSubscription = async () => {
    setActionLoading(true); setActionError('')
    const res = await fetch('/api/billing/cancel', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { window.location.reload() }
    else { setActionError(data.error ?? 'Échec de la résiliation.'); setActionLoading(false) }
  }

  const isTrialing = sub?.status === 'trial'
  const trialDaysLeft = sub?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : 0

  const stats = [
    { v: memberCount, l: 'Recruteurs', accent: ACCENT.violet, icon: <Users size={14} /> },
    { v: jobCount,    l: 'Offres actives', accent: ACCENT.orange, icon: <Briefcase size={14} /> },
    MULTIDIFFUSION_ENABLED
      ? { v: plan?.partners.length ?? 0, l: 'Partenaires', accent: ACCENT.blue, icon: <Layers size={14} /> }
      : { v: billingSummary?.maxJobs === -1 ? '∞' : (billingSummary?.maxJobs ?? 0), l: 'Offres max', accent: ACCENT.blue, icon: <Layers size={14} /> },
  ]

  return (
    <div className="max-w-[860px] mx-auto">
      <PageHeader
        eyebrow="Mon entreprise"
        title={company?.name}
        actions={
          <Link href="/recruiter/company/team">
            <Button kind="outline" size="md" icon={<Users size={14} />}>Gérer l&apos;équipe</Button>
          </Link>
        }
      />

      {/* Retour Stripe */}
      {billingBanner === 'success' && (
        <div role="status" className="os-pop osr-panel p-4 mb-5 flex items-center gap-3" style={{ background: tint(ACCENT.green, 12) }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: ACCENT.green }}><Check size={16} strokeWidth={2.6} /></span>
          <p className="text-[14px] font-medium text-white">
            Moyen de paiement enregistré. Votre abonnement s&apos;activera automatiquement à la fin de l&apos;essai.
          </p>
        </div>
      )}
      {billingBanner === 'cancel' && (
        <div role="status" className="os-pop osr-panel p-4 mb-5 text-[14px] text-[var(--kz-mute)]">
          Paiement annulé — votre essai continue normalement.
        </div>
      )}

      {/* Fiche entreprise (carte de visite) */}
      <div className="os-glass osr-glow rounded-[26px] p-5 sm:p-6 mb-5" style={accentStyle(ACCENT.indigo)}>
        <div className="flex items-start gap-4">
          <Monogram name={company?.name ?? 'Entreprise'} src={company?.logo_url} size={68} radius={20} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white truncate">{company?.name}</h2>
              {company?.is_verified && (
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--kz-blue)]"><BadgeCheck size={15} />Vérifié</span>
              )}
            </div>
            {company?.legal_name && <p className="text-[13px] text-[var(--kz-mute)] truncate">{company.legal_name}</p>}
            {company?.siret && <p className="text-[12px] text-[var(--kz-mute)] tabular-nums">SIRET : {company.siret}</p>}
          </div>
          <Button kind="soft" size="sm" icon={<Edit3 size={13} />} className="shrink-0">Modifier</Button>
        </div>

        {(company?.sector || company?.size || company?.location || company?.website) && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px mt-5 rounded-[16px] overflow-hidden bg-white/[0.06]">
            {company?.sector && (
              <div className="bg-[var(--kz-cream)]/60 px-4 py-3"><dt className="text-[11px] text-[var(--kz-mute)]">Secteur</dt><dd className="text-[14px] font-medium text-white">{company.sector}</dd></div>
            )}
            {company?.size && (
              <div className="bg-[var(--kz-cream)]/60 px-4 py-3"><dt className="text-[11px] text-[var(--kz-mute)]">Taille</dt><dd className="text-[14px] font-medium text-white">{company.size} employés</dd></div>
            )}
            {company?.location && (
              <div className="bg-[var(--kz-cream)]/60 px-4 py-3"><dt className="text-[11px] text-[var(--kz-mute)]">Localisation</dt><dd className="text-[14px] font-medium text-white flex items-center gap-1"><MapPin size={12} className="text-[var(--kz-mute)]" />{company.location}</dd></div>
            )}
            {company?.website && (
              <div className="bg-[var(--kz-cream)]/60 px-4 py-3 min-w-0">
                <dt className="text-[11px] text-[var(--kz-mute)]">Site web</dt>
                <dd>
                  <a href={company.website} target="_blank" rel="noreferrer"
                    className="text-[14px] font-medium flex items-center gap-1 text-[var(--kz-blue)] hover:underline min-w-0">
                    <Globe size={12} className="shrink-0" /><span className="truncate">{company.website.replace('https://', '')}</span>
                  </a>
                </dd>
              </div>
            )}
          </dl>
        )}

        {company?.description && (
          <p className="text-[14px] text-[var(--kz-text)] leading-relaxed mt-4">
            {company.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {stats.map((s, i) => (
          <div key={s.l} className="osr-panel osr-glow osr-in p-3 sm:p-4" style={{ ...accentStyle(s.accent), ...stagger(i) }}>
            <span className="w-7 h-7 rounded-[9px] flex items-center justify-center text-white mb-3" style={{ background: s.accent }}>{s.icon}</span>
            <div className="text-[26px] sm:text-[30px] font-semibold tracking-[-0.05em] text-white leading-none tabular-nums">
              {typeof s.v === 'number' ? <CountUp value={s.v} /> : s.v}
            </div>
            <div className="text-[11px] sm:text-[12px] text-[var(--kz-mute)] mt-1 truncate">{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Mon abonnement (résumé facturation enrichi) ── */}
      {billingSummary && (() => {
        const accent = SEVERITY_ACCENT[billingSummary.message.severity] ?? ACCENT.blue
        const icon = SEVERITY_ICON[billingSummary.message.severity]
        const maxLabel = billingSummary.maxJobs === -1 ? '∞' : String(billingSummary.maxJobs)
        const pct = billingSummary.maxJobs === -1 ? 0 : Math.min(100, Math.round((billingSummary.activeJobs / billingSummary.maxJobs) * 100))
        return (
          <Widget title="Mon abonnement" icon={<CreditCard size={14} />} accent={accent} className="mb-5">
            {/* Carte statut */}
            <div className="rounded-[16px] p-4 flex items-start gap-3 mb-5 mt-1" style={{ background: tint(accent, 12), boxShadow: `inset 0 0 0 1px ${tint(accent, 35)}` }}>
              <span className="shrink-0 mt-0.5" style={{ color: accent }}>{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-white">{billingSummary.message.title}</p>
                <p className="text-[13px] text-[var(--kz-mute)] mt-0.5 leading-relaxed">{billingSummary.message.description}</p>
                {(billingSummary.message.primaryActionLabel || billingSummary.message.secondaryActionLabel) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {billingSummary.message.primaryActionLabel && (
                      <Link href={billingSummary.message.primaryActionHref ?? '#'}>
                        <Button kind="primary" size="sm">{billingSummary.message.primaryActionLabel}</Button>
                      </Link>
                    )}
                    {billingSummary.message.secondaryActionLabel && (
                      <Link href={billingSummary.message.secondaryActionHref ?? '#'}>
                        <Button kind="outline" size="sm">{billingSummary.message.secondaryActionLabel}</Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Barre d'usage */}
            <div className="mb-4">
              <div className="flex justify-between items-baseline text-[13px] text-[var(--kz-mute)] mb-2">
                <span>Annonces actives</span>
                <span className="text-[15px] font-semibold tabular-nums" style={{ color: billingSummary.isOverLimit ? ACCENT.orange : 'white' }}>
                  {billingSummary.activeJobs} <span className="text-[var(--kz-mute)] font-normal">/ {maxLabel}</span>
                </span>
              </div>
              {billingSummary.maxJobs !== -1 && (
                <div className="osr-bar">
                  <span style={{ width: `${pct}%`, background: billingSummary.isOverLimit ? ACCENT.orange : 'linear-gradient(90deg, var(--kz-green), var(--osr-teal))' }} />
                </div>
              )}
            </div>

            {/* Bloc garanties */}
            <p className="text-[12px] text-[var(--kz-mute)] leading-relaxed border-t border-white/[0.06] pt-3">
              Vos annonces déjà publiées restent visibles jusqu&apos;à leur expiration.
              Aucune annonce ne sera supprimée automatiquement.
            </p>
          </Widget>
        )
      })()}

      {/* Abonnement Stripe (section existante) */}
      {sub && plan && (
        <div className="osr-panel osr-glow p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-4" style={accentStyle(isTrialing ? ACCENT.yellow : ACCENT.green)}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: isTrialing ? ACCENT.yellow : ACCENT.green }}>
                <Star size={14} color="#000" fill="#000" />
              </span>
              <span className="text-[15px] font-semibold text-white">
                Forfait {plan.name}
                {isTrialing && ` — Essai gratuit (${trialDaysLeft}j restants)`}
              </span>
              <StatusPill accent={isTrialing ? ACCENT.yellow : ACCENT.green} live={!isTrialing}>
                {isTrialing ? 'Essai' : 'Actif'}
              </StatusPill>
            </div>
            <div className="text-[13px] text-[var(--kz-mute)] sm:pl-9">
              {memberCount}/{plan.maxMembers} recruteur{plan.maxMembers > 1 ? 's' : ''} ·{' '}
              {jobCount} offre{jobCount > 1 ? 's' : ''} active{jobCount > 1 ? 's' : ''} ·
              {plan.maxJobs === -1 ? ' illimitées' : ` ${plan.maxJobs} max`}
            </div>
          </div>
          {isOwner && (
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              <Button kind="outline" size="sm" icon={<RefreshCw size={14} />} onClick={() => { setActionError(''); setPlanModal(true) }}>
                Changer de forfait
              </Button>
              {sub?.stripe_subscription_id ? (
                <Button kind="soft" size="sm" loading={billingLoading} onClick={openPortal}>
                  Gérer le paiement
                </Button>
              ) : (
                <Button kind="primary" size="sm" loading={billingLoading} onClick={startCheckout} icon={<CreditCard size={14} />}>
                  Activer l&apos;abonnement
                </Button>
              )}
              {sub?.status !== 'cancelled' && (
                <button onClick={() => { setActionError(''); setCancelModal(true) }}
                  className="h-8 rounded-full text-[12px] font-medium text-[var(--kz-mute)] hover:text-[var(--osr-red)] hover:bg-white/[0.05] flex items-center gap-1 justify-center transition-colors">
                  <XCircle size={12} />Résilier
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Canaux de diffusion inclus au forfait (multidiffusion — masqué tant que OFF) */}
      {MULTIDIFFUSION_ENABLED && plan && plan.partners.length > 0 && (
        <Widget title="Canaux de diffusion inclus" accent={ACCENT.violet} action={<StatusPill accent={ACCENT.violet}>Bientôt</StatusPill>}>
          <div className="flex flex-wrap gap-2 mt-1">
            {plan.partners.map(p => {
              const partner = PARTNERS[p]
              return partner ? (
                <span key={p} className="osr-chip !h-7 !px-3">
                  {PARTNER_ICONS[partner.icon]}{partner.name}
                </span>
              ) : null
            })}
          </div>
          <p className="text-[12px] text-[var(--kz-mute)] mt-3 leading-relaxed">
            Ces canaux sont inclus dans votre forfait. La diffusion automatique vers ces plateformes
            sera activée prochainement (voir la roadmap).
          </p>
        </Widget>
      )}

      {/* Modal — Changer de forfait */}
      <Modal open={planModal} onClose={() => !actionLoading && setPlanModal(false)} title="Changer de forfait" size="md">
        <div className="flex flex-col gap-2.5">
          <p className="text-[14px] text-[var(--kz-mute)] mb-1">
            Choisissez votre nouveau forfait. Le changement est immédiat
            {sub?.stripe_subscription_id ? ' et ajusté au prorata sur votre prochaine facture.' : ' (votre essai se poursuit).'}
          </p>
          {SUBSCRIPTION_PLANS.map((p) => {
            const isCurrent = p.id === sub?.plan_id
            return (
              <div key={p.id}
                className="flex items-center gap-3 p-3.5 rounded-[16px] border transition-all"
                style={choiceStyle(isCurrent, ACCENT.violet)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-white">{p.name}</span>
                    {isCurrent && <StatusPill accent={ACCENT.violet}>Actuel</StatusPill>}
                  </div>
                  <div className="text-[12px] text-[var(--kz-mute)]">
                    {p.maxMembers} recruteur{p.maxMembers > 1 ? 's' : ''} · {p.maxJobs === -1 ? 'offres illimitées' : `${p.maxJobs} offres`}
                  </div>
                </div>
                <span className="text-[17px] font-semibold text-white tabular-nums">{Math.floor(p.priceCts / 100)}€</span>
                <Button kind={isCurrent ? 'soft' : 'primary'} size="sm" disabled={isCurrent || actionLoading}
                  loading={actionLoading} onClick={() => changePlan(p.id)}>
                  {isCurrent ? 'Actuel' : 'Choisir'}
                </Button>
              </div>
            )
          })}
          {actionError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">{actionError}</div>}
        </div>
      </Modal>

      {/* Modal — Résilier */}
      <Modal open={cancelModal} onClose={() => !actionLoading && setCancelModal(false)} title="Résilier l'abonnement" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-[var(--kz-text)] leading-relaxed">
            {sub?.stripe_subscription_id
              ? 'Votre abonnement sera résilié à la fin de la période en cours. Vous gardez l\'accès jusqu\'à cette date, sans nouveau prélèvement.'
              : 'Votre essai sera arrêté immédiatement et l\'accès recruteur sera suspendu. Vous pourrez réactiver un forfait à tout moment.'}
          </p>
          {actionError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">{actionError}</div>}
          <div className="flex gap-2.5">
            <Button kind="soft" size="lg" full disabled={actionLoading} onClick={() => setCancelModal(false)}>Garder mon forfait</Button>
            <Button kind="danger" size="lg" full loading={actionLoading} onClick={cancelSubscription}>Confirmer la résiliation</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
