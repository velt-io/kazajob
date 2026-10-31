'use client'

/**
 * Administration > Entreprises > [id] — Fiche entreprise avec section Abonnement & Usage.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, ShieldAlert, CheckCircle2, AlertTriangle, Info, CreditCard, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/radix'
import type { CompanyBillingSummary } from '@/lib/queries/billing-summary'
import { ACCENT, PageHeader, StatusPill, Widget, tint } from '@/components/os/recruiter/primitives'
import { OSR_FIELD } from '@/components/os/recruiter/admin-ui'

const SEVERITY_STYLE: Record<string, { accent: string; icon: React.ReactNode }> = {
  success: { accent: ACCENT.green,  icon: <CheckCircle2  size={16} /> },
  info:    { accent: ACCENT.blue,   icon: <Info          size={16} /> },
  warning: { accent: ACCENT.yellow, icon: <AlertTriangle size={16} /> },
  danger:  { accent: ACCENT.orange, icon: <ShieldAlert   size={16} /> },
}

export default function AdminCompanyDetailPage() {
  const { id: companyId } = useParams<{ id: string }>()
  const [summary, setSummary] = useState<CompanyBillingSummary | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  // Formulaire override
  const [overrideEnabled, setOverrideEnabled] = useState(false)
  const [overrideMax, setOverrideMax]         = useState<string>('')
  const [overrideReason, setOverrideReason]   = useState('')
  const [overrideUntil, setOverrideUntil]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/billing`)
      if (res.ok) {
        const d = await res.json() as CompanyBillingSummary
        setSummary(d)
        setOverrideEnabled(d.adminOverrideEnabled)
        setOverrideMax(d.overrideMaxActiveJobs !== null ? String(d.overrideMaxActiveJobs) : '')
        setOverrideReason(/* non retourné ici, laisser vide */  '')
        setOverrideUntil(d.overrideUntil ? d.overrideUntil.slice(0, 10) : '')
      }
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { if (companyId) load() }, [companyId])

  const saveOverride = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/override`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminOverrideEnabled:  overrideEnabled,
          overrideMaxActiveJobs: overrideMax === '' || overrideMax === '∞' ? null : parseInt(overrideMax, 10),
          overrideReason:        overrideReason || null,
          overrideUntil:         overrideUntil ? new Date(overrideUntil).toISOString() : null,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur'); }
      else await load()
    } catch { setError('Erreur réseau') }
    setSaving(false)
  }

  if (loading) return <div className="osr-skel h-48 max-w-[860px] mx-auto" />

  const style = summary ? SEVERITY_STYLE[summary.message.severity] ?? SEVERITY_STYLE.info : SEVERITY_STYLE.info

  return (
    <div className="max-w-[860px] mx-auto">
      <Link href="/admin/entreprises" className="inline-flex items-center gap-0.5 text-[14px] font-medium text-[var(--kz-blue)] hover:brightness-125 mb-3">
        <ChevronLeft size={16} />Entreprises
      </Link>
      <PageHeader eyebrow="Fiche entreprise" title="Abonnement & usage" />

      {summary && (
        <div className="flex flex-col gap-4">
          {/* ── Carte statut ── */}
          <Widget title="Statut facturation" icon={<CreditCard size={14} />} accent={style.accent}>
            <div className="rounded-[16px] p-3.5 flex items-start gap-3 mb-4"
              style={{ background: tint(style.accent, 12), border: `1px solid color-mix(in srgb, ${style.accent} 35%, transparent)` }}>
              <span className="shrink-0 mt-0.5" style={{ color: style.accent }}>{style.icon}</span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white">{summary.message.title}</p>
                <p className="text-[13px] text-[var(--kz-mute)] mt-0.5">{summary.message.description}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { k: 'Source', v: <span className="capitalize">{summary.source.replace('_', ' ')}</span> },
                { k: 'Statut abonnement', v: summary.subscriptionStatus ?? '—' },
                { k: 'Forfait actuel', v: summary.planName ?? (summary.campaignName ? `Campagne : ${summary.campaignName}` : 'Aucun') },
                { k: 'Annonces actives', v: <span className="tabular-nums">{summary.activeJobs}</span> },
                { k: 'Limite effective', v: summary.maxJobs === -1 ? 'Illimité' : <span className="tabular-nums">{summary.maxJobs}</span> },
                {
                  k: 'Dépassement',
                  v: <StatusPill accent={summary.isOverLimit ? ACCENT.orange : ACCENT.green}>{summary.isOverLimit ? 'Oui' : 'Non'}</StatusPill>,
                },
              ].map((row) => (
                <div key={row.k} className="osr-inset px-3 py-2.5 min-w-0">
                  <dt className="text-[11px] text-[var(--kz-mute)]">{row.k}</dt>
                  <dd className="text-[14px] font-semibold text-white mt-0.5 truncate">{row.v}</dd>
                </div>
              ))}
            </dl>
          </Widget>

          {/* ── Dérogation admin ── */}
          <Widget title="Dérogation admin" icon={<ShieldCheck size={14} />} accent={ACCENT.violet}>
            <div className="flex items-center gap-3 mb-5">
              <Switch id="override-enabled" checked={overrideEnabled} onCheckedChange={(v) => setOverrideEnabled(v)} />
              <label htmlFor="override-enabled" className="text-[14px] font-medium text-white cursor-pointer">
                {overrideEnabled ? 'Dérogation activée' : 'Dérogation désactivée'}
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <label className="text-[12px] text-[var(--kz-mute)] flex flex-col gap-1.5">
                Quota max (vide = illimité)
                <input type="number" value={overrideMax} onChange={e => setOverrideMax(e.target.value)}
                  placeholder="ex : 15" className={OSR_FIELD} />
              </label>
              <label className="text-[12px] text-[var(--kz-mute)] flex flex-col gap-1.5">
                Valide jusqu&apos;au (vide = sans limite)
                <input type="date" value={overrideUntil} onChange={e => setOverrideUntil(e.target.value)}
                  className={OSR_FIELD} />
              </label>
              <label className="text-[12px] text-[var(--kz-mute)] flex flex-col gap-1.5">
                Raison (note interne)
                <input type="text" value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                  placeholder="ex : partenaire lancement" className={OSR_FIELD} />
              </label>
            </div>

            {error && <p role="alert" className="text-[13px] text-[var(--osr-red)] mb-3">{error}</p>}

            <Button kind="primary" size="md" onClick={saveOverride} disabled={saving} loading={saving}>
              Enregistrer la dérogation
            </Button>

            <p className="text-[11px] text-[var(--kz-mute)] mt-3">
              La dérogation prend le dessus sur le forfait payant et la campagne. Auditée.
            </p>
          </Widget>
        </div>
      )}
    </div>
  )
}
