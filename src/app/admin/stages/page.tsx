'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Eye, EyeOff, Trash2 } from 'lucide-react'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import type { Job } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import { ACCENT, EmptyPanel, IconButton, PageHeader, SearchField, StatusPill } from '@/components/os/recruiter/primitives'

export default function AdminStagesPage() {
  const [stages, setStages] = useState<Job[]>([])
  const [filtered, setFiltered] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/admin/jobs')
      if (res.ok) {
        const all = (await res.json()) as Job[]
        const s = all.filter((j) => j.job_type === 'Stage')
        setStages(s)
        setFiltered(s)
      }
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchStages() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(q ? stages.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      s.location?.toLowerCase().includes(q) ||
      (s.company as { name?: string } | undefined)?.name?.toLowerCase().includes(q)
    ) : stages)
  }, [search, stages])

  // Masquer une offre en ligne = la suspendre (le recruteur ne peut plus la remettre en ligne).
  const toggleActive = async (job: Job) => {
    const active = !job.is_active
    if (!active && !confirm('Suspendre cette offre ? Elle sera retirée du site et le recruteur ne pourra pas la remettre en ligne.')) return
    const res = await fetch(`/api/admin/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Action impossible.')
      return
    }
    setStages((prev) => prev.map((j) => j.id === job.id
      ? { ...j, is_active: active, status: active ? 'published' : 'suspended' }
      : j))
  }

  const deleteStage = async (id: string) => {
    if (!confirm('Supprimer ce stage ? Cette action est irréversible.')) return
    await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
    setStages((prev) => prev.filter((j) => j.id !== id))
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader
        eyebrow="Modération"
        title="Gestion des stages"
        subtitle={`${stages.length} offre${stages.length !== 1 ? 's' : ''} de stage`}
        actions={
          <SearchField value={search} onChange={setSearch} placeholder="Titre, ville ou entreprise..." className="w-full sm:w-80" />
        }
      />

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel title={search ? 'Aucun résultat' : 'Aucun stage publié'} icon={<ClipboardList size={26} />} accent={ACCENT.teal} />
        </div>
      ) : (
        <div className="osr-table-wrap">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr>
                {['Titre', 'Entreprise', 'Ville', 'Durée', 'Statut', 'Candidatures', 'Publié', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left uppercase">{h || <span className="sr-only">Actions</span>}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((stage) => (
                <tr key={stage.id}>
                  <td className="px-4 py-2.5 max-w-[220px]">
                    <Link href={`/stages/${stage.id}`} target="_blank"
                      className="text-sm font-semibold text-white hover:text-[var(--kz-blue)] transition-colors line-clamp-2">
                      {stage.title}
                    </Link>
                    {stage.sector && <div className="text-[12px] text-[var(--kz-mute)]">{stage.sector}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--kz-text)] max-w-[160px]">
                    {(stage.company as { name?: string } | undefined)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--kz-text)]">{stage.location}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--kz-text)]">{stage.internship_duration ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill accent={stage.is_active ? ACCENT.green : ACCENT.mute} live={stage.is_active}>
                      {stage.is_active ? 'Actif' : 'Inactif'}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-2.5 text-[13px] text-white text-center font-semibold">{stage.applications_count}</td>
                  <td className="px-4 py-2.5 text-[12px] text-[var(--kz-mute)] whitespace-nowrap">{timeAgo(stage.created_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-0.5 justify-end">
                      <IconButton label={stage.is_active ? 'Désactiver' : 'Activer'} onClick={() => toggleActive(stage)} tone={stage.is_active ? undefined : 'accent'}>
                        {stage.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                      </IconButton>
                      <IconButton label="Supprimer" tone="danger" onClick={() => deleteStage(stage.id)}>
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
