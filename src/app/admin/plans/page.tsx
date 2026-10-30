'use client'

/**
 * Administration > Monétisation > Forfaits.
 * CRUD complet : pilotage des flags, édition prix/limites, duplication, archivage.
 * Toute modification est auditée côté serveur.
 */
import { useEffect, useState } from 'react'
import { Copy, Archive, ChevronDown, ChevronUp, Edit2, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'

interface PlanRow {
  id: string; name: string; price_cts: number; max_jobs: number; max_members: number
  is_active: boolean; is_public: boolean; is_selectable: boolean; is_featured: boolean
  sort_order: number; starts_at: string | null; ends_at: string | null; updated_at: string | null
  stripe_product_id: string | null; stripe_price_id: string | null; company_count?: number
}
interface ApiData { plans: PlanRow[] }

const TOGGLES: { key: keyof PlanRow; label: string; help: string }[] = [
  { key: 'is_active',     label: 'Activé',        help: 'Utilisable par le moteur de droits' },
  { key: 'is_public',     label: 'Public',         help: 'Visible sur les pages publiques' },
  { key: 'is_selectable', label: 'Souscriptible',  help: 'Sélectionnable par un nouveau recruteur' },
  { key: 'is_featured',   label: 'Mis en avant',   help: 'Mise en avant visuelle' },
]

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="relative inline-flex h-6 w-11 items-center rounded-full border border-[var(--kz-edge)] transition-colors disabled:opacity-40"
      style={{ background: on ? KZ.green : KZ.beige }} aria-pressed={on}>
      <span className="inline-block h-4 w-4 rounded-full bg-[var(--kz-paper)] border border-[var(--kz-edge)] transition-transform"
        style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  )
}

interface InlineFieldProps {
  label: string; value: string | number; type?: string; suffix?: string
  onSave: (v: string) => void
}
function InlineField({ label, value, type = 'text', suffix, onSave }: InlineFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value))
  const commit = () => { onSave(draft); setEditing(false) }
  const cancel = () => { setDraft(String(value)); setEditing(false) }
  if (!editing) {
    return (
      <span className="flex items-center gap-1 text-xs text-[var(--kz-ink)]">
        <span className="font-medium">{value}{suffix}</span>
        <button onClick={() => setEditing(true)} className="text-[var(--kz-violet)] hover:underline ml-1" title={`Modifier ${label}`}>
          <Edit2 size={11} />
        </button>
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1">
      <input autoFocus type={type} value={draft} onChange={e => setDraft(e.target.value)}
        className="w-24 text-xs px-1.5 py-0.5 border border-[var(--kz-violet)] rounded focus:outline-none" />
      {suffix && <span className="text-xs text-[var(--kz-mute)]">{suffix}</span>}
      <button onClick={commit} className="text-[var(--kz-green)]"><Check size={12} /></button>
      <button onClick={cancel} className="text-[var(--kz-orange)]"><X size={12} /></button>
    </span>
  )
}

export default function AdminPlansPage() {
  const [data, setData]   = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const reload = () => {
    fetch('/api/admin/plans').then(r => r.ok ? r.json() : null).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(reload, [])

  const patch = async (planId: string, p: Record<string, unknown>, optimistic: Partial<PlanRow>) => {
    if (!data) return
    setData({ plans: data.plans.map(pl => pl.id === planId ? { ...pl, ...optimistic } : pl) })
    setSaving(planId)
    try {
      await fetch('/api/admin/plans', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, patch: p }),
      })
    } finally { setSaving(null) }
  }

  const toggle = (plan: PlanRow, key: keyof PlanRow) => {
    const next = !plan[key]
    const map: Record<string, string> = {
      is_active: 'isActive', is_public: 'isPublic', is_selectable: 'isSelectable', is_featured: 'isFeatured',
    }
    patch(plan.id, { [map[key as string]]: next }, { [key]: next } as Partial<PlanRow>)
  }

  const setDate = (plan: PlanRow, field: 'starts_at' | 'ends_at', value: string) => {
    const iso = value ? new Date(value).toISOString() : null
    const apiKey = field === 'starts_at' ? 'startsAt' : 'endsAt'
    patch(plan.id, { [apiKey]: iso }, { [field]: iso } as Partial<PlanRow>)
  }

  const duplicate = async (planId: string) => {
    setSaving(planId)
    await fetch('/api/admin/plans/duplicate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    setSaving(null); reload()
  }

  const archive = async (plan: PlanRow) => {
    if (!confirm(`Archiver le forfait "${plan.name}" ? Il sera masqué (non supprimé).`)) return
    setSaving(plan.id)
    await fetch('/api/admin/plans/archive', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id }),
    })
    setSaving(null); reload()
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[var(--kz-ink)]">Monétisation · Forfaits</h1>
        <p className="text-sm text-[var(--kz-mute)] mt-1">
          Activez, masquez, planifiez ou modifiez les forfaits. Les modifications sont auditées.
        </p>
      </div>

      {loading ? (
        <div className="kz-card p-8 text-center text-[var(--kz-mute)] bg-[var(--kz-paper)]">Chargement…</div>
      ) : !data ? (
        <div className="kz-card p-8 text-center text-[var(--kz-mute)] bg-[var(--kz-paper)]">Accès refusé ou erreur.</div>
      ) : (
        <div className="space-y-3">
          {data.plans.map((plan) => (
            <div key={plan.id} className="kz-card bg-[var(--kz-paper)] overflow-hidden">
              {/* En-tête */}
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-[var(--kz-ink)]">{plan.name}</span>
                      {plan.is_featured && <Badge color="violet" size="sm">Mis en avant</Badge>}
                      {!plan.is_active && <Badge color="cream" size="sm">Désactivé</Badge>}
                      {plan.company_count !== undefined && (
                        <Badge color="cream" size="sm">{plan.company_count} entreprise(s)</Badge>
                      )}
                      {saving === plan.id && <span className="text-xs text-[var(--kz-violet)]">enregistrement…</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <InlineField label="Prix" value={Math.round(plan.price_cts / 100)} type="number" suffix="€/mois"
                        onSave={v => patch(plan.id, { priceCts: Math.round(parseFloat(v) * 100) }, { price_cts: Math.round(parseFloat(v) * 100) })} />
                      <InlineField label="Offres max" value={plan.max_jobs === -1 ? '∞' : plan.max_jobs} type="text" suffix="offres"
                        onSave={v => { const n = v === '∞' ? -1 : parseInt(v, 10); patch(plan.id, { maxJobs: n }, { max_jobs: n }) }} />
                      <InlineField label="Sièges max" value={plan.max_members === -1 ? '∞' : plan.max_members} type="text" suffix="siège(s)"
                        onSave={v => { const n = v === '∞' ? -1 : parseInt(v, 10); patch(plan.id, { maxMembers: n }, { max_members: n }) }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => duplicate(plan.id)} title="Dupliquer"
                      className="p-1.5 rounded-lg border border-[var(--kz-line)] text-[var(--kz-mute)] hover:border-[var(--kz-violet)] hover:text-[var(--kz-violet)]">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => archive(plan)} title="Archiver"
                      className="p-1.5 rounded-lg border border-[var(--kz-line)] text-[var(--kz-mute)] hover:border-[var(--kz-orange)] hover:text-[var(--kz-orange)]">
                      <Archive size={14} />
                    </button>
                    <button onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
                      className="p-1.5 rounded-lg border border-[var(--kz-line)] text-[var(--kz-mute)]">
                      {expanded === plan.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TOGGLES.map((t) => (
                    <div key={t.key} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--kz-line)]">
                      <div>
                        <div className="text-xs font-bold text-[var(--kz-ink)]">{t.label}</div>
                        <div className="text-[10px] text-[var(--kz-mute)] leading-tight">{t.help}</div>
                      </div>
                      <Toggle on={Boolean(plan[t.key])} onClick={() => toggle(plan, t.key)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Panneau étendu */}
              {expanded === plan.id && (
                <div className="border-t border-[var(--kz-line)] p-4 bg-[var(--kz-cream2)] space-y-4">
                  {/* Dates de disponibilité */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs text-[var(--kz-mute)]">Disponible à partir du
                      <input type="date" defaultValue={plan.starts_at ? plan.starts_at.slice(0, 10) : ''}
                        onChange={e => setDate(plan, 'starts_at', e.target.value)}
                        className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[var(--kz-line)] bg-[var(--kz-paper)] text-[var(--kz-ink)]" />
                    </label>
                    <label className="text-xs text-[var(--kz-mute)]">Disponible jusqu'au
                      <input type="date" defaultValue={plan.ends_at ? plan.ends_at.slice(0, 10) : ''}
                        onChange={e => setDate(plan, 'ends_at', e.target.value)}
                        className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[var(--kz-line)] bg-[var(--kz-paper)] text-[var(--kz-ink)]" />
                    </label>
                  </div>

                  {/* Stripe */}
                  <div>
                    <p className="text-xs font-bold text-[var(--kz-mute)] mb-2 uppercase tracking-wide">Stripe (optionnel)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="text-xs text-[var(--kz-mute)]">Product ID
                        <input type="text" defaultValue={plan.stripe_product_id ?? ''}
                          onBlur={e => patch(plan.id, { stripeProductId: e.target.value || null }, { stripe_product_id: e.target.value || null })}
                          className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[var(--kz-line)] bg-[var(--kz-paper)] text-[var(--kz-ink)] font-mono text-xs" />
                      </label>
                      <label className="text-xs text-[var(--kz-mute)]">Price ID
                        <input type="text" defaultValue={plan.stripe_price_id ?? ''}
                          onBlur={e => patch(plan.id, { stripePriceId: e.target.value || null }, { stripe_price_id: e.target.value || null })}
                          className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[var(--kz-line)] bg-[var(--kz-paper)] text-[var(--kz-ink)] font-mono text-xs" />
                      </label>
                    </div>
                    <p className="text-[10px] text-[var(--kz-mute)] mt-1">
                      {plan.stripe_product_id && plan.stripe_price_id
                        ? '✅ Stripe configuré'
                        : '⚠️ Stripe non configuré — le checkout ne sera pas disponible pour ce forfait.'}
                    </p>
                  </div>

                  {/* Ordre + Slug */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="text-xs text-[var(--kz-mute)]">Ordre d'affichage
                      <input type="number" defaultValue={plan.sort_order}
                        onBlur={e => patch(plan.id, { sortOrder: parseInt(e.target.value, 10) }, { sort_order: parseInt(e.target.value, 10) })}
                        className="mt-1 w-20 px-2 py-1.5 rounded-lg border border-[var(--kz-line)] bg-[var(--kz-paper)] text-[var(--kz-ink)]" />
                    </label>
                    <div className="text-xs text-[var(--kz-mute)]">
                      Slug : <code className="bg-[var(--kz-paper)] px-1.5 py-0.5 rounded border border-[var(--kz-line)] font-mono">{plan.id}</code>
                    </div>
                    {plan.updated_at && (
                      <div className="text-xs text-[var(--kz-mute)]">
                        Modifié le {new Date(plan.updated_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
