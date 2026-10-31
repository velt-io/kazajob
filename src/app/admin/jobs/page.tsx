'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Briefcase, Eye, EyeOff, Trash2, Plus, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import type { Job } from '@/lib/types'
import { timeAgo, formatSalary } from '@/lib/utils'
import { JOB_STATUS_META, resolveJobStatus } from '@/lib/job-lifecycle'
import { ACCENT, BADGE_ACCENT, EmptyPanel, IconButton, PageHeader, StatusPill } from '@/components/os/recruiter/primitives'

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
    <div className="max-w-[1100px] mx-auto">
      <PageHeader
        eyebrow="Modération"
        title="Gestion des offres"
        subtitle={`${jobs.length} offre(s) au total`}
        actions={<>
          <Link href="/admin/jobs/new"><Button kind="primary" size="md" icon={<Plus size={15} />}>Annonce emploi</Button></Link>
          <Link href="/admin/trainings/new"><Button kind="outline" size="md" icon={<GraduationCap size={15} />}>Annonce formation</Button></Link>
        </>}
      />

      {loading ? <PageLoader /> : jobs.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel icon={<Briefcase size={26} />} title="Aucune offre" accent={ACCENT.orange} />
        </div>
      ) : (
        <div className="osr-table-wrap">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr>
                {['Titre', 'Entreprise', 'Lieu', 'Salaire', 'Statut', 'Publiée', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left uppercase">{h || <span className="sr-only">Actions</span>}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const meta = JOB_STATUS_META[resolveJobStatus(job)]
                return (
                  <tr key={job.id} className="group">
                    <td className="px-4 py-2.5 text-sm font-semibold text-white max-w-[220px] truncate">{job.title}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[var(--kz-text)]">{job.company?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[var(--kz-mute)]">{job.location}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[var(--kz-mute)]">{formatSalary(job.salary_min, job.salary_max)}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill accent={BADGE_ACCENT[meta.color]} live={resolveJobStatus(job) === 'published'}>{meta.label}</StatusPill>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[var(--kz-mute)]">{timeAgo(job.created_at)}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-0.5 justify-end">
                        <IconButton label={job.is_active ? 'Suspendre' : 'Publier / rétablir'} onClick={() => toggleActive(job)}>
                          {job.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                        </IconButton>
                        <IconButton label="Supprimer" tone="danger" onClick={() => deleteJob(job.id)}>
                          <Trash2 size={15} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
