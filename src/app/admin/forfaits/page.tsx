'use client'

/**
 * Administration > Monétisation > Forfaits.
 * CRUD complet : pilotage des flags, édition prix/limites, duplication, archivage.
 * Toute modification est auditée côté serveur.
 */
import { useEffect, useState } from 'react'
import { Copy, Archive, ChevronDown, Edit2, Check, X, Tag, CircleCheck, TriangleAlert } from 'lucide-react'
import { ACCENT, EmptyPanel, IconButton, PageHeader, SkeletonList, StatusPill } from '@/components/os/recruiter/primitives'
import { OSR_FIELD } from '@/components/os/recruiter/admin-ui'

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
      className="relative inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--kz-blue)_40%,transparent)]"
      style={{ background: on ? 'var(--kz-green)' : 'var(--osr-fill-3)' }} aria-pressed={on}>
      <span className="inline-block h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(2px)' }} />
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
      <button onClick={() => setEditing(true)} title={`Modifier ${label}`} aria-label={`Modifier ${label}`}
        className="group inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[9px] text-[12px] text-white bg-[var(--osr-fill-2)] hover:bg-[var(--osr-fill-3)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]">
        <span className="font-semibold tabular-nums">{value}</span><span className="text-[var(--kz-mute)]">{suffix}</span>
        <Edit2 size={11} className="text-[var(--kz-mute)] group-hover:text-[var(--kz-blue)] transition-colors" />
      </button>
    )
  }
  return (
    <span className="os-pop inline-flex items-center gap-1">
      <input autoFocus type={type} value={draft} onChange={e => setDraft(e.target.value)} aria-label={label}
        className="w-24 h-7 text-[12px] px-2 rounded-[9px] text-white bg-[var(--osr-fill-3)] border border-[var(--kz-blue)] outline-none ring-4 ring-[color-mix(in_srgb,var(--kz-blue)_22%,transparent)]" />
      {suffix && <span className="text-[12px] text-[var(--kz-mute)]">{suffix}</span>}
      <button onClick={commit} aria-label="Valider" className="osr-icon-btn !w-7 !h-7 !text-[var(--kz-green)]"><Check size={13} /></button>
      <button onClick={cancel} aria-label="Annuler" className="osr-icon-btn !w-7 !h-7"><X size={13} /></button>
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
      <PageHeader eyebrow="Monétisation" title="Forfaits"
        subtitle="Activez, masquez, planifiez ou modifiez les forfaits. Les modifications sont auditées." />

      {loading ? (
        <SkeletonList rows={3} height={150} />
      ) : !data ? (
        <div className="osr-panel"><EmptyPanel icon={<Tag size={26} />} title="Accès refusé ou erreur." accent={ACCENT.red} /></div>
      ) : (
        <div className="space-y-3">
          {data.plans.map((plan, i) => (
            <div key={plan.id} className="osr-panel osr-in overflow-hidden"
              style={{ '--i': i, ...(plan.is_featured ? { borderColor: 'color-mix(in srgb, var(--kz-violet) 45%, transparent)' } : {}) } as React.CSSProperties}>
              {/* En-tête */}
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[19px] font-semibold tracking-[-0.02em] text-white">{plan.name}</span>
                      {plan.is_featured && <StatusPill accent={ACCENT.violet}>Mis en avant</StatusPill>}
                      {!plan.is_active && <StatusPill accent={ACCENT.mute}>Désactivé</StatusPill>}
                      {plan.company_count !== undefined && (
                        <span className="osr-chip">{plan.company_count} entreprise(s)</span>
                      )}
                      {saving === plan.id && <StatusPill accent={ACCENT.blue} live>Enregistrement…</StatusPill>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <InlineField label="Prix" value={Math.round(plan.price_cts / 100)} type="number" suffix="€/mois"
                        onSave={v => patch(plan.id, { priceCts: Math.round(parseFloat(v) * 100) }, { price_cts: Math.round(parseFloat(v) * 100) })} />
                      <InlineField label="Offres max" value={plan.max_jobs === -1 ? '∞' : plan.max_jobs} type="text" suffix="offres"
                        onSave={v => { const n = v === '∞' ? -1 : parseInt(v, 10); patch(plan.id, { maxJobs: n }, { max_jobs: n }) }} />
                      <InlineField label="Sièges max" value={plan.max_members === -1 ? '∞' : plan.max_members} type="text" suffix="siège(s)"
                        onSave={v => { const n = v === '∞' ? -1 : parseInt(v, 10); patch(plan.id, { maxMembers: n }, { max_members: n }) }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <IconButton label="Dupliquer" onClick={() => duplicate(plan.id)}>
                      <Copy size={14} />
                    </IconButton>
                    <IconButton label="Archiver" tone="accent" onClick={() => archive(plan)}>
                      <Archive size={14} />
                    </IconButton>
                    <IconButton label={expanded === plan.id ? 'Masquer les réglages avancés' : 'Réglages avancés'} onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}>
                      <ChevronDown size={15} className="transition-transform duration-300" style={{ transform: expanded === plan.id ? 'rotate(180deg)' : 'none' }} />
                    </IconButton>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-2">
                  {TOGGLES.map((t) => (
                    <div key={t.key} className="osr-inset flex items-center justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-white">{t.label}</div>
                        <div className="text-[11px] text-[var(--kz-mute)] leading-tight">{t.help}</div>
                      </div>
                      <Toggle on={Boolean(plan[t.key])} onClick={() => toggle(plan, t.key)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Panneau étendu */}
              {expanded === plan.id && (
                <div className="os-pop border-t border-[var(--osr-hair)] p-4 bg-[color-mix(in_srgb,black_22%,transparent)] space-y-4">
                  {/* Dates de disponibilité */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-[12px] text-[var(--kz-mute)]">Disponible à partir du
                      <input type="date" defaultValue={plan.starts_at ? plan.starts_at.slice(0, 10) : ''}
                        onChange={e => setDate(plan, 'starts_at', e.target.value)}
                        className={`mt-1.5 w-full ${OSR_FIELD}`} />
                    </label>
                    <label className="text-[12px] text-[var(--kz-mute)]">Disponible jusqu&apos;au
                      <input type="date" defaultValue={plan.ends_at ? plan.ends_at.slice(0, 10) : ''}
                        onChange={e => setDate(plan, 'ends_at', e.target.value)}
                        className={`mt-1.5 w-full ${OSR_FIELD}`} />
                    </label>
                  </div>

                  {/* Stripe */}
                  <div>
                    <p className="osr-eyebrow mb-2 !text-[11px]">Stripe (optionnel)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="text-[12px] text-[var(--kz-mute)]">Product ID
                        <input type="text" defaultValue={plan.stripe_product_id ?? ''}
                          onBlur={e => patch(plan.id, { stripeProductId: e.target.value || null }, { stripe_product_id: e.target.value || null })}
                          className={`mt-1.5 w-full font-mono !text-[12px] ${OSR_FIELD}`} />
                      </label>
                      <label className="text-[12px] text-[var(--kz-mute)]">Price ID
                        <input type="text" defaultValue={plan.stripe_price_id ?? ''}
                          onBlur={e => patch(plan.id, { stripePriceId: e.target.value || null }, { stripe_price_id: e.target.value || null })}
                          className={`mt-1.5 w-full font-mono !text-[12px] ${OSR_FIELD}`} />
                      </label>
                    </div>
                    <p className="text-[12px] mt-2 flex items-center gap-1.5"
                      style={{ color: plan.stripe_product_id && plan.stripe_price_id ? 'var(--kz-green)' : 'var(--kz-orange)' }}>
                      {plan.stripe_product_id && plan.stripe_price_id
                        ? <><CircleCheck size={13} />Stripe configuré</>
                        : <><TriangleAlert size={13} />Stripe non configuré — le checkout ne sera pas disponible pour ce forfait.</>}
                    </p>
                  </div>

                  {/* Ordre + Slug */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="text-[12px] text-[var(--kz-mute)]">Ordre d&apos;affichage
                      <input type="number" defaultValue={plan.sort_order}
                        onBlur={e => patch(plan.id, { sortOrder: parseInt(e.target.value, 10) }, { sort_order: parseInt(e.target.value, 10) })}
                        className={`mt-1.5 w-20 block ${OSR_FIELD}`} />
                    </label>
                    <div className="text-xs text-[var(--kz-mute)]">
                      Slug : <code className="osr-chip font-mono">{plan.id}</code>
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
