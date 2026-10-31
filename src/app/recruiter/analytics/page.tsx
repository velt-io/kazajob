'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Eye, Users, TrendingUp, Briefcase, BarChart2, ArrowUpRight, ArrowDownRight, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { KazaScoreCard } from '@/components/ui/KazaScoreBadge'
import { useAuth } from '@/features/auth/useAuth'
import { APPLICATION_STATUSES } from '@/lib/constants'
import type { Application, Job } from '@/lib/types'
import { ACCENT, APP_STATUS_ACCENT, CountUp, EmptyPanel, Gauge, PageHeader, Sparkline, StatusPill, Widget, accentStyle, tint } from '@/components/os/recruiter/primitives'
import { stagger } from '@/components/os/recruiter/secondary-ui'

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
  const conversionPct = totalViews > 0 ? (totalApps / totalViews) * 100 : 0

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
  const thisWeek = buckets[WEEKS - 1]
  const lastWeek = buckets[WEEKS - 2]
  const delta = thisWeek - lastWeek

  // Top offres par nombre de candidatures
  const topJobs = [...jobs]
    .sort((a, b) => (b.applications_count ?? 0) - (a.applications_count ?? 0))
    .slice(0, 5)
  const topMax = Math.max(1, ...topJobs.map((j) => j.applications_count ?? 0))

  if (jobs.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto">
        <Header />
        <div className="osr-panel">
          <EmptyPanel
            icon={<BarChart2 size={28} />}
            accent={ACCENT.blue}
            title="Pas encore de données"
            description="Publiez votre première offre pour commencer à suivre vos performances de recrutement."
            action={<Link href="/recruiter/jobs/new"><Button kind="primary">Publier une offre</Button></Link>}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <Header />

      {/* KPIs façon widgets Bourse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Kpi i={0} label="Vues totales" icon={<Eye size={14} />} accent={ACCENT.violet} value={<CountUp value={totalViews} />} />
        <Kpi i={1} label="Candidatures" icon={<Users size={14} />} accent={ACCENT.orange} value={<CountUp value={totalApps} />}
          foot={
            <span className={`inline-flex items-center gap-0.5 text-[12px] font-semibold ${delta > 0 ? 'text-[var(--kz-green)]' : delta < 0 ? 'text-[var(--osr-red)]' : 'text-[var(--kz-mute)]'}`}>
              {delta > 0 ? <ArrowUpRight size={13} /> : delta < 0 ? <ArrowDownRight size={13} /> : null}
              {delta > 0 ? '+' : ''}{delta} cette semaine
            </span>
          }
          chart={<Sparkline data={buckets} color={ACCENT.orange} height={36} label="Candidatures des 8 dernières semaines" />} />
        <Kpi i={2} label="Taux de conversion" icon={<TrendingUp size={14} />} accent={ACCENT.yellow} value={conversion}
          side={<Gauge value={Math.min(100, conversionPct * 5)} size={46} stroke={5} color={ACCENT.yellow} label={`Conversion ${conversion}`} />} />
        <Kpi i={3} label="Offres actives" icon={<Briefcase size={14} />} accent={ACCENT.green} value={<CountUp value={activeJobs.length} />}
          foot={<span className="text-[12px] text-[var(--kz-mute)]">sur {jobs.length} au total</span>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Évolution candidatures */}
        <Widget title="Candidatures reçues" sub="8 dernières semaines" accent={ACCENT.orange} icon={<BarChart2 size={14} />}>
          <div className="flex items-end gap-1.5 sm:gap-2.5 h-48 pt-4" role="list" aria-label="Candidatures par semaine">
            {buckets.map((count, i) => {
              const current = i === WEEKS - 1
              return (
                <div key={i} role="listitem" className="group flex-1 flex flex-col items-center justify-end gap-1.5 h-full min-w-0"
                  aria-label={`Semaine S-${WEEKS - 1 - i} : ${count} candidature(s)`}>
                  <div className="text-[11px] font-semibold tabular-nums text-[var(--kz-ink)] opacity-70 group-hover:opacity-100 transition-opacity">{count > 0 ? count : ''}</div>
                  <div
                    className="w-full rounded-[8px] origin-bottom animate-[slide-up_0.8s_cubic-bezier(0.2,0.8,0.2,1)_both] transition-[filter] group-hover:brightness-125"
                    style={{
                      height: `${Math.max(4, (count / maxWeek) * 140)}px`,
                      background: current
                        ? 'linear-gradient(180deg, var(--kz-orange), var(--osr-pink))'
                        : `linear-gradient(180deg, ${tint(ACCENT.violet, 55)}, ${tint(ACCENT.violet, 20)})`,
                      boxShadow: current ? `0 10px 30px -10px ${ACCENT.pink}` : undefined,
                      animationDelay: `${i * 60}ms`,
                    }}
                  />
                  <div className={`text-[10px] tabular-nums ${current ? 'text-white font-semibold' : 'text-[var(--kz-mute)]'}`}>S-{WEEKS - 1 - i}</div>
                </div>
              )
            })}
          </div>
        </Widget>

        {/* Répartition par statut */}
        <Widget title="Répartition par statut" sub={`${totalApps} candidature(s)`} accent={ACCENT.blue}>
          {totalApps === 0 ? (
            <p className="text-[13px] text-[var(--kz-mute)] py-6 text-center">Aucune candidature pour le moment.</p>
          ) : (
            <>
              {/* Barre empilée (Numbers) */}
              <div className="flex h-3 rounded-full overflow-hidden gap-[2px] mb-5 mt-2" aria-hidden>
                {Object.keys(APPLICATION_STATUSES).map((key) => {
                  const count = statusCounts[key] ?? 0
                  if (!count) return null
                  return <span key={key} style={{ flex: count, background: APP_STATUS_ACCENT[key] }} />
                })}
              </div>
              <div className="flex flex-col gap-3">
                {Object.entries(APPLICATION_STATUSES).map(([key, info], i) => {
                  const count = statusCounts[key] ?? 0
                  const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0
                  const accent = APP_STATUS_ACCENT[key] ?? ACCENT.mute
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-[128px] shrink-0"><StatusPill accent={accent}>{info.label}</StatusPill></div>
                      <div className="osr-bar flex-1 !h-1.5">
                        <span style={{ width: `${pct}%`, background: accent, ...stagger(i) }} />
                      </div>
                      <div className="text-[13px] font-semibold text-white tabular-nums w-8 text-right">{count}</div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Widget>
      </div>

      {/* Top offres */}
      <Widget title="Offres les plus performantes" icon={<Trophy size={14} />} accent={ACCENT.yellow} className="mt-4" bodyClassName="px-2 pb-2">
        <div className="osr-sep">
          {topJobs.map((job, i) => (
            <div key={job.id} className="osr-row osr-in flex items-center gap-3 px-3 py-3" style={stagger(i)}>
              <span className="w-7 text-center text-[17px] font-semibold tabular-nums shrink-0" style={{ color: i === 0 ? ACCENT.yellow : 'var(--kz-mute)' }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-white truncate">{job.title}</div>
                <div className="text-[12px] text-[var(--kz-mute)] truncate">{job.location} · {job.job_type}</div>
                <div className="osr-bar !h-1 mt-2 max-w-[260px]">
                  <span style={{ width: `${((job.applications_count ?? 0) / topMax) * 100}%`, background: 'var(--os-aurora)', ...stagger(i) }} />
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-center">
                <div>
                  <div className="text-[15px] font-semibold text-white tabular-nums">{job.views ?? 0}</div>
                  <div className="text-[10px] text-[var(--kz-mute)]">vues</div>
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-white tabular-nums">{job.applications_count ?? 0}</div>
                  <div className="text-[10px] text-[var(--kz-mute)]">cand.</div>
                </div>
                <StatusPill accent={job.is_active ? ACCENT.green : ACCENT.mute} className="hidden sm:inline-flex">{job.is_active ? 'Active' : 'Inactive'}</StatusPill>
              </div>
            </div>
          ))}
        </div>
      </Widget>

      {/* Réactivité (KazaScore) */}
      {profile?.id && (
        <div className="mt-4 max-w-[420px]">
          <KazaScoreCard recruiterId={profile.id} />
        </div>
      )}
    </div>
  )
}

function Kpi({ i, label, icon, accent, value, foot, chart, side }: {
  i: number
  label: string
  icon: ReactNode
  accent: string
  value: ReactNode
  foot?: ReactNode
  chart?: ReactNode
  side?: ReactNode
}) {
  return (
    <div className="osr-panel osr-glow osr-in p-4 sm:p-5 flex flex-col min-w-0" style={{ ...accentStyle(accent), ...stagger(i) }}>
      <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--kz-mute)]">
        <span className="w-6 h-6 rounded-[8px] flex items-center justify-center text-white shrink-0" style={{ background: accent }}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2 mt-3">
        <div className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.05em] leading-none text-white tabular-nums min-w-0 truncate">{value}</div>
        {side}
      </div>
      {foot && <div className="mt-1.5">{foot}</div>}
      {chart && <div className="mt-auto pt-3">{chart}</div>}
    </div>
  )
}

function Header() {
  return (
    <PageHeader
      eyebrow="Analytics"
      title={<>Vos <span className="os-text-aurora">performances</span> de recrutement</>}
      subtitle="Vues, candidatures, conversion et réactivité — en temps réel."
    />
  )
}
