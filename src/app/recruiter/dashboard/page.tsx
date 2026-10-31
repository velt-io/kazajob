'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Users, Briefcase, TrendingUp, TrendingDown, Plus, ArrowRight, ChevronRight, CalendarDays, Video, Phone, MapPin, MessageCircle, Sparkles, Minus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { KazaScoreCard } from '@/components/ui/KazaScoreBadge'
import { LaunchBanner } from '@/components/recruiter/LaunchBanner'
import { useAuth } from '@/features/auth/useAuth'
import { useInterviews } from '@/features/interviews/useInterviews'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { Application, Job, Conversation } from '@/lib/types'
import {
  ACCENT, APP_STATUS_ACCENT, CountUp, Gauge, PageHeader, SkeletonList, Sparkline, StatusPill, Widget, tint,
} from '@/components/os/recruiter/primitives'

interface RecruiterStats { totalViews: number; totalApplications: number; activeJobs: number; conversionRate: string }

const DAYS = 14

/** Candidatures reçues par jour sur les 14 derniers jours (présentation uniquement). */
function dailySeries(apps: Application[]): number[] {
  const out = Array.from({ length: DAYS }, () => 0)
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (DAYS - 1))
  for (const a of apps) {
    const d = new Date(a.created_at); d.setHours(0, 0, 0, 0)
    const idx = Math.round((d.getTime() - start.getTime()) / 86_400_000)
    if (idx >= 0 && idx < DAYS) out[idx]++
  }
  return out
}

export default function RecruiterDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<RecruiterStats>({ totalViews: 0, totalApplications: 0, activeJobs: 0, conversionRate: '0%' })
  const [recentApps, setRecentApps] = useState<Application[]>([])
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pipelineCounts, setPipelineCounts] = useState({ pending: 0, viewed: 0, interview: 0, hired: 0 })
  const [series, setSeries] = useState<number[]>(() => Array.from({ length: DAYS }, () => 0))
  const [loading, setLoading] = useState(true)
  const { interviews, loading: interviewsLoading } = useInterviews()
  const [now] = useState(() => Date.now())
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    if (!profile?.id) return
    const fetchAll = async () => {
      try {
        const [jobsRes, appsRes, convsRes] = await Promise.all([
          fetch('/api/recruiter/jobs'),
          fetch('/api/applications?scope=recruiter'),
          fetch('/api/conversations'),
        ])
        const allJobs = jobsRes.ok ? ((await jobsRes.json()) as Job[]) : []
        const appsList = appsRes.ok ? ((await appsRes.json()) as Application[]) : []
        const convs = convsRes.ok ? ((await convsRes.json()) as Conversation[]) : []

        const jobsList = allJobs.filter(j => j.is_active).slice(0, 5)
        setActiveJobs(jobsList); setRecentApps(appsList.slice(0, 5)); setConversations(convs.slice(0, 5))
        setSeries(dailySeries(appsList))
        const totalViews = jobsList.reduce((s, j) => s + (j.views ?? 0), 0)
        setStats({ totalViews, totalApplications: appsList.length, activeJobs: jobsList.length, conversionRate: totalViews > 0 ? ((appsList.length / totalViews) * 100).toFixed(1) + '%' : '0%' })
        const counts = { pending: 0, viewed: 0, interview: 0, hired: 0 }
        appsList.forEach(a => { if (a.status in counts) counts[a.status as keyof typeof counts]++ })
        setPipelineCounts(counts)
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchAll()
  }, [profile?.id])

  const PIPELINE = [
    { label: 'Postulations', count: stats.totalApplications, accent: ACCENT.indigo },
    { label: 'Tri',          count: pipelineCounts.viewed,   accent: ACCENT.yellow },
    { label: 'Entretien',    count: pipelineCounts.interview, accent: ACCENT.blue },
    { label: 'Embauche',     count: pipelineCounts.hired,     accent: ACCENT.green },
  ]
  const pipelineMax = Math.max(1, ...PIPELINE.map((p) => p.count))

  // Tendance : 7 derniers jours vs 7 précédents
  const thisWeek = series.slice(7).reduce((a, b) => a + b, 0)
  const lastWeek = series.slice(0, 7).reduce((a, b) => a + b, 0)
  const trend = thisWeek - lastWeek
  const conversion = parseFloat(stats.conversionRate) || 0

  const upcoming = interviews
    .filter((i) => i.status !== 'cancelled' && i.status !== 'done' && new Date(i.scheduled_at).getTime() > now - 60 * 60 * 1000)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 3)

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="max-w-[1180px] mx-auto">
      <LaunchBanner />

      <PageHeader
        eyebrow={<><span className="capitalize">{today}</span>{firstName && <> · Bonjour {firstName}</>}</>}
        title={stats.totalApplications > 0
          ? <><span className="os-text-aurora"><CountUp value={stats.totalApplications} /></span> candidature{stats.totalApplications > 1 ? 's' : ''} reçue{stats.totalApplications > 1 ? 's' : ''}.</>
          : <>Publiez votre <span className="os-text-aurora">première offre</span>.</>}
        subtitle={pipelineCounts.pending > 0 ? `${pipelineCounts.pending} en attente de votre réponse.` : 'Votre activité de recrutement, en un coup d’œil.'}
        actions={<>
          <Link href="/recruiter/applications" className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[14px] font-semibold text-white bg-white/[0.08] border border-white/10 hover:bg-white/[0.14] transition-colors">
            <Users size={15} /> Candidatures
          </Link>
          <Link href="/recruiter/jobs/new" className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[14px] font-semibold text-white bg-[linear-gradient(120deg,var(--kz-orange),var(--osr-pink)_45%,var(--kz-violet))] shadow-[0_10px_30px_-10px_rgba(255,55,95,0.7)] hover:brightness-110 active:scale-[0.97] transition">
            <Plus size={16} /> Nouvelle offre
          </Link>
        </>}
      />

      {/* KPI façon « Bourse » */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
        <KpiTile i={0} label="Candidatures" sub="14 derniers jours" icon={<Users size={14} />} accent={ACCENT.orange}
          value={<CountUp value={stats.totalApplications} />}
          delta={trend}
          chart={<Sparkline data={series} color={trend < 0 ? ACCENT.red : ACCENT.green} height={40} label={`Candidatures par jour : ${series.join(', ')}`} />}
        />
        <KpiTile i={1} label="Vues" sub="offres actives" icon={<Eye size={14} />} accent={ACCENT.violet}
          value={<CountUp value={stats.totalViews} />}
          chart={<MiniBars values={activeJobs.map((j) => j.views ?? 0)} color={ACCENT.violet} />}
        />
        <KpiTile i={2} label="Offres actives" sub={activeJobs.length > 0 ? `${activeJobs.reduce((s, j) => s + (j.applications_count ?? 0), 0)} candidatures liées` : 'aucune en ligne'} icon={<Briefcase size={14} />} accent={ACCENT.green}
          value={<CountUp value={stats.activeJobs} />}
          chart={<Dots count={stats.activeJobs} color={ACCENT.green} />}
        />
        <KpiTile i={3} label="Conversion" sub="vues → candidatures" icon={<TrendingUp size={14} />} accent={ACCENT.yellow}
          value={<CountUp value={conversion} format={(n) => `${n.toFixed(1).replace('.', ',')} %`} />}
          chart={<div className="flex justify-end"><Gauge value={Math.min(100, conversion * 5)} size={44} stroke={5} color={ACCENT.yellow} label={`Conversion ${stats.conversionRate}`} /></div>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
        {/* Pipeline + candidatures récentes */}
        <Widget className="lg:col-span-7" title="Pipeline de recrutement" sub={`${stats.totalApplications} au total`} href="/recruiter/applications" linkLabel="Ouvrir le tableau">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {PIPELINE.map((s, i) => {
              const prev = i > 0 ? PIPELINE[i - 1].count : 0
              const rate = i > 0 && prev > 0 ? Math.round((s.count / prev) * 100) : null
              return (
                <div key={s.label} className="osr-inset p-3 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12px] font-medium text-[var(--kz-mute)] truncate">{s.label}</span>
                    {rate !== null && <span className="text-[10px] font-semibold tabular-nums" style={{ color: s.accent }}>{rate} %</span>}
                  </div>
                  <div className="text-[28px] font-semibold tracking-[-0.05em] text-white leading-none mt-1.5"><CountUp value={s.count} /></div>
                  <div className="osr-bar mt-3" style={{ height: 5 }}>
                    <span style={{ width: `${Math.max(4, (s.count / pipelineMax) * 100)}%`, background: s.accent, boxShadow: `0 0 10px ${tint(s.accent, 70)}`, ['--i' as string]: i }} />
                  </div>
                </div>
              )
            })}
          </div>

          <h3 className="text-[13px] font-semibold text-[var(--kz-mute)] mt-6 mb-1.5 px-1">Candidatures récentes</h3>
          {loading ? <SkeletonList rows={3} /> : recentApps.length === 0 ? (
            <p className="text-[14px] text-[var(--kz-mute)] px-1 py-4">Aucune candidature pour l’instant. Partagez vos offres pour attirer vos premiers talents.</p>
          ) : (
            <div className="-mx-2">
              {recentApps.map((app, i) => {
                const statusInfo = APPLICATION_STATUSES[app.status] ?? { label: app.status, color: 'cream' }
                const candidate = app.candidate as { full_name?: string; avatar_url?: string | null; avatar_config?: Record<string, string> | null } | undefined
                return (
                  <Link key={app.id} href="/recruiter/applications" className="osr-row osr-in flex items-center gap-3 px-2 py-2.5" style={{ ['--i' as string]: i }}>
                    <Avatar name={candidate?.full_name ?? 'Candidat'} src={candidate?.avatar_url} avatarConfig={candidate?.avatar_config} size={36} color={tint(ACCENT.indigo, 30)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-white truncate">{candidate?.full_name ?? 'Candidat'}</div>
                      <div className="osr-sub text-[12px] text-[var(--kz-mute)] truncate">{app.job?.title ?? '—'} · {timeAgo(app.created_at)}</div>
                    </div>
                    <StatusPill accent={APP_STATUS_ACCENT[app.status] ?? ACCENT.mute} className="hidden sm:inline-flex">{statusInfo.label}</StatusPill>
                    <ChevronRight size={15} className="text-[var(--kz-mute)] shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </Widget>

        {/* Prochains entretiens (Calendrier « À venir ») */}
        <Widget className="lg:col-span-5" title="À venir" sub="Prochains entretiens" icon={<CalendarDays size={14} />} accent={ACCENT.red} href="/recruiter/agenda" linkLabel="Agenda">
          {interviewsLoading ? <SkeletonList rows={3} height={64} className="mt-2" /> : upcoming.length === 0 ? (
            <div className="osr-inset mt-2 p-4 text-[14px] text-[var(--kz-mute)] leading-relaxed">
              Aucun entretien planifié. Depuis <Link href="/recruiter/applications" className="text-[var(--kz-blue)] font-medium">vos candidatures</Link>, proposez un créneau en deux clics.
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {upcoming.map((iv, i) => {
                const d = new Date(iv.scheduled_at)
                const end = new Date(d.getTime() + (iv.duration_min ?? 45) * 60_000)
                const time = (x: Date) => x.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                const isToday = d.toDateString() === new Date().toDateString()
                const TypeIcon = iv.type === 'video' ? Video : iv.type === 'phone' ? Phone : MapPin
                return (
                  <div key={iv.id} className="osr-inset osr-in flex items-stretch gap-3 p-3" style={{ ['--i' as string]: i }}>
                    <div className="w-12 shrink-0 text-center">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: isToday ? ACCENT.red : 'var(--kz-mute)' }}>
                        {isToday ? 'Auj.' : d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div className="text-[24px] font-semibold tracking-[-0.04em] text-white leading-none mt-0.5 tabular-nums">{d.getDate()}</div>
                    </div>
                    <span className="w-[3px] rounded-full shrink-0" style={{ background: iv.type === 'video' ? ACCENT.blue : iv.type === 'phone' ? ACCENT.green : ACCENT.orange }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-white truncate">{iv.candidate?.full_name ?? 'Candidat'}</div>
                      <div className="text-[12px] text-[var(--kz-mute)] truncate">{iv.job?.title ?? 'Entretien'}</div>
                      <div className="text-[12px] text-[var(--kz-text)] flex items-center gap-1.5 mt-1 tabular-nums">
                        <TypeIcon size={12} className="shrink-0" /> {time(d)} – {time(end)}
                      </div>
                    </div>
                    {iv.visio_link && (
                      <a href={iv.visio_link} target="_blank" rel="noreferrer" className="self-center inline-flex items-center h-7 px-3 rounded-full text-[12px] font-semibold text-white bg-[var(--kz-blue)] hover:brightness-110 shrink-0">
                        Rejoindre
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Widget>

        {/* Offres actives */}
        <Widget className="lg:col-span-4" title="Offres actives" icon={<Briefcase size={14} />} accent={ACCENT.green} href="/recruiter/jobs" linkLabel="Gérer">
          {loading ? <SkeletonList rows={3} height={48} /> : activeJobs.length === 0 ? (
            <div className="text-[14px] text-[var(--kz-mute)] py-3">
              Aucune offre en ligne. <Link href="/recruiter/jobs/new" className="font-medium text-[var(--kz-blue)]">Créer une offre</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-1">
              {activeJobs.slice(0, 4).map((job, i) => {
                const max = Math.max(1, ...activeJobs.map((j) => j.applications_count ?? 0))
                return (
                  <div key={job.id} className="min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[14px] font-medium text-white truncate">{job.title}</span>
                      <span className="text-[13px] font-semibold text-white tabular-nums shrink-0">{job.applications_count}<span className="text-[var(--kz-mute)] font-normal"> cand.</span></span>
                    </div>
                    <div className="osr-bar mt-1.5" style={{ height: 4 }}>
                      <span style={{ width: `${Math.max(3, ((job.applications_count ?? 0) / max) * 100)}%`, background: 'var(--os-aurora)', ['--i' as string]: i }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Widget>

        {/* Messages */}
        <Widget className="lg:col-span-4" title="Messages" icon={<MessageCircle size={14} />} accent={ACCENT.blue} href="/recruiter/messages" linkLabel="Tout voir" bodyClassName="px-3 pb-3">
          {conversations.length === 0 ? (
            <p className="text-[14px] text-[var(--kz-mute)] px-2 py-3">Aucun message.</p>
          ) : (
            <div>
              {conversations.slice(0, 3).map((conv) => {
                const candidate = conv.candidate as { full_name?: string; avatar_url?: string | null; avatar_config?: Record<string, string> | null } | undefined
                return (
                  <Link key={conv.id} href={`/recruiter/messages?c=${conv.id}`} className="osr-row flex items-center gap-3 px-2 py-2">
                    <Avatar name={candidate?.full_name ?? 'KZ'} src={candidate?.avatar_url} avatarConfig={candidate?.avatar_config} size={34} color={tint(ACCENT.blue, 30)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[14px] font-semibold text-white truncate">{candidate?.full_name}</span>
                        <span className="text-[11px] text-[var(--kz-mute)] shrink-0">{timeAgo(conv.last_message_at)}</span>
                      </div>
                      <div className="osr-sub text-[12px] text-[var(--kz-mute)] truncate">{conv.last_message?.content ?? conv.job?.title ?? 'Conversation'}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </Widget>

        {/* Conseil */}
        <div className="lg:col-span-4 relative overflow-hidden rounded-[26px] p-5 flex flex-col justify-between gap-4 min-h-[190px] border border-white/10"
          style={{ background: 'linear-gradient(140deg, #1E3A8A 0%, #5B21B6 55%, #BE185D 115%)' }}>
          <div aria-hidden className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[var(--kz-orange)] opacity-25 blur-3xl" />
          <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">
            <Sparkles size={13} /> Conseil
          </div>
          <p className="relative text-[18px] font-semibold tracking-[-0.02em] text-white leading-snug">
            {stats.activeJobs === 0 ? 'Publiez votre première offre pour commencer à recevoir des candidatures.' :
             stats.totalApplications === 0 ? 'Vos offres sont en ligne. Partagez-les pour attirer des candidats.' :
             `${pipelineCounts.pending} candidature(s) en attente de traitement.`}
          </p>
          <Link href="/recruiter/applications" className="relative self-start inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold text-black bg-white hover:bg-white/90 active:scale-[0.97] transition">
            Voir les candidatures <ArrowRight size={14} />
          </Link>
        </div>

        {/* KazaScore */}
        {profile?.id && (
          <div className="lg:col-span-12">
            <KazaScoreCard recruiterId={profile.id} />
          </div>
        )}
      </div>
    </div>
  )
}

function KpiTile({ i, label, sub, icon, accent, value, delta, chart }: {
  i: number
  label: string
  sub: string
  icon: React.ReactNode
  accent: string
  value: React.ReactNode
  delta?: number
  chart: React.ReactNode
}) {
  return (
    <div className="osr-in min-w-0" style={{ ['--i' as string]: i }}>
      <div data-tilt className="h-full rounded-[24px] os-glass p-4 lg:p-5 flex flex-col gap-3 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-[8px] flex items-center justify-center text-white shrink-0" style={{ background: accent }}>{icon}</span>
            <span className="text-[13px] font-medium text-[var(--kz-text)] truncate">{label}</span>
          </span>
          {delta !== undefined && (
            <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md text-[11px] font-semibold tabular-nums shrink-0"
              style={{ color: '#fff', background: delta > 0 ? ACCENT.green : delta < 0 ? ACCENT.red : 'var(--osr-fill-3)' }}
              aria-label={`Tendance sur 7 jours : ${delta > 0 ? '+' : ''}${delta}`}>
              {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </div>
        <div className="text-[30px] lg:text-[34px] font-semibold tracking-[-0.05em] leading-none text-white">{value}</div>
        <div className="mt-auto">
          {chart}
          <div className="text-[11px] text-[var(--kz-mute)] mt-1.5 truncate">{sub}</div>
        </div>
      </div>
    </div>
  )
}

function MiniBars({ values, color }: { values: number[]; color: string }) {
  const v = values.length ? values : [0, 0, 0, 0, 0]
  const max = Math.max(1, ...v)
  return (
    <div className="flex items-end gap-1 h-10" aria-hidden>
      {v.map((n, i) => (
        <span key={i} className="flex-1 h-full flex items-end">
          <span className="osr-grow-y w-full rounded-[4px]" style={{ height: `${Math.max(8, (n / max) * 100)}%`, background: `linear-gradient(180deg, ${color}, ${tint(color, 35)})`, ["--i" as string]: i }} />
        </span>
      ))}
    </div>
  )
}

function Dots({ count, color }: { count: number; color: string }) {
  const total = Math.max(10, count)
  return (
    <div className="grid grid-cols-10 gap-1 h-10 content-end" aria-hidden>
      {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
        <span key={i} className="aspect-square rounded-full transition-colors duration-700" style={{ background: i < count ? color : 'var(--osr-fill-3)', boxShadow: i < count ? `0 0 6px ${tint(color, 60)}` : undefined, transitionDelay: `${i * 40}ms` }} />
      ))}
    </div>
  )
}
