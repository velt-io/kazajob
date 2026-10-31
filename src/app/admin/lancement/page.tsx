'use client'

import { useCallback, useEffect, useState } from 'react'
import { Rocket, Building2, Briefcase, BookOpen, AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ACCENT, CountUp, EmptyPanel, PageHeader, SkeletonList, StatusPill, Widget, tint } from '@/components/os/recruiter/primitives'
import { OSR_FIELD } from '@/components/os/recruiter/admin-ui'

interface CampaignRow {
  id: string; name: string; slug: string; state: string
  starts_at: string | null; ends_at: string | null; end_mode: string
  free_publishing_enabled: boolean; new_subscriptions_enabled: boolean
  jobs_allowed: boolean; trainings_allowed: boolean
  max_active_jobs_per_company: number; max_active_trainings_per_company: number
  grant_duration_days: number; require_admin_approval: boolean; auto_publish: boolean
  end_of_campaign_behavior: string; recruiter_message: string | null
  version: number; updated_at: string | null
  effective_status: string
}
interface Usage { companies: number; activeJobs: number; activeTrainings: number }
interface ApiData { campaigns: CampaignRow[]; usage: Usage }

const STATUS_LABEL: Record<string, { label: string; accent: string }> = {
  draft:     { label: 'Brouillon',  accent: ACCENT.mute },
  scheduled: { label: 'Planifiée',  accent: ACCENT.blue },
  active:    { label: 'Active',     accent: ACCENT.green },
  paused:    { label: 'En pause',   accent: ACCENT.yellow },
  ended:     { label: 'Terminée',   accent: ACCENT.indigo },
  cancelled: { label: 'Annulée',    accent: ACCENT.red },
}

const QUICK_ACTIONS: Record<string, { to: string; label: string; destructive: boolean }[]> = {
  draft:     [{ to: 'scheduled', label: 'Planifier', destructive: false }, { to: 'active', label: 'Activer', destructive: false }, { to: 'cancelled', label: 'Annuler', destructive: true }],
  scheduled: [{ to: 'active', label: 'Activer maintenant', destructive: false }, { to: 'draft', label: 'Repasser en brouillon', destructive: false }, { to: 'cancelled', label: 'Annuler', destructive: true }],
  active:    [{ to: 'paused', label: 'Mettre en pause', destructive: true }, { to: 'ended', label: 'Terminer', destructive: true }, { to: 'cancelled', label: 'Annuler', destructive: true }],
  paused:    [{ to: 'active', label: 'Reprendre', destructive: false }, { to: 'ended', label: 'Terminer', destructive: true }, { to: 'cancelled', label: 'Annuler', destructive: true }],
  ended: [], cancelled: [],
}

const TOGGLES: { key: keyof CampaignRow; label: string; help: string }[] = [
  { key: 'new_subscriptions_enabled', label: 'Abonnements payants', help: 'Si désactivé, bloque le paiement Stripe pendant la campagne' },
  { key: 'jobs_allowed',              label: 'Offres d’emploi', help: 'Publication gratuite d’offres pour les entreprises enrôlées' },
  { key: 'trainings_allowed',         label: 'Formations',          help: 'Publication gratuite de formations pour les entreprises enrôlées' },
  { key: 'auto_publish',              label: 'Publication auto',    help: 'Publié sans validation manuelle' },
  { key: 'require_admin_approval',    label: 'Validation admin',    help: 'Chaque publication doit être validée' },
]

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="relative inline-flex h-[26px] w-[44px] items-center rounded-full transition-colors duration-200 disabled:opacity-40 shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--kz-blue)_40%,transparent)]"
      style={{ background: on ? 'var(--kz-green)' : 'var(--osr-fill-3)' }}
      aria-pressed={on}
    >
      <span className="inline-block h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(2px)' }} />
    </button>
  )
}

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '')

export default function AdminLaunchPage() {
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', slug: '', startsAt: '', endsAt: '' })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    fetch('/api/admin/launch-campaigns')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const fetchImpact = async (id: string): Promise<Usage | null> => {
    const r = await fetch(`/api/admin/launch-campaigns/${id}`)
    if (!r.ok) return null
    const d = await r.json().catch(() => null)
    return d?.usage ?? null
  }

  const patchConfig = async (c: CampaignRow, patch: Record<string, unknown>) => {
    setBusy(c.id)
    await fetch(`/api/admin/launch-campaigns/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patch, version: c.version }),
    })
    await load()
    setBusy(null)
  }

  const toggleKillSwitch = async (c: CampaignRow) => {
    const next = !c.free_publishing_enabled
    if (!next) {
      const u = await fetchImpact(c.id)
      const ok = window.confirm(
        `Couper l’accès gratuit MAINTENANT pour « ${c.name} » ?\n\n` +
        `Impact immédiat : ${u?.companies ?? 0} entreprise(s) enrôlée(s), ${u?.activeJobs ?? 0} offre(s) active(s), ${u?.activeTrainings ?? 0} formation(s) active(s).\n` +
        `Contrairement à une pause normale, cette coupure est IMMÉDIATE pour TOUTES les entreprises déjà enrôlées. Aucune donnée n’est supprimée.`,
      )
      if (!ok) return
    }
    await patchConfig(c, { freePublishingEnabled: next })
  }

  const doTransition = async (c: CampaignRow, to: string, destructive: boolean) => {
    if (destructive) {
      const u = await fetchImpact(c.id)
      const verb = to === 'paused' ? 'mettre en pause' : to === 'ended' ? 'terminer' : 'annuler'
      const ok = window.confirm(
        `${verb.charAt(0).toUpperCase() + verb.slice(1)} la campagne « ${c.name} » ?\n\n` +
        `Impact : ${u?.companies ?? 0} entreprise(s) enrôlée(s), ${u?.activeJobs ?? 0} offre(s) active(s), ${u?.activeTrainings ?? 0} formation(s) active(s).\n` +
        `Les entreprises déjà enrôlées conservent leur accès jusqu’à leur propre échéance individuelle (sauf coupure immédiate via l’interrupteur d’urgence). Aucune donnée n’est supprimée, aucun abonnement payant n’est touché.`,
      )
      if (!ok) return
    }
    setBusy(c.id)
    await fetch(`/api/admin/launch-campaigns/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transitionTo: to, version: c.version }),
    })
    await load()
    setBusy(null)
  }

  const submitCreate = async () => {
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/admin/launch-campaigns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createForm.name, slug: createForm.slug,
        startsAt: createForm.startsAt ? new Date(createForm.startsAt).toISOString() : null,
        endsAt: createForm.endsAt ? new Date(createForm.endsAt).toISOString() : null,
      }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) { setCreateError(d.error ?? 'Erreur de création'); setCreating(false); return }
    setCreateForm({ name: '', slug: '', startsAt: '', endsAt: '' })
    setShowCreate(false)
    setCreating(false)
    await load()
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader
        eyebrow="KazaLaunch"
        title="Campagne de lancement"
        subtitle="Accès gratuit temporaire, indépendant des forfaits Stripe. Jamais visible comme tarif public."
        actions={
          <Button kind="primary" size="md" icon={<Plus size={15} />} onClick={() => setShowCreate((v) => !v)}>
            Nouvelle campagne
          </Button>
        }
      />

      {/* Impact global — toutes campagnes confondues */}
      {data && (
        <Widget title="Impact global" sub="Toutes campagnes confondues" icon={<Rocket size={14} />} accent={ACCENT.violet} className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { icon: <Building2 size={15} />, value: data.usage.companies, label: 'entreprise(s) enrôlée(s)', accent: ACCENT.violet },
              { icon: <Briefcase size={15} />, value: data.usage.activeJobs, label: 'offre(s) active(s)', accent: ACCENT.orange },
              { icon: <BookOpen size={15} />, value: data.usage.activeTrainings, label: 'formation(s) active(s)', accent: ACCENT.teal },
            ].map((k) => (
              <div key={k.label} className="osr-inset flex items-center gap-3 px-3 py-2.5">
                <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: tint(k.accent, 18), color: k.accent }}>{k.icon}</span>
                <span className="text-[22px] font-semibold tracking-[-0.04em] text-white"><CountUp value={k.value} /></span>
                <span className="text-[12px] text-[var(--kz-mute)] leading-tight">{k.label}</span>
              </div>
            ))}
          </div>
        </Widget>
      )}

      {/* ── Rappel lancement écosystème payant ── */}
      {(() => {
        const target = new Date('2026-10-06T00:00:00+04:00')
        const daysLeft = Math.ceil((target.getTime() - Date.now()) / 86_400_000)
        const activeCampaign = data?.campaigns.find((c) => c.effective_status === 'active')
        const paidVisible = activeCampaign ? activeCampaign.new_subscriptions_enabled : true
        return (
          <div className="rounded-[20px] p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{
              background: tint(ACCENT.orange, daysLeft <= 30 ? 12 : 6),
              border: `1px solid ${daysLeft <= 30 ? 'color-mix(in srgb, var(--kz-orange) 45%, transparent)' : 'var(--osr-hair)'}`,
            }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <AlertTriangle size={16} className="text-[var(--kz-orange)] shrink-0" />
                <span className="font-semibold text-white text-[14px]">
                  Lancement de l&apos;écosystème payant — 6 octobre 2026
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
                  style={{ background: 'var(--kz-orange)', color: 'black' }}>
                  J{daysLeft > 0 ? `−${daysLeft}` : ' PASSÉ'}
                </span>
              </div>
              <p className="text-[12px] text-[var(--kz-mute)] leading-relaxed">
                À partir de cette date, activer le toggle <b className="text-white">Abonnements payants</b> sur la campagne active
                pour que les offres payantes redeviennent visibles dans le tunnel d&apos;activation recruteur.
                Actuellement&nbsp;: offres payantes <b className="text-white">{paidVisible ? 'visibles' : 'masquées (skeletons)'}</b>.
              </p>
            </div>
          </div>
        )
      })()}

      {/* Création d'une campagne */}
      {showCreate && (
        <Widget title="Nouvelle campagne" sub="Créée en brouillon" icon={<Plus size={14} />} accent={ACCENT.blue} className="mb-4 os-pop">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input label="Nom" value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="KazaLaunch — Rentrée 2026" />
            <Input label="Identifiant (slug)" value={createForm.slug}
              onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="rentree-2026" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <label className="text-[12px] text-[var(--kz-mute)]">
              Ouverture des inscriptions (optionnel)
              <input type="date" value={createForm.startsAt}
                onChange={(e) => setCreateForm((f) => ({ ...f, startsAt: e.target.value }))}
                className={`mt-1.5 w-full ${OSR_FIELD}`} />
            </label>
            <label className="text-[12px] text-[var(--kz-mute)]">
              Fermeture des inscriptions (optionnel)
              <input type="date" value={createForm.endsAt}
                onChange={(e) => setCreateForm((f) => ({ ...f, endsAt: e.target.value }))}
                className={`mt-1.5 w-full ${OSR_FIELD}`} />
            </label>
          </div>
          {createError && <p role="alert" className="text-[13px] font-semibold mb-3 text-[var(--osr-red)]">{createError}</p>}
          <div className="flex gap-2">
            <Button kind="primary" size="md" loading={creating} disabled={!createForm.name.trim() || !createForm.slug.trim()} onClick={submitCreate}>
              Créer la campagne
            </Button>
            <Button kind="soft" size="md" onClick={() => setShowCreate(false)}>Annuler</Button>
          </div>
        </Widget>
      )}

      {loading ? (
        <SkeletonList rows={2} height={220} />
      ) : !data || data.campaigns.length === 0 ? (
        <div className="osr-panel"><EmptyPanel icon={<Rocket size={26} />} title="Aucune campagne pour le moment." accent={ACCENT.violet} /></div>
      ) : (
        <div className="space-y-4">
          {data.campaigns.map((c, i) => {
            const status = STATUS_LABEL[c.effective_status] ?? STATUS_LABEL.draft
            const actions = QUICK_ACTIONS[c.state] ?? []
            return (
              <div key={c.id} className="osr-panel osr-in p-4 sm:p-5" style={{ '--i': i } as React.CSSProperties}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-[19px] font-semibold tracking-[-0.02em] text-white">{c.name}</span>
                    <StatusPill accent={status.accent} live={c.effective_status === 'active'}>{status.label}</StatusPill>
                    {c.starts_at && <span className="text-[12px] text-[var(--kz-mute)] tabular-nums">du {toLocalInput(c.starts_at)}</span>}
                    {c.ends_at && <span className="text-[12px] text-[var(--kz-mute)] tabular-nums">au {toLocalInput(c.ends_at)}</span>}
                    {busy === c.id && <StatusPill accent={ACCENT.blue} live>Enregistrement…</StatusPill>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {actions.map((a) => (
                      <Button key={a.to} kind={a.destructive ? 'danger' : 'outline'} size="sm"
                        disabled={busy === c.id} onClick={() => doTransition(c, a.to, a.destructive)}>
                        {a.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[14px] border mb-3 transition-colors"
                  style={{
                    borderColor: c.free_publishing_enabled ? 'var(--osr-hair)' : 'color-mix(in srgb, var(--osr-red) 50%, transparent)',
                    background: c.free_publishing_enabled ? 'var(--osr-fill)' : tint(ACCENT.red, 12),
                  }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle size={15} className="shrink-0" style={{ color: c.free_publishing_enabled ? 'var(--kz-mute)' : 'var(--osr-red)' }} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-white">Arrêt d&apos;urgence</div>
                      <div className="text-[11px] text-[var(--kz-mute)] leading-tight">Coupe l&apos;accès gratuit immédiatement, pour toutes les entreprises déjà enrôlées</div>
                    </div>
                  </div>
                  <Toggle on={c.free_publishing_enabled} disabled={busy === c.id} onClick={() => toggleKillSwitch(c)} />
                </div>

                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                  {TOGGLES.map((t) => (
                    <div key={t.key} className="osr-inset flex items-center justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-white">{t.label}</div>
                        <div className="text-[11px] text-[var(--kz-mute)] leading-tight">{t.help}</div>
                      </div>
                      <Toggle on={Boolean(c[t.key])} disabled={busy === c.id}
                        onClick={() => patchConfig(c, { [t.key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())]: !c[t.key] })} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <label className="text-[12px] text-[var(--kz-mute)]">
                    Durée d&apos;accès par entreprise (jours)
                    <input type="number" min={1} defaultValue={c.grant_duration_days}
                      onBlur={(e) => { const v = Number(e.target.value); if (v > 0 && v !== c.grant_duration_days) patchConfig(c, { grantDurationDays: v }) }}
                      className={`mt-1.5 w-full ${OSR_FIELD}`} />
                  </label>
                  <label className="text-[12px] text-[var(--kz-mute)]">
                    Offres actives max / entreprise <span className="opacity-70">(−1 = illimité)</span>
                    <input type="number" min={-1} defaultValue={c.max_active_jobs_per_company}
                      onBlur={(e) => { const v = Number(e.target.value); if (v >= -1 && v !== c.max_active_jobs_per_company) patchConfig(c, { maxActiveJobsPerCompany: v }) }}
                      className={`mt-1.5 w-full ${OSR_FIELD}`} />
                  </label>
                  <label className="text-[12px] text-[var(--kz-mute)]">
                    Formations actives max / entreprise <span className="opacity-70">(−1 = illimité)</span>
                    <input type="number" min={-1} defaultValue={c.max_active_trainings_per_company}
                      onBlur={(e) => { const v = Number(e.target.value); if (v >= -1 && v !== c.max_active_trainings_per_company) patchConfig(c, { maxActiveTrainingsPerCompany: v }) }}
                      className={`mt-1.5 w-full ${OSR_FIELD}`} />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <label className="text-[12px] text-[var(--kz-mute)]">
                    Inscriptions ouvertes à partir du
                    <input type="date" defaultValue={toLocalInput(c.starts_at)}
                      onChange={(e) => patchConfig(c, { startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className={`mt-1.5 w-full ${OSR_FIELD}`} />
                  </label>
                  <label className="text-[12px] text-[var(--kz-mute)]">
                    Inscriptions fermées à partir du
                    <input type="date" defaultValue={toLocalInput(c.ends_at)}
                      onChange={(e) => patchConfig(c, { endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className={`mt-1.5 w-full ${OSR_FIELD}`} />
                  </label>
                </div>

                <label className="text-[12px] text-[var(--kz-mute)] block">
                  Message recruteur (affiché aux entreprises enrôlées — wording réutilisable)
                  <Textarea value={c.recruiter_message ?? ''} rows={2} label=""
                    onChange={(e) => setData((d) => d ? { ...d, campaigns: d.campaigns.map((x) => x.id === c.id ? { ...x, recruiter_message: e.target.value } : x) } : d)}
                    onBlur={(e) => patchConfig(c, { recruiterMessage: e.target.value || null })}
                    placeholder="Profitez de votre accès gratuit pour publier vos premières offres sans engagement." />
                </label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
