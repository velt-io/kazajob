'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Bug, AlertTriangle, Paperclip, Trash2 } from 'lucide-react'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { ACCENT, EmptyPanel, IconButton, PageHeader, Segmented, StatusPill, tint } from '@/components/os/recruiter/primitives'
import { OSR_SELECT } from '@/components/os/recruiter/admin-ui'

interface BugReport {
  id: string
  reporterName: string | null
  reporterEmail: string | null
  reporterRole: string | null
  page: string
  message: string
  attachmentUrl: string | null
  severity: 'normal' | 'critical'
  status: 'open' | 'in_progress' | 'resolved'
  createdAt: string
}

const STATUS_LABELS: Record<string, { label: string; accent: string }> = {
  open:        { label: 'Ouvert',     accent: ACCENT.orange },
  in_progress: { label: 'En cours',   accent: ACCENT.violet },
  resolved:    { label: 'Résolu',     accent: ACCENT.green  },
}

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'open', label: 'Ouverts' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'resolved', label: 'Résolus' },
]

export default function AdminBugReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    try {
      const res = await fetch('/api/admin/bug-reports')
      if (res.ok) setReports((await res.json()) as BugReport[])
    } catch { /* noop */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const setStatus = async (id: string, status: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: status as BugReport['status'] } : r))
    await fetch(`/api/admin/bug-reports/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce signalement ?')) return
    setReports((prev) => prev.filter((r) => r.id !== id))
    await fetch(`/api/admin/bug-reports/${id}`, { method: 'DELETE' })
  }

  const shown = reports.filter((r) => filter === 'all' || r.status === filter)
  const openCount = reports.filter((r) => r.status === 'open').length
  const criticalCount = reports.filter((r) => r.severity === 'critical' && r.status !== 'resolved').length

  return (
    <div className="max-w-[1000px] mx-auto">
      <PageHeader
        eyebrow="Support"
        title="Signalements de bug"
        subtitle={<>
          {openCount} ouvert{openCount > 1 ? 's' : ''}
          {criticalCount > 0 && <span className="font-semibold text-[var(--kz-orange)]"> · {criticalCount} bloquant{criticalCount > 1 ? 's' : ''}</span>}
        </>}
        actions={
          <Segmented ariaLabel="Filtrer par statut" value={filter} onChange={setFilter}
            items={FILTERS.map((f) => ({ id: f.id, label: f.label }))} />
        }
      />

      {loading ? <PageLoader /> : shown.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel title="Aucun signalement" description="Les bugs signalés par les candidats et recruteurs apparaîtront ici." icon={<Bug size={26} />} accent={ACCENT.violet} />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((r, i) => {
            const critical = r.severity === 'critical'
            const hot = critical && r.status !== 'resolved'
            const accent = critical ? ACCENT.orange : ACCENT.violet
            return (
              <div key={r.id} className="osr-panel osr-in p-4"
                style={{ '--i': i, ...(hot ? { borderColor: 'color-mix(in srgb, var(--kz-orange) 55%, transparent)', boxShadow: '0 0 40px -18px var(--kz-orange)' } : {}) } as CSSProperties}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: tint(accent, 18), color: accent }}>
                      {critical ? <AlertTriangle size={16} /> : <Bug size={16} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {critical && <StatusPill accent={ACCENT.orange} live={hot}>Bloquant</StatusPill>}
                        <code className="text-[12px] text-white font-semibold break-all">{r.page}</code>
                        <span className="text-[11px] text-[var(--kz-mute)]">· {new Date(r.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[14px] text-[var(--kz-text)] leading-relaxed whitespace-pre-wrap break-words">{r.message}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap text-[12px] text-[var(--kz-mute)]">
                        <span className="break-all">{r.reporterName ?? 'Anonyme'} ({r.reporterRole ?? '—'}) · {r.reporterEmail ?? '—'}</span>
                        {r.attachmentUrl && (
                          <a href={r.attachmentUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 font-semibold text-[var(--kz-blue)] hover:brightness-125">
                            <Paperclip size={12} />Pièce jointe
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    <StatusPill accent={STATUS_LABELS[r.status].accent}>{STATUS_LABELS[r.status].label}</StatusPill>
                    <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} aria-label="Changer le statut" className={OSR_SELECT}>
                      <option value="open">Ouvert</option>
                      <option value="in_progress">En cours</option>
                      <option value="resolved">Résolu</option>
                    </select>
                    <IconButton label="Supprimer" tone="danger" onClick={() => remove(r.id)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
