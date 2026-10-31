'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Users, TrendingUp, Briefcase, BarChart2, Trophy, Swords, ScrollText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { KazaScoreCard } from '@/components/ui/KazaScoreBadge'
import { useAuth } from '@/features/auth/useAuth'
import { APPLICATION_STATUSES } from '@/lib/constants'
import type { Application, Job, BadgeColor } from '@/lib/types'
import { QuestHeader, PanelTitle, toneStyle } from '@/components/quest/recruteur/QuestChrome'
import { TrophyStat } from '@/components/quest/recruteur/TrophyStat'
import { ROMAN, STAGE_META, type AppStatus } from '@/components/quest/recruteur/hero'

const WEEKS = 8
const WEEK_MS = 7 * 86_400_000

export default function RecruiterAnalyticsPage() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    const run = async () => {
      try {
        const [jr, ar] = await Promise.all([
          fetch('/api/recruiter/jobs'),
          fetch('/api/applications?scope=recruiter'),
        ])
        setJobs(jr.ok ? ((await jr.json()) as Job[]) : [])
        setApps(ar.ok ? ((await ar.json()) as Application[]) : [])
      } catch { /* noop */ }
      setLoading(false)
    }
    run()
  }, [profile?.id])

  if (loading) return <PageLoader />

  const activeJobs = jobs.filter((j) => j.is_active)
  const totalViews = jobs.reduce((s, j) => s + (j.views ?? 0), 0)
  const totalApps = apps.length
  const conversion = totalViews > 0 ? `${((totalApps / totalViews) * 100).toFixed(1)}%` : '—'

  // Répartition par statut (pipeline complet)
  const statusCounts: Record<string, number> = {}
  apps.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1 })

  // Candidatures reçues sur les 8 dernières semaines
  const now = Date.now()
  const buckets = Array.from({ length: WEEKS }, () => 0)
  apps.forEach((a) => {
    const idx = Math.floor((now - new Date(a.created_at).getTime()) / WEEK_MS)
    if (idx >= 0 && idx < WEEKS) buckets[WEEKS - 1 - idx]++
  })
  const maxWeek = Math.max(1, ...buckets)
  const treatedRatio = totalApps > 0 ? (totalApps - (statusCounts.pending ?? 0)) / totalApps : null

  // Top offres par nombre de candidatures
  const topJobs = [...jobs]
    .sort((a, b) => (b.applications_count ?? 0) - (a.applications_count ?? 0))
    .slice(0, 5)

  if (jobs.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto">
        <Header />
        <EmptyState
          title="Pas encore de données"
          description="Publiez votre première offre pour commencer à suivre vos performances de recrutement."
          icon={<BarChart2 size={28} />}
          action={<Link href="/recruteur/offres/nouvelle"><Button kind="primary">Publier une offre</Button></Link>}
        />
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <Header />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <TrophyStat label="Vues totales" value={totalViews.toLocaleString('fr-FR')} icon={<Eye size={14} />} tone="var(--qx-neon)" hint="Toutes offres confondues" />
        <TrophyStat label="Candidatures" value={totalApps} icon={<Users size={14} />} tone="var(--qx-magenta)" delay={0.06}
          ratio={treatedRatio}
          hint={treatedRatio !== null ? `${Math.round(treatedRatio * 100)} % traitées` : undefined} />
        <TrophyStat label="Taux de conversion" value={conversion} icon={<TrendingUp size={14} />} tone="var(--qx-gold)" delay={0.12}
          ratio={totalViews > 0 ? totalApps / totalViews : null} hint="Candidatures par vue" />
        <TrophyStat label="Offres actives" value={activeJobs.length} icon={<Briefcase size={14} />} tone="var(--kz-green)" delay={0.18}
          ratio={jobs.length > 0 ? activeJobs.length / jobs.length : null} hint={`sur ${jobs.length} offre(s)`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        {/* Évolution candidatures */}
        <div className="qx-panel p-5 qx-rise min-w-0" style={{ animationDelay: '0.1s' }}>
          <PanelTitle icon={<BarChart2 size={16} />} title="Candidatures reçues" hint="8 dernières semaines" />
          <div className="flex items-end gap-2 h-40">
            {buckets.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="text-[11px] font-bold text-white tabular-nums">{count > 0 ? count : ''}</div>
                <div
                  className="w-full rounded-t-md border transition-all"
                  style={{
                    height: `${Math.max(4, (count / maxWeek) * 120)}px`,
                    background: i === WEEKS - 1 ? 'var(--qx-legend)' : 'linear-gradient(180deg, rgba(232,121,249,0.75), rgba(124,58,237,0.35))',
                    borderColor: i === WEEKS - 1 ? '#FDE68A' : 'rgba(192,132,252,0.45)',
                    boxShadow: i === WEEKS - 1 ? '0 0 18px -4px var(--qx-gold)' : '0 0 14px -6px var(--qx-magenta)',
                  }}
                  title={`${count} candidature(s)`}
                />
                <div className="text-[10px] text-[var(--kz-mute)]">S-{WEEKS - 1 - i}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par statut */}
        <div className="qx-panel p-5 qx-rise min-w-0" style={{ animationDelay: '0.16s' }}>
          <PanelTitle icon={<Swords size={16} />} title="Répartition par statut" />
          {totalApps === 0 ? (
            <p className="text-xs text-[var(--kz-mute)] py-3 text-center">Aucune candidature pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {Object.entries(APPLICATION_STATUSES).map(([key, info]) => {
                const count = statusCounts[key] ?? 0
                const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-28 shrink-0">
                      <Badge color={info.color as BadgeColor} size="sm">{info.label}</Badge>
                    </div>
                    <div className="qxr-xp-mini flex-1 h-2.5" style={toneStyle(STAGE_META[key as AppStatus]?.tone ?? 'var(--qx-neon)')}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs font-bold text-white w-8 text-right tabular-nums">{count}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top offres */}
      <div className="qx-panel p-5 mt-5 qx-rise" style={{ animationDelay: '0.22s' }}>
        <PanelTitle icon={<Trophy size={16} />} title="Offres les plus performantes" hint="Le tableau d'honneur de vos quêtes" />
        <ol className="flex flex-col gap-2">
          {topJobs.map((job, rank) => (
            <li key={job.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-xl border border-[#C084FC]/15 bg-[rgba(12,5,24,0.45)]">
              <span aria-label={`Rang ${rank + 1}`} className={`w-8 text-center text-[15px] font-bold shrink-0 font-[family-name:var(--font-epic)] ${rank === 0 ? 'qx-text-legend' : 'text-[var(--kz-mute)]'}`}>{ROMAN[rank]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{job.title}</div>
                <div className="text-xs text-[var(--kz-mute)]">{job.location} · {job.job_type}</div>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-center ml-auto">
                <div>
                  <div className="text-sm font-extrabold text-white tabular-nums">{job.views ?? 0}</div>
                  <div className="text-[10px] text-[var(--kz-mute)]">vues</div>
                </div>
                <div>
                  <div className="text-sm font-extrabold text-white tabular-nums">{job.applications_count ?? 0}</div>
                  <div className="text-[10px] text-[var(--kz-mute)]">cand.</div>
                </div>
                <Badge color={job.is_active ? 'green' : 'cream'} size="sm">{job.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Réactivité (KazaScore) */}
      {profile?.id && (
        <div className="mt-5 max-w-[420px]">
          <KazaScoreCard recruiterId={profile.id} />
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
    <QuestHeader
      eyebrow="Analytics"
      icon={<ScrollText size={18} />}
      title={<>Les chroniques de la <span className="qx-text-arcane">guilde</span></>}
      subtitle="Vos performances de recrutement : vues, candidatures, conversion et réactivité — en temps réel."
    />
  )
}
