'use client'

/**
 * Administration > Entreprises > [id] — Fiche entreprise avec section Abonnement & Usage.
 */
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, ShieldAlert, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'
import type { CompanyBillingSummary } from '@/lib/queries/billing-summary'

const SEVERITY_STYLE: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  success: { bg: KZ.greenSoft,  border: KZ.green,  icon: <CheckCircle2 size={16} style={{ color: KZ.green }} /> },
  info:    { bg: KZ.blueSoft,   border: KZ.blue,   icon: <Info         size={16} style={{ color: KZ.blue  }} /> },
  warning: { bg: KZ.yellowSoft, border: KZ.yellow, icon: <AlertTriangle size={16} style={{ color: '#B45309' }} /> },
  danger:  { bg: KZ.orangeSoft, border: KZ.orange, icon: <ShieldAlert  size={16} style={{ color: KZ.orange }} /> },
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

  if (loading) return <div className="h-48 rounded-2xl bg-[var(--kz-cream2)] animate-pulse max-w-[800px] mx-auto" />

  const style = summary ? SEVERITY_STYLE[summary.message.severity] ?? SEVERITY_STYLE.info : SEVERITY_STYLE.info

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/companies">
          <button className="p-1.5 rounded-lg border border-[var(--kz-line)] text-[var(--kz-mute)] hover:text-[var(--kz-ink)]">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <h1 className="text-xl font-extrabold text-[var(--kz-ink)]">Fiche entreprise — Abonnement &amp; Usage</h1>
      </div>

      {summary && (
        <>
          {/* ── Carte statut ── */}
          <div className="kz-card p-4 bg-[var(--kz-paper)]">
            <h2 className="text-sm font-extrabold text-[var(--kz-ink)] mb-3 uppercase tracking-wide">Statut facturation</h2>
            <div className="rounded-xl border p-3 flex items-start gap-3 mb-4"
              style={{ background: style.bg, borderColor: style.border }}>
              {style.icon}
              <div>
                <p className="text-sm font-bold text-[var(--kz-ink)]">{summary.message.title}</p>
                <p className="text-xs text-[var(--kz-mute)] mt-0.5">{summary.message.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-[var(--kz-line)] p-2">
                <div className="text-[var(--kz-mute)]">Source</div>
                <div className="font-bold text-[var(--kz-ink)] capitalize">{summary.source.replace('_', ' ')}</div>
              </div>
              <div className="rounded-lg border border-[var(--kz-line)] p-2">
                <div className="text-[var(--kz-mute)]">Statut abonnement</div>
                <div className="font-bold text-[var(--kz-ink)]">{summary.subscriptionStatus ?? '—'}</div>
              </div>
              <div className="rounded-lg border border-[var(--kz-line)] p-2">
                <div className="text-[var(--kz-mute)]">Forfait actuel</div>
                <div className="font-bold text-[var(--kz-ink)]">{summary.planName ?? (summary.campaignName ? `Campagne : ${summary.campaignName}` : 'Aucun')}</div>
              </div>
              <div className="rounded-lg border border-[var(--kz-line)] p-2">
                <div className="text-[var(--kz-mute)]">Annonces actives</div>
                <div className="font-bold text-[var(--kz-ink)]">{summary.activeJobs}</div>
              </div>
              <div className="rounded-lg border border-[var(--kz-line)] p-2">
                <div className="text-[var(--kz-mute)]">Limite effective</div>
                <div className="font-bold text-[var(--kz-ink)]">{summary.maxJobs === -1 ? 'Illimité' : summary.maxJobs}</div>
              </div>
              <div className="rounded-lg border border-[var(--kz-line)] p-2">
                <div className="text-[var(--kz-mute)]">Dépassement</div>
                <div className="font-bold" style={{ color: summary.isOverLimit ? KZ.orange : KZ.green }}>
                  {summary.isOverLimit ? 'Oui ⚠️' : 'Non ✅'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Dérogation admin ── */}
          <div className="kz-card p-4 bg-[var(--kz-paper)]">
            <h2 className="text-sm font-extrabold text-[var(--kz-ink)] mb-3 uppercase tracking-wide">Dérogation admin</h2>

            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => setOverrideEnabled(!overrideEnabled)}
                className="relative inline-flex h-6 w-11 items-center rounded-full border border-[var(--kz-edge)] transition-colors"
                style={{ background: overrideEnabled ? KZ.green : KZ.beige }}>
                <span className="inline-block h-4 w-4 rounded-full bg-[var(--kz-paper)] border border-[var(--kz-edge)] transition-transform"
                  style={{ transform: overrideEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
              </button>
              <span className="text-sm font-medium text-[var(--kz-ink)]">
                {overrideEnabled ? 'Dérogation activée' : 'Dérogation désactivée'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <label className="text-xs text-[var(--kz-mute)]">
                Quota max (vide = illimité)
                <input type="number" value={overrideMax} onChange={e => setOverrideMax(e.target.value)}
                  placeholder="ex : 15"
                  className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[var(--kz-line)] bg-[var(--kz-paper)] text-[var(--kz-ink)]" />
              </label>
              <label className="text-xs text-[var(--kz-mute)]">
                Valide jusqu'au (vide = sans limite)
                <input type="date" value={overrideUntil} onChange={e => setOverrideUntil(e.target.value)}
                  className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[var(--kz-line)] bg-[var(--kz-paper)] text-[var(--kz-ink)]" />
              </label>
              <label className="text-xs text-[var(--kz-mute)]">
                Raison (note interne)
                <input type="text" value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                  placeholder="ex : partenaire lancement"
                  className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[var(--kz-line)] bg-[var(--kz-paper)] text-[var(--kz-ink)]" />
              </label>
            </div>

            {error && <p className="text-xs text-[var(--kz-orange-deep)] mb-2">{error}</p>}

            <Button kind="primary" size="sm" onClick={saveOverride} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer la dérogation'}
            </Button>

            <p className="text-[10px] text-[var(--kz-mute)] mt-2">
              La dérogation prend le dessus sur le forfait payant et la campagne. Auditée.
            </p>
          </div>
        </>
      )}

      <div className="text-center">
        <Link href="/admin/companies" className="text-xs text-[var(--kz-violet)] hover:underline">
          ← Retour à la liste des entreprises
        </Link>
      </div>
    </div>
  )
}
