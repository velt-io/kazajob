'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { EmptyState } from '@/components/feedback/EmptyState'
import type { Job } from '@/lib/types'
import { KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'

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
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[30px] font-bold text-white leading-tight mb-1">Gestion des stages</h1>
          <p className="text-sm text-[var(--kz-mute)]">{stages.length} offre{stages.length !== 1 ? 's' : ''} de stage</p>
        </div>
      </div>

      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par titre, ville ou entreprise..."
        />
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState
          title={search ? 'Aucun résultat' : 'Aucun stage publié'}
          icon={<ClipboardList size={28} />}
        />
      ) : (
        <div className="qxr-table-wrap">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--kz-line)]" style={{ background: KZ.cream2 }}>
                {['Titre', 'Entreprise', 'Ville', 'Durée', 'Statut', 'Candidatures', 'Publié', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[var(--kz-mute)] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((stage) => (
                <tr key={stage.id} className="border-b border-[var(--kz-line)] last:border-0 hover:bg-[var(--kz-cream2)] transition-colors">
                  <td className="px-4 py-3 max-w-[200px]">
                    <Link href={`/stages/${stage.id}`} target="_blank"
                      className="text-sm font-semibold text-[var(--kz-ink)] hover:text-[var(--kz-orange)] line-clamp-2">
                      {stage.title}
                    </Link>
                    {stage.sector && <div className="text-xs text-[var(--kz-mute)]">{stage.sector}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--kz-text)] max-w-[140px]">
                    {(stage.company as { name?: string } | undefined)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--kz-text)]">{stage.location}</td>
                  <td className="px-4 py-3 text-sm text-[var(--kz-text)]">
                    {stage.internship_duration ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={stage.is_active ? 'green' : 'cream'} size="sm">
                      {stage.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--kz-text)] text-center">
                    {stage.applications_count}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--kz-mute)] whitespace-nowrap">
                    {timeAgo(stage.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleActive(stage)}
                        className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-[var(--kz-edge)] transition-all"
                        title={stage.is_active ? 'Désactiver' : 'Activer'}>
                        {stage.is_active
                          ? <EyeOff size={14} color="var(--kz-mute)" />
                          : <Eye size={14} color={KZ.green} />}
                      </button>
                      <button onClick={() => deleteStage(stage.id)}
                        className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-red-300 transition-all">
                        <Trash2 size={14} color="#E54E4E" />
                      </button>
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
