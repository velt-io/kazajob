'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Edit, Trash2, Users, ClipboardList, MapPin, Clock, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Switch, Tooltip } from '@/components/ui/radix'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import type { Job } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import { ACCENT, EmptyPanel, IconButton, PageHeader, StatusPill, tint } from '@/components/os/recruiter/primitives'
import { MiniStat, stagger } from '@/components/os/recruiter/secondary-ui'

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

  const activeCount = stages.filter((s) => s.is_active).length

  return (
    <div className="max-w-[960px] mx-auto">
      <PageHeader
        eyebrow="Recrutement"
        title="Mes stages"
        subtitle={<>{stages.length} offre{stages.length !== 1 ? 's' : ''} de stage{stages.length > 0 && <> · <span className="text-[var(--kz-green)]">{activeCount} en ligne</span></>}</>}
        actions={
          <Link href="/recruteur/stages/nouveau">
            <Button kind="primary" size="md" icon={<Plus size={15} />}>Publier un stage</Button>
          </Link>
        }
      />

      {stages.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel
            icon={<ClipboardList size={28} />}
            accent={ACCENT.violet}
            title="Aucun stage publié"
            description="Publiez une offre de stage pour recevoir des candidatures d'étudiants et de personnes en reconversion à La Réunion."
            action={
              <Link href="/recruteur/stages/nouveau">
                <Button kind="primary">Publier un stage</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="osr-panel p-2 osr-sep">
          {stages.map((stage, i) => (
            <div key={stage.id} className="osr-row osr-in flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-3 px-3 py-3.5" style={stagger(i)}>
              <span className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0 text-white"
                style={{ background: stage.is_active ? `linear-gradient(145deg, ${ACCENT.violet}, ${ACCENT.indigo})` : tint(ACCENT.mute, 30) }}>
                <ClipboardList size={18} />
              </span>

              <div className="flex-1 min-w-0 basis-[calc(100%-60px)] sm:basis-auto">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link
                    href={`/stages/${stage.id}`}
                    target="_blank"
                    className="group/t inline-flex items-center gap-1 text-[15px] font-semibold text-white hover:text-[var(--kz-blue)] transition-colors min-w-0"
                  >
                    <span className="truncate">{stage.title}</span>
                    <ArrowUpRight size={13} className="shrink-0 opacity-0 group-hover/t:opacity-100 transition-opacity" />
                  </Link>
                  <StatusPill accent={stage.is_active ? ACCENT.green : ACCENT.mute} live={stage.is_active}>
                    {stage.is_active ? 'Actif' : 'Inactif'}
                  </StatusPill>
                  {stage.internship_paid === true && <StatusPill accent={ACCENT.blue}>Gratifié</StatusPill>}
                </div>
                <div className="text-[12px] text-[var(--kz-mute)] flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1"><MapPin size={11} />{stage.location}</span>
                  {stage.internship_duration && <span className="flex items-center gap-1"><Clock size={11} />{stage.internship_duration}</span>}
                  <span>Publié {timeAgo(stage.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <MiniStat value={stage.applications_count} label={`candidature${stage.applications_count !== 1 ? 's' : ''}`} icon={<Users size={9} />} />
                <MiniStat value={stage.views} label={`vue${stage.views !== 1 ? 's' : ''}`} icon={<Eye size={9} />} />
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <Tooltip content={stage.is_active ? 'Mettre en pause' : 'Activer'}>
                  <span className="inline-flex mr-1.5">
                    <Switch
                      checked={stage.is_active}
                      onCheckedChange={() => toggleActive(stage)}
                      aria-label={stage.is_active ? 'Mettre en pause' : 'Activer'}
                      className="scale-[0.8]"
                    />
                  </span>
                </Tooltip>
                <Tooltip content="Modifier">
                  <Link href={`/recruteur/offres/${stage.id}/modifier`} aria-label="Modifier" className="osr-icon-btn">
                    <Edit size={15} />
                  </Link>
                </Tooltip>
                <IconButton label="Supprimer" tone="danger" onClick={() => deleteStage(stage.id)}>
                  <Trash2 size={15} />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
