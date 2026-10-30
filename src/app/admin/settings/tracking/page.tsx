'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Radio, History, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { KZ } from '@/lib/constants'
import type { TrackingIntegration, TrackingIntegrationVersion } from '@/lib/types'

const PROVIDER_OPTIONS = [
  { value: 'linkedin_insight', label: 'LinkedIn Insight Tag' },
  { value: 'meta_pixel',       label: 'Meta Pixel' },
  { value: 'ga4',              label: 'Google Analytics 4' },
  { value: 'gtm',              label: 'Google Tag Manager' },
  { value: 'custom',           label: 'Script personnalisé (avancé)' },
]
const CONSENT_OPTIONS = [
  { value: 'necessary', label: 'Nécessaire (toujours actif)' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'marketing', label: 'Marketing' },
]
const ENV_OPTIONS = [
  { value: 'production', label: 'Production' },
  { value: 'staging',    label: 'Staging' },
  { value: 'all',        label: 'Tous les environnements' },
]
const PLACEMENT_OPTIONS = [
  { value: 'head',       label: 'Head' },
  { value: 'body_start', label: 'Début du body' },
  { value: 'body_end',   label: 'Fin du body' },
]

interface FormState {
  name: string
  description: string
  provider: string
  identifier: string
  customCode: string
  placement: string
  environment: string
  consentCategory: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  name: '', description: '', provider: 'linkedin_insight', identifier: '', customCode: '',
  placement: 'body_end', environment: 'production', consentCategory: 'marketing', isActive: false,
}

export default function AdminTrackingPage() {
  const [integrations, setIntegrations] = useState<TrackingIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [versions, setVersions] = useState<TrackingIntegrationVersion[]>([])
  const [confirmCustom, setConfirmCustom] = useState(false)

  const fetchIntegrations = async () => {
    const res = await fetch('/api/admin/tracking')
    if (res.ok) setIntegrations(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchIntegrations() }, [])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
    setConfirmCustom(false)
    setModalOpen(true)
  }

  const openEdit = (i: TrackingIntegration) => {
    setForm({
      name: i.name, description: i.description ?? '', provider: i.provider,
      identifier: i.identifier ?? '', customCode: i.custom_code ?? '',
      placement: i.placement, environment: i.environment, consentCategory: i.consent_category,
      isActive: i.is_active,
    })
    setEditingId(i.id)
    setError('')
    setConfirmCustom(false)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Nom requis'); return }
    if (form.provider === 'custom' && !form.customCode.trim()) { setError('Code requis pour un script personnalisé'); return }
    if (form.provider !== 'custom' && !form.identifier.trim()) { setError('Identifiant requis pour ce fournisseur'); return }
    if (form.provider === 'custom' && !confirmCustom) { setError('Confirme le risque du script personnalisé ci-dessous'); return }

    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      provider: form.provider,
      identifier: form.provider === 'custom' ? null : form.identifier.trim(),
      customCode: form.provider === 'custom' ? form.customCode : null,
      placement: form.placement,
      environment: form.environment,
      consentCategory: form.consentCategory,
      isActive: form.isActive,
    }
    const res = editingId
      ? await fetch(`/api/admin/tracking/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/admin/tracking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Erreur lors de l\'enregistrement')
      setSaving(false)
      return
    }
    setSaving(false)
    setModalOpen(false)
    await fetchIntegrations()
  }

  const toggleActive = async (i: TrackingIntegration) => {
    await fetch(`/api/admin/tracking/${i.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !i.is_active }) })
    await fetchIntegrations()
  }

  const handleDelete = async (i: TrackingIntegration) => {
    if (!confirm(`Supprimer l'intégration "${i.name}" ?`)) return
    await fetch(`/api/admin/tracking/${i.id}`, { method: 'DELETE' })
    await fetchIntegrations()
  }

  const openHistory = async (id: string) => {
    setHistoryId(id)
    const res = await fetch(`/api/admin/tracking/${id}/versions`)
    setVersions(res.ok ? await res.json() : [])
  }

  const handleRollback = async (versionId: string) => {
    if (!historyId || !confirm('Revenir à cette version ? La configuration actuelle sera écrasée (récupérable via l\'historique).')) return
    await fetch(`/api/admin/tracking/${historyId}/rollback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ versionId }) })
    setHistoryId(null)
    await fetchIntegrations()
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--kz-ink)] flex items-center gap-2"><Radio size={22} color={KZ.violet} /> Tracking & Ads</h1>
          <p className="text-sm text-[var(--kz-mute)] mt-1">Scripts et pixels publicitaires — gérés sans déploiement, respectent le consentement cookies.</p>
        </div>
        <Button kind="primary" size="md" icon={<Plus size={14} />} onClick={openCreate}>Ajouter une intégration</Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-[var(--kz-cream2)] animate-pulse" />)}
        </div>
      ) : integrations.length === 0 ? (
        <div className="text-sm text-[var(--kz-mute)] py-10 text-center border border-dashed border-[var(--kz-line)] rounded-xl">
          Aucune intégration configurée.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {integrations.map(i => (
            <div key={i.id} className="kz-card p-4 bg-[var(--kz-paper)] flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-[var(--kz-ink)]">{i.name}</span>
                  <Badge color={i.is_active ? 'green' : 'cream'} size="sm">{i.is_active ? 'Actif' : 'Inactif'}</Badge>
                  <Badge color="violet" size="sm">{PROVIDER_OPTIONS.find(p => p.value === i.provider)?.label ?? i.provider}</Badge>
                  <Badge color="blue" size="sm">{i.consent_category}</Badge>
                </div>
                {i.description && <p className="text-xs text-[var(--kz-mute)]">{i.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button kind="ghost" size="sm" icon={<History size={13} />} onClick={() => openHistory(i.id)} />
                <Button kind={i.is_active ? 'outline' : 'primary'} size="sm" onClick={() => toggleActive(i)}>
                  {i.is_active ? 'Désactiver' : 'Activer'}
                </Button>
                <Button kind="ghost" size="sm" onClick={() => openEdit(i)}>Modifier</Button>
                <button onClick={() => handleDelete(i)} className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-red-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création / édition */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifier l\'intégration' : 'Nouvelle intégration'} size="lg">
        <div className="flex flex-col gap-4">
          <Input label="Nom" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex : LinkedIn Insight — site public" />
          <Textarea label="Description (optionnel)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />

          <Select label="Fournisseur" options={PROVIDER_OPTIONS} value={form.provider}
            onChange={e => { setForm(f => ({ ...f, provider: e.target.value })); setConfirmCustom(false) }} />

          {form.provider !== 'custom' ? (
            <Input label="Identifiant" value={form.identifier} onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
              placeholder={form.provider === 'ga4' ? 'G-XXXXXXX' : form.provider === 'gtm' ? 'GTM-XXXXXXX' : 'Identifiant fourni par le partenaire'} />
          ) : (
            <>
              <div className="p-3 rounded-lg border flex items-start gap-2" style={{ borderColor: '#E54E4E', background: '#FFEAEA' }}>
                <AlertTriangle size={15} color="#E54E4E" className="shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--kz-ink)]">
                  Un script personnalisé s&apos;exécute directement dans le navigateur des visiteurs. Toute erreur ou code malveillant
                  affecte immédiatement le site en production. Réservé aux cas où aucun fournisseur structuré ne convient.
                </p>
              </div>
              <Textarea label="Code du script" value={form.customCode} onChange={e => setForm(f => ({ ...f, customCode: e.target.value }))} rows={6}
                placeholder="<script>...</script> ou JS brut" />
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--kz-ink)] cursor-pointer">
                <input type="checkbox" checked={confirmCustom} onChange={e => setConfirmCustom(e.target.checked)} />
                Je confirme avoir vérifié ce script et j&apos;assume le risque de son exécution en production.
              </label>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Emplacement" options={PLACEMENT_OPTIONS} value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value }))} />
            <Select label="Environnement" options={ENV_OPTIONS} value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))} />
            <Select label="Catégorie de consentement" options={CONSENT_OPTIONS} value={form.consentCategory} onChange={e => setForm(f => ({ ...f, consentCategory: e.target.value }))} />
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--kz-ink)] cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Activer immédiatement
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button kind="outline" full onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button kind="primary" full loading={saving} onClick={handleSubmit}>{editingId ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal historique */}
      <Modal open={!!historyId} onClose={() => setHistoryId(null)} title="Historique des versions">
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {versions.length === 0 ? (
            <p className="text-sm text-[var(--kz-mute)]">Aucune version enregistrée.</p>
          ) : versions.map(v => (
            <div key={v.id} className="p-3 rounded-lg border border-[var(--kz-line)] flex items-center justify-between gap-3">
              <div>
                <span className="text-sm font-semibold text-[var(--kz-ink)]">Version {v.version}</span>
                <p className="text-xs text-[var(--kz-mute)]">{new Date(v.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <Button kind="outline" size="sm" onClick={() => handleRollback(v.id)}>Restaurer</Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
