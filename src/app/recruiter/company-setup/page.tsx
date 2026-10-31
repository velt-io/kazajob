'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, Check, ArrowRight, Upload, ChevronRight, Send, BadgeCheck, Ticket, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/useAuth'
import { uploadFile } from '@/features/profile/useUpload'
import { SUBSCRIPTION_PLANS, PAID_PLANS, JOB_SECTORS, MULTIDIFFUSION_ENABLED } from '@/lib/constants'
import { ACCENT, Monogram, StatusPill, WindowBar, accentStyle, tint } from '@/components/os/recruiter/primitives'
import { choiceStyle, stagger } from '@/components/os/recruiter/secondary-ui'
import type { Company } from '@/lib/types'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

type Mode = 'search' | 'join' | 'create' | 'plan' | 'done'

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']

const STEPS = [
  { n: 1, label: 'Votre entreprise' },
  { n: 2, label: 'Configuration' },
  { n: 3, label: 'Forfait' },
  { n: 4, label: 'Activation' },
]

function ProgressBar({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 mb-7" aria-label="Étapes de configuration">
      {STEPS.map((s, i) => {
        const done = step > s.n
        const current = step === s.n
        return (
          <li key={s.n} className="flex items-center gap-2 flex-1 last:flex-none" aria-current={current ? 'step' : undefined}>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all duration-500"
                style={{
                  background: done ? 'var(--kz-blue)' : current ? 'white' : 'var(--osr-fill-2)',
                  color: done ? 'white' : current ? 'black' : 'var(--kz-mute)',
                  boxShadow: current ? '0 0 0 4px color-mix(in srgb, white 14%, transparent)' : 'none',
                }}
              >
                {done ? <Check size={14} strokeWidth={2.8} /> : s.n}
              </div>
              <span className={`text-[12px] font-medium hidden sm:block ${current ? 'text-white' : 'text-[var(--kz-mute)]'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-white/[0.08]">
                <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: done ? '100%' : '0%', background: 'var(--kz-blue)' }} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

const SELECT_CLS = 'h-11 w-full px-3.5 rounded-xl border border-white/10 bg-white/[0.06] text-sm text-[var(--kz-text)] outline-none appearance-none cursor-pointer transition-all focus:border-[#0A84FF] focus:ring-4 focus:ring-[#0A84FF]/25 [&>option]:bg-[#1C1C22]'

function Radio({ on }: { on: boolean }) {
  return (
    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
      style={{ background: on ? 'var(--kz-blue)' : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 1.5px color-mix(in srgb, white 28%, transparent)' }}>
      {on && <Check size={13} strokeWidth={3} color="white" />}
    </span>
  )
}

export default function CompanySetupPage() {
  const { profile, refetch, loading: authLoading } = useAuth()
  const router = useRouter()
  const initialGuardRef = useRef(false)

  const [mode, setMode] = useState<Mode>('search')
  const [step, setStep] = useState(1)

  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState<Company[]>([])
  const [searching, setSearching]       = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const [joinMessage, setJoinMessage]   = useState('')
  const [joining, setJoining]           = useState(false)
  const [joinSent, setJoinSent]         = useState(false)

  const [logoFile, setLogoFile]         = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', legal_name: '', siret: '', sector: '',
    size: '1-10', website: '', description: '', location: '',
    address: '', phone: '',
  })
  const [creating, setCreating]         = useState(false)
  const [newCompany, setNewCompany]     = useState<Company | null>(null)

  const [planId, setPlanId]             = useState('pro')
  const [planSaving, setPlanSaving]     = useState(false)
  const [planError, setPlanError]       = useState('')
  const [promoCode, setPromoCode]       = useState('')
  const [promoMsg, setPromoMsg]         = useState<{ ok: boolean; text: string } | null>(null)

  const [launchElig, setLaunchElig]     = useState<{ status: string; expiresAt: string | null; campaignName?: string; newSubscriptionsEnabled?: boolean } | null>(null)
  const [campaignSelected, setCampaignSelected] = useState(false)
  const [launchConfirmed, setLaunchConfirmed] = useState(false)
  const [launchBusy, setLaunchBusy]     = useState(false)
  const launchAvailable = launchElig?.status === 'eligible'
  const launchSelected  = campaignSelected

  const checkPromo = async () => {
    if (!promoCode.trim()) { setPromoMsg(null); return }
    const r = await fetch(`/api/billing/validate-promo?code=${encodeURIComponent(promoCode)}`)
    const d = await r.json().catch(() => ({}))
    setPromoMsg(d.valid ? { ok: true, text: `Code valide : ${d.label}` } : { ok: false, text: d.reason ?? 'Code invalide' })
  }

  useEffect(() => {
    if (initialGuardRef.current || authLoading) return
    initialGuardRef.current = true
    if (profile?.company_id) router.replace('/recruiter/dashboard')
  }, [authLoading, profile, router])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('plan')
    if (p && SUBSCRIPTION_PLANS.some((pl) => pl.id === p)) setPlanId(p)
  }, [])

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q)}`)
      setResults(res.ok ? ((await res.json()) as Company[]) : [])
    } catch { setResults([]) }
    setSearching(false)
  }, [])

  const handleJoin = async () => {
    if (!selectedCompany || !profile?.id) return
    setJoining(true)
    const res = await fetch(`/api/companies/${selectedCompany.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: joinMessage }),
    })
    const { id } = await res.json().catch(() => ({}))

    // Notifier l'owner par email (fire & forget)
    if (id) {
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'join_request', requestId: id }),
      }).catch(() => {})
    }

    setJoinSent(true)
    setJoining(false)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleCreate = async () => {
    if (!profile?.id || !form.name.trim()) return
    setCreating(true)
    let logoUrl: string | null = null

    if (logoFile) {
      const { url } = await uploadFile(logoFile, 'company-logos')
      logoUrl = url
    }

    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, logoUrl }),
    })
    if (!res.ok) { setCreating(false); return }
    const company = (await res.json()) as Company
    await refetch?.()

    setNewCompany(company)
    setCreating(false)
    setStep(3)
    setMode('plan')
  }

  const handleSelectPlan = async () => {
    const company = newCompany
    if (!company) { setStep(4); setMode('done'); return }
    setPlanSaving(true)
    setPlanError('')

    await fetch(`/api/companies/${company.id}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })

    try {
      const co = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, promoCode: promoCode.trim() || undefined }),
      })
      const data = await co.json().catch(() => ({}))
      if (co.ok && data.url) { window.location.href = data.url as string; return }
      setPlanError(
        co.status === 503
          ? 'Le paiement est momentanément indisponible. Réessaie dans un instant.'
          : (data.error as string) || 'Impossible d\'ouvrir le paiement. Réessaie dans un instant.',
      )
    } catch {
      setPlanError('Connexion au paiement impossible. Vérifie ta connexion et réessaie.')
    }

    setPlanSaving(false)
  }

  useEffect(() => {
    if (mode !== 'plan') return
    fetch('/api/launch/eligibility')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setLaunchElig(d)
        if (d.status === 'eligible') setCampaignSelected(true)
      })
      .catch(() => {})
  }, [mode])

  const handleActivateLaunch = async () => {
    if (!launchConfirmed) return
    setLaunchBusy(true)
    setPlanError('')
    try {
      const res = await fetch('/api/launch/activate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed: true }),
      })
      if (res.ok) { setStep(4); setMode('done'); return }
      const d = await res.json().catch(() => ({}))
      setPlanError(d.status === 'already_used'
        ? 'Cette entreprise a déjà bénéficié de KazaLaunch.'
        : 'Activation impossible. Choisissez un forfait payant pour continuer.')
    } catch {
      setPlanError('Connexion impossible. Réessaie dans un instant.')
    }
    setLaunchBusy(false)
  }

  const currentStep = mode === 'search' ? 1 : mode === 'join' || mode === 'create' ? 2 : mode === 'plan' ? 3 : 4

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center py-4 sm:py-8">
      <div className="w-full max-w-[660px]">
        {/* Header */}
        <div className="text-center mb-7">
          <p className="osr-eyebrow mb-2">Configuration</p>
          <h1 className="osr-title">
            Votre espace <span className="os-text-aurora">entreprise</span>
          </h1>
        </div>

        <ProgressBar step={currentStep} />

        <div className="os-glass rounded-[28px] overflow-hidden shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)]">
          <WindowBar title={STEPS[currentStep - 1]?.label} />
          <div key={mode} className="p-5 sm:p-7 animate-slide-up">
          {/* ── ÉTAPE 1 : Recherche ──────────────────────────────────── */}
          {mode === 'search' && (
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-white mb-1">Votre entreprise existe-t-elle déjà ?</h2>
              <p className="text-[14px] text-[var(--kz-mute)] mb-5">Recherchez pour rejoindre une équipe existante ou créez votre espace.</p>

              <Input
                label=""
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Nom de l'entreprise..."
                aria-label="Nom de l'entreprise"
                icon={<Search size={15} />}
                suffix={searching ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-label="Recherche..." /> : undefined}
              />

              {results.length > 0 && (
                <div className="mt-3 osr-surface p-1.5 flex flex-col">
                  {results.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompany(c); setMode('join'); setStep(2) }}
                      className="osr-row osr-in group flex items-center gap-3 p-2.5 text-left"
                      style={stagger(i)}
                    >
                      <Monogram name={c.name} src={c.logo_url} size={40} radius={12} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-white flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{c.name}</span>
                          {c.is_verified && <BadgeCheck size={14} className="text-[var(--kz-blue)] shrink-0" />}
                        </div>
                        <div className="text-[12px] text-[var(--kz-mute)] truncate">{c.location} · {c.sector}</div>
                      </div>
                      <ChevronRight size={16} className="text-[var(--kz-mute)] shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-white/[0.06] flex flex-col gap-2">
                <Button
                  kind="primary" size="lg" full icon={<Building2 size={15} />}
                  onClick={() => { setMode('create'); setStep(2) }}
                >
                  Créer mon entreprise
                </Button>
                {query.length >= 2 && results.length === 0 && !searching && (
                  <p className="text-xs text-center text-[var(--kz-mute)]">
                    Aucun résultat pour &quot;{query}&quot; — créez votre entreprise ci-dessus.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2a : Rejoindre ─────────────────────────────────── */}
          {mode === 'join' && selectedCompany && (
            <div>
              {joinSent ? (
                <div className="text-center py-6">
                  <span className="os-pop w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-5 text-white"
                    style={{ background: 'linear-gradient(145deg, var(--kz-blue), var(--osr-indigo))', boxShadow: '0 18px 40px -16px var(--kz-blue)' }}>
                    <Send size={26} />
                  </span>
                  <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-white mb-2">Demande envoyée</h2>
                  <p className="text-[14px] text-[var(--kz-mute)] mb-6 leading-relaxed">
                    L&apos;administrateur de <strong>{selectedCompany.name}</strong> recevra votre demande.
                    Vous serez notifié par email lors de l&apos;approbation.
                  </p>
                  <Button kind="outline" size="md" onClick={() => router.push('/recruiter/dashboard')}>
                    Retour au tableau de bord
                  </Button>
                </div>
              ) : (
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-white mb-1">Rejoindre l&apos;équipe</h2>
                  <p className="text-[14px] text-[var(--kz-mute)] mb-5">
                    Vous demandez à rejoindre <strong className="text-white">{selectedCompany.name}</strong>.
                  </p>
                  <div className="flex items-center gap-3 p-3 osr-surface mb-5">
                    <Monogram name={selectedCompany.name} size={48} radius={14} />
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-white truncate">{selectedCompany.name}</div>
                      <div className="text-[12px] text-[var(--kz-mute)] truncate">{selectedCompany.location}</div>
                    </div>
                  </div>
                  <Textarea
                    label="Message à l'administrateur (optionnel)"
                    value={joinMessage}
                    onChange={e => setJoinMessage(e.target.value)}
                    placeholder="Je souhaite rejoindre votre espace recruteur sur Kazajob..."
                    rows={3}
                  />
                  <div className="flex gap-2.5 mt-4">
                    <Button kind="soft" size="lg" full onClick={() => { setMode('search'); setStep(1) }}>Retour</Button>
                    <Button kind="primary" size="lg" full loading={joining} onClick={handleJoin}
                      icon={<ArrowRight size={15} />}>
                      Envoyer la demande
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 2b : Créer ─────────────────────────────────────── */}
          {mode === 'create' && (
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-white mb-1">Créer votre entreprise</h2>
              <p className="text-[14px] text-[var(--kz-mute)] mb-5">Ces informations seront visibles par les candidats.</p>

              {/* Logo */}
              <label className="group flex items-center gap-4 mb-5 p-3 osr-surface cursor-pointer hover:bg-white/[0.06] transition-colors focus-within:ring-4 focus-within:ring-[#0A84FF]/40">
                <div className="w-16 h-16 rounded-[18px] border border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/[0.04] shrink-0 transition-transform group-hover:scale-[1.04]">
                  {logoPreview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                    : <Upload size={20} className="text-[var(--kz-mute)]" />}
                </div>
                <div className="min-w-0">
                  <span className="text-[14px] font-semibold text-[var(--kz-blue)]">{logoPreview ? 'Changer le logo' : 'Ajouter un logo'}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleLogoChange} />
                  <p className="text-[12px] text-[var(--kz-mute)]">PNG, JPG ou SVG · max 2 Mo</p>
                </div>
              </label>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Nom commercial *" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ma Société SAS" />
                  <Input label="Raison sociale" value={form.legal_name}
                    onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))}
                    placeholder="MA SOCIETE SAS" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="SIRET" value={form.siret}
                    onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
                    placeholder="12345678901234" maxLength={14} />
                  <Input label="Téléphone" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+262 262 ..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cs-sector" className="block text-xs font-medium text-[var(--kz-mute)] mb-1.5">Secteur</label>
                    <select id="cs-sector" className={SELECT_CLS}
                      value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                      <option value="">Choisir...</option>
                      {JOB_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="cs-size" className="block text-xs font-medium text-[var(--kz-mute)] mb-1.5">Taille</label>
                    <select id="cs-size" className={SELECT_CLS}
                      value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employés</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Ville" value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Saint-Denis" />
                  <Input label="Site web" value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://masociete.re" />
                </div>
                <Textarea label="Description de l'entreprise" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Présentez votre entreprise aux candidats..." rows={3} />
              </div>

              <div className="flex gap-2.5 mt-5">
                <Button kind="soft" size="lg" full onClick={() => { setMode('search'); setStep(1) }}>Retour</Button>
                <Button kind="primary" size="lg" full loading={creating}
                  disabled={!form.name.trim()} onClick={handleCreate}
                  icon={<ArrowRight size={15} />}>
                  Créer et continuer
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Plan ───────────────────────────────────────── */}
          {mode === 'plan' && (
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-white mb-1">Choisissez votre forfait</h2>
              <p className="text-[14px] text-[var(--kz-mute)] mb-5 leading-relaxed">
                {launchAvailable
                  ? `Démarrez gratuitement avec ${launchElig?.campaignName ?? "notre offre de lancement"}, ou choisissez un forfait payant pour démarrer immédiatement.`
                  : "30 jours d’essai · Carte bancaire requise · 1er débit à la fin de l’essai · Annulable avant la fin."}
              </p>

              {/* Accès gratuit temporaire (campagne de lancement) — jamais un forfait Stripe */}
              {launchAvailable && (
                <button
                  onClick={() => setCampaignSelected(true)}
                  aria-pressed={launchSelected}
                  className="osr-glow w-full flex items-center gap-4 p-4 rounded-[18px] border text-left transition-all duration-300 mb-3 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40"
                  style={{ ...choiceStyle(launchSelected, ACCENT.violet), ...accentStyle(ACCENT.violet) }}
                >
                  <Radio on={launchSelected} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-semibold text-white">{launchElig?.campaignName ?? 'Offre de lancement'}</span>
                      <StatusPill accent={ACCENT.yellow}>Gratuit</StatusPill>
                    </div>
                    <div className="text-[12px] text-[var(--kz-mute)]">Accès gratuit temporaire · sans carte bancaire</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[22px] font-semibold tracking-[-0.03em] text-white tabular-nums">0€</div>
                    {launchElig?.expiresAt && <div className="text-[10px] text-[var(--kz-mute)]">jusqu&apos;au {fmtDate(launchElig.expiresAt)}</div>}
                  </div>
                </button>
              )}

              {/* Offres payantes — masquées pendant la période KazaLaunch */}
              {launchAvailable && launchElig?.newSubscriptionsEnabled === false ? (
                <div className="mb-5">
                  {/* 4 cards squelettes */}
                  <div className="flex flex-col gap-2 mb-4" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="osr-skel w-full h-[68px] rounded-[18px]" style={{ opacity: 1 - i * 0.18 }} />
                    ))}
                  </div>
                  {/* Message informatif */}
                  <div className="osr-surface p-4 text-[13px] text-[var(--kz-mute)] leading-relaxed">
                    <p className="text-[14px] font-semibold text-white mb-1">Les offres payantes arrivent le 6 octobre 2026</p>
                    <p className="mb-2">
                      À partir de cette date, vous pourrez choisir un forfait payant adapté à vos besoins.
                      Pas de prélèvement automatique. Pas d&apos;enregistrement de carte bancaire pour le moment.
                    </p>
                    <p className="text-[12px]">
                      Vos paiements financeront de meilleures fonctionnalités IA, des intégrations supplémentaires
                      et des améliorations continues tout au long de l&apos;année.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mb-5" role="radiogroup" aria-label="Forfaits">
                  {PAID_PLANS.map((plan, i) => {
                    const euros = Math.floor(plan.priceCts / 100)
                    const isSelected = !campaignSelected && planId === plan.id
                    return (
                      <button
                        key={plan.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => { setCampaignSelected(false); setPlanId(plan.id) }}
                        className="osr-in w-full flex items-center gap-4 p-4 rounded-[18px] border text-left transition-all duration-300 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40"
                        style={{ ...choiceStyle(isSelected), ...stagger(i) }}
                      >
                        <Radio on={isSelected} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-semibold text-white">{plan.name}</span>
                            {plan.highlight && <StatusPill accent={ACCENT.orange}>Populaire</StatusPill>}
                          </div>
                          <div className="text-[12px] text-[var(--kz-mute)]">
                            {plan.maxMembers} recruteur{plan.maxMembers > 1 ? 's' : ''} ·
                            {plan.maxJobs === -1 ? ' offres illimitées' : ` ${plan.maxJobs} offres`}
                            {MULTIDIFFUSION_ENABLED && ` · ${plan.partners.length > 0 ? `${plan.partners.length} plateforme(s)` : 'Kazajob uniquement'}`}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[22px] font-semibold tracking-[-0.03em] text-white tabular-nums">{euros}€</div>
                          <div className="text-[10px] text-[var(--kz-mute)]">/mois</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {planError && (
                <div role="alert" className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{planError}</div>
              )}

              {launchSelected ? (
                /* ── Écran d'information obligatoire avant activation KazaLaunch ── */
                <div>
                  <div className="rounded-[18px] p-4 mb-4" style={{ background: tint(ACCENT.violet, 12), boxShadow: `inset 0 0 0 1px ${tint(ACCENT.violet, 30)}` }}>
                    <h3 className="text-[15px] font-semibold text-white mb-2.5">Votre accès gratuit avec {launchElig?.campaignName ?? 'l’offre de lancement'}</h3>
                    <ul className="text-[13px] text-[var(--kz-text)] space-y-1.5 mb-3">
                      {['0 € pendant toute la durée de l’accès', 'Aucune carte bancaire demandée', 'Aucun prélèvement automatique', 'Offre utilisable une seule fois par entreprise'].map((t) => (
                        <li key={t} className="flex items-center gap-2"><Check size={13} className="text-[var(--kz-green)] shrink-0" strokeWidth={2.8} />{t}</li>
                      ))}
                      {launchElig?.expiresAt && <li className="flex items-center gap-2"><Check size={13} className="text-[var(--kz-green)] shrink-0" strokeWidth={2.8} />Fin estimée le <b className="text-white">{fmtDate(launchElig.expiresAt)}</b></li>}
                    </ul>
                    <p className="text-[12px] text-[var(--kz-mute)] leading-relaxed">
                      À partir de cette date, la publication et la réactivation d&apos;offres seront bloquées
                      jusqu&apos;au choix d&apos;un forfait payant. Vos candidatures et vos données resteront
                      accessibles. Aucun abonnement payant ne sera créé automatiquement.
                    </p>
                  </div>
                  <label className="flex items-start gap-2.5 mb-4 cursor-pointer text-[13px] leading-relaxed text-[var(--kz-text)]">
                    <input type="checkbox" checked={launchConfirmed} onChange={(e) => setLaunchConfirmed(e.target.checked)}
                      className="mt-0.5 w-[18px] h-[18px] shrink-0 accent-[var(--kz-blue)] cursor-pointer" />
                    <span>J&apos;ai compris que cet accès gratuit est temporaire, qu&apos;il ne peut être activé
                      qu&apos;une seule fois par entreprise et qu&apos;aucun paiement ne sera déclenché
                      automatiquement à son expiration.</span>
                  </label>
                  <Button kind="primary" size="lg" full loading={launchBusy} disabled={!launchConfirmed}
                    onClick={handleActivateLaunch} icon={<ArrowRight size={15} />}>
                    Activer mon accès gratuit
                  </Button>
                </div>
              ) : (
                /* ── Forfait payant : code promo + checkout Stripe ── */
                <div>
                  <div className="mb-4">
                    <label htmlFor="cs-promo" className="block text-xs font-medium text-[var(--kz-mute)] mb-1.5">Code promo (optionnel)</label>
                    <div className="flex gap-2">
                      <div className="flex-1 min-w-0">
                        <Input id="cs-promo" value={promoCode} placeholder="Ex : RENTREE25" icon={<Ticket size={15} />}
                          onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoMsg(null) }} />
                      </div>
                      <Button kind="soft" size="md" type="button" className="!h-11" onClick={checkPromo}>Vérifier</Button>
                    </div>
                    {promoMsg && (
                      <p role="status" className="os-pop text-[12px] font-semibold mt-1.5 flex items-center gap-1" style={{ color: promoMsg.ok ? ACCENT.green : ACCENT.red }}>
                        {promoMsg.ok && <Check size={12} strokeWidth={2.8} />}{promoMsg.text}
                      </p>
                    )}
                  </div>
                  <Button kind="primary" size="lg" full loading={planSaving} onClick={handleSelectPlan}
                    icon={<ArrowRight size={15} />}>
                    Continuer vers le paiement sécurisé
                  </Button>
                  <p className="text-[12px] text-center text-[var(--kz-mute)] mt-3 flex items-center justify-center gap-1.5">
                    <Lock size={11} />Paiement sécurisé par Stripe. Aucun débit pendant les 30 jours d&apos;essai.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 4 : Succès ─────────────────────────────────────── */}
          {mode === 'done' && (
            <div className="text-center py-6">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <span aria-hidden className="absolute inset-0 rounded-full blur-2xl opacity-60" style={{ background: 'var(--os-aurora)' }} />
                <span className="os-pop relative w-24 h-24 rounded-full flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(145deg, var(--kz-green), var(--osr-teal))' }}>
                  <Check size={44} strokeWidth={2.6} />
                </span>
              </div>
              <h2 className="text-[28px] font-semibold tracking-[-0.035em] text-white mb-2">Votre espace est prêt</h2>
              <p className="text-[14px] text-[var(--kz-mute)] mb-6 leading-relaxed max-w-md mx-auto">
                Votre entreprise est configurée. Vous pouvez maintenant publier des offres,
                inviter vos collègues recruteurs et accéder à vos analytics.
              </p>
              <div className="flex flex-col gap-2">
                <Button kind="primary" size="lg" full icon={<ArrowRight size={15} />}
                  onClick={() => router.push('/recruiter/jobs/new')}>
                  Publier ma 1ère offre
                </Button>
                <Button kind="outline" size="md" full onClick={() => router.push('/recruiter/company/team')}>
                  Inviter mon équipe
                </Button>
                <Button kind="soft" size="md" full onClick={() => router.push('/recruiter/dashboard')}>
                  Tableau de bord
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
