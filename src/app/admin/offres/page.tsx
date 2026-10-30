'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Eye, EyeOff, Trash2, Plus, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { EmptyState } from '@/components/feedback/EmptyState'
import type { Job } from '@/lib/types'
import { KZ } from '@/lib/constants'
import { timeAgo, formatSalary } from '@/lib/utils'
import { JOB_STATUS_META, resolveJobStatus } from '@/lib/job-lifecycle'

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/admin/jobs')
      if (res.ok) setJobs((await res.json()) as Job[])
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchJobs() }, [])

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
    setJobs((prev) => prev.map((j) => j.id === job.id
      ? { ...j, is_active: active, status: active ? 'published' : 'suspended' }
      : j))
  }

  const deleteJob = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return
    await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="kz-h2 text-[var(--kz-ink)] mb-1">Gestion des offres</h1>
          <p className="text-sm text-[var(--kz-mute)]">{jobs.length} offre(s) au total</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/offres/nouvelle"><Button kind="primary" size="md" icon={<Plus size={15} />}>Annonce emploi</Button></Link>
          <Link href="/admin/formations/nouvelle"><Button kind="outline" size="md" icon={<GraduationCap size={15} />}>Annonce formation</Button></Link>
        </div>
      </div>

      {loading ? <PageLoader /> : jobs.length === 0 ? (
        <EmptyState title="Aucune offre" icon={<Briefcase size={28} />} />
      ) : (
        <div className="kz-card bg-[var(--kz-paper)] overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--kz-line)]" style={{ background: KZ.cream2 }}>
                {['Titre', 'Entreprise', 'Lieu', 'Salaire', 'Statut', 'Publie', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[var(--kz-mute)] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-[var(--kz-line)] last:border-0 hover:bg-[var(--kz-cream2)] transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-[var(--kz-ink)] max-w-[200px] truncate">{job.title}</td>
                  <td className="px-4 py-3 text-sm text-[var(--kz-mute)]">{job.company?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--kz-mute)]">{job.location}</td>
                  <td className="px-4 py-3 text-sm text-[var(--kz-mute)]">{formatSalary(job.salary_min, job.salary_max)}</td>
                  <td className="px-4 py-3">
                    <Badge color={JOB_STATUS_META[resolveJobStatus(job)].color} size="sm">
                      {JOB_STATUS_META[resolveJobStatus(job)].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--kz-mute)]">{timeAgo(job.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleActive(job)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--kz-cream2)] text-[var(--kz-mute)] hover:text-[var(--kz-ink)]"
                        title={job.is_active ? 'Suspendre' : 'Publier / rétablir'} aria-label={job.is_active ? 'Suspendre' : 'Publier / rétablir'}>
                        {job.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => deleteJob(job.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[var(--kz-mute)] hover:text-red-600">
                        <Trash2 size={14} />
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
