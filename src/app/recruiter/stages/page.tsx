'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Edit, Trash2, ToggleLeft, ToggleRight, Users, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import type { Job } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import { KZ } from '@/lib/constants'

export default function RecruiterStagesPage() {
  const { profile } = useAuth()
  const [stages, setStages] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStages = async () => {
    if (!profile) return
    try {
      const res = await fetch('/api/recruiter/jobs')
      if (res.ok) {
        const all = (await res.json()) as Job[]
        setStages(all.filter((j) => j.job_type === 'Stage'))
      }
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { if (profile) fetchStages() }, [profile])

  const toggleActive = async (job: Job) => {
    const res = await fetch(`/api/recruiter/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: job.is_active ? 'pause' : 'publish' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Action impossible.')
    }
    fetchStages()
  }

  const deleteStage = async (id: string) => {
    if (!confirm('Supprimer ce stage ?')) return
    await fetch(`/api/recruiter/jobs/${id}`, { method: 'DELETE' })
    fetchStages()
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--kz-ink)]">Mes stages</h1>
          <p className="text-sm text-[var(--kz-mute)] mt-0.5">{stages.length} offre{stages.length !== 1 ? 's' : ''} de stage</p>
        </div>
        <Link href="/recruiter/stages/new">
          <Button kind="primary" size="md" icon={<Plus size={15} />}>Publier un stage</Button>
        </Link>
      </div>

      {stages.length === 0 ? (
        <EmptyState
          title="Aucun stage publié"
          description="Publiez une offre de stage pour recevoir des candidatures d'étudiants et de personnes en reconversion à La Réunion."
          icon={<ClipboardList size={28} />}
          action={
            <Link href="/recruiter/stages/new">
              <Button kind="primary">Publier un stage</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {stages.map((stage) => (
            <div key={stage.id} className="kz-card p-4 bg-[var(--kz-paper)]">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--kz-edge)]"
                      style={{ background: KZ.violetSoft, color: KZ.violet }}
                    >
                      Stage
                    </span>
                    <Badge color={stage.is_active ? 'green' : 'cream'} size="sm">
                      {stage.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                    {stage.internship_paid === true && (
                      <Badge color="blue" size="sm">Gratifié</Badge>
                    )}
                  </div>
                  <Link
                    href={`/stages/${stage.id}`}
                    className="text-base font-bold text-[var(--kz-ink)] hover:text-[var(--kz-orange)] transition-colors"
                    target="_blank"
                  >
                    {stage.title}
                  </Link>
                  <div className="text-xs text-[var(--kz-mute)] mt-0.5 flex flex-wrap gap-3">
                    <span>{stage.location}</span>
                    {stage.internship_duration && (
                      <span>{stage.internship_duration}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={11} />{stage.applications_count} candidature{stage.applications_count !== 1 ? 's' : ''}
                    </span>
                    <span><Eye size={11} className="inline mr-1" />{stage.views} vue{stage.views !== 1 ? 's' : ''}</span>
                    <span>Publié {timeAgo(stage.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(stage)}
                    className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-[var(--kz-edge)] transition-all"
                    title={stage.is_active ? 'Mettre en pause' : 'Activer'}
                  >
                    {stage.is_active
                      ? <ToggleRight size={16} color={KZ.green} />
                      : <ToggleLeft size={16} color="var(--kz-mute)" />}
                  </button>
                  <Link href={`/recruiter/jobs/${stage.id}/edit`}>
                    <button className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-[var(--kz-edge)] transition-all">
                      <Edit size={15} color="var(--kz-mute)" />
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteStage(stage.id)}
                    className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-red-300 transition-all"
                  >
                    <Trash2 size={15} color="#E54E4E" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
