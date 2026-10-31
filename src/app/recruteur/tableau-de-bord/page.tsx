'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Users, Briefcase, TrendingUp, Plus, ArrowRight, CalendarClock, ScrollText, Feather, Video, Phone, MapPin, Crown, Swords, Castle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { KazaScoreCard } from '@/components/ui/KazaScoreBadge'
import { LaunchBanner } from '@/components/recruiter/LaunchBanner'
import { useAuth } from '@/features/auth/useAuth'
import { useInterviews } from '@/features/interviews/useInterviews'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { Application, Job, Conversation } from '@/lib/types'
import type { BadgeColor } from '@/lib/types'
import { QuestHeader, PanelTitle, Sigil, toneStyle } from '@/components/quest/recruteur/QuestChrome'
import { TrophyStat } from '@/components/quest/recruteur/TrophyStat'
import { HeroPortrait } from '@/components/quest/recruteur/HeroPortrait'
import { heroRank, initialsOf, STAGE_META } from '@/components/quest/recruteur/hero'

interface RecruiterStats { totalViews: number; totalApplications: number; activeJobs: number; conversionRate: string }

const IV_TYPE = {
  video:  { label: 'Visioconférence', Icon: Video },
  phone:  { label: 'Téléphone',       Icon: Phone },
  onsite: { label: 'Présentiel',      Icon: MapPin },
} as const

export default function RecruiterDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<RecruiterStats>({ totalViews: 0, totalApplications: 0, activeJobs: 0, conversionRate: '0%' })
  const [recentApps, setRecentApps] = useState<Application[]>([])
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pipelineCounts, setPipelineCounts] = useState({ pending: 0, viewed: 0, interview: 0, hired: 0 })
  const [loading, setLoading] = useState(true)
  // Lecture seule de l'agenda (même hook que la page Agenda) pour le prochain rendez-vous.
  const { upcoming, loading: ivLoading } = useInterviews()
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
    { label: 'Postulations', count: stats.totalApplications, tone: STAGE_META.pending.tone,   lore: 'À la porte' },
    { label: 'Tri',          count: pipelineCounts.viewed,    tone: STAGE_META.viewed.tone,    lore: 'Dossiers étudiés' },
    { label: 'Entretien',    count: pipelineCounts.interview, tone: STAGE_META.interview.tone, lore: "À l'épreuve" },
    { label: 'Embauche',     count: pipelineCounts.hired,     tone: STAGE_META.hired.tone,     lore: 'Dans la guilde' },
  ]

  // Jauges : uniquement des parts réelles
  const treatedRatio = stats.totalApplications > 0 ? (stats.totalApplications - pipelineCounts.pending) / stats.totalApplications : null
  const conversionRatio = stats.totalViews > 0 ? stats.totalApplications / stats.totalViews : null
  const nextIv = [...upcoming].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
  const maxJobApps = Math.max(1, ...activeJobs.map((j) => j.applications_count ?? 0))
  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="max-w-[1180px] mx-auto">
      <LaunchBanner />

      <QuestHeader
        eyebrow={<>Salle du conseil · <span className="capitalize">{today}</span></>}
        icon={<Castle size={18} />}
        tone="var(--qx-gold)"
        title={stats.totalApplications > 0
          ? <><span className="qx-text-legend">{stats.totalApplications}</span> héros {stats.totalApplications > 1 ? 'ont' : 'a'} répondu à l&apos;appel</>
          : <>Publiez votre <span className="qx-text-arcane">première quête</span></>}
        subtitle={<>Bienvenue{firstName ? `, ${firstName}` : ''}. Voici l&apos;état de votre guilde aujourd&apos;hui.</>}
        actions={
          <Link href="/recruteur/offres/nouvelle">
            <Button kind="primary" size="md" icon={<Plus size={15} />}>Nouvelle offre</Button>
          </Link>
        }
      />

      {/* Trophées */}
      <section aria-label="Indicateurs clés" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <TrophyStat label="Vues" value={stats.totalViews.toLocaleString('fr-FR')} icon={<Eye size={14} />} tone="var(--qx-neon)"
          hint="Regards portés sur vos quêtes" delay={0} />
        <TrophyStat label="Candidatures" value={stats.totalApplications} icon={<Users size={14} />} tone="var(--qx-magenta)"
          ratio={treatedRatio} delay={0.06}
          hint={treatedRatio !== null ? `${Math.round(treatedRatio * 100)} % déjà traitées` : 'Aucune pour l’instant'} />
        <TrophyStat label="Offres actives" value={stats.activeJobs} icon={<Briefcase size={14} />} tone="var(--kz-green)"
          hint="Quêtes affichées" delay={0.12} />
        <TrophyStat label="Conversion" value={stats.conversionRate} icon={<TrendingUp size={14} />} tone="var(--qx-gold)"
          ratio={conversionRatio} delay={0.18} hint="Candidatures par vue" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        {/* Colonne principale */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Chemin des recrues */}
          <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.1s' }}>
            <PanelTitle icon={<Swords size={16} />} title="Le chemin des recrues"
              action={<Link href="/recruteur/candidatures"><Button kind="soft" size="sm" iconRight={<ArrowRight size={13} />}>Pipeline</Button></Link>} />
            <ol className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
              <span aria-hidden className="hidden sm:block absolute left-[12.5%] right-[12.5%] top-[26px] h-px bg-[linear-gradient(90deg,#A3A3B8,#22D3EE,#C084FC,#FACC15)] opacity-60" />
              {PIPELINE.map((s) => (
                <li key={s.label} className="relative flex flex-col items-center text-center">
                  <Link href="/recruteur/candidatures" aria-label={`${s.label} : ${s.count}`}
                    className="group flex flex-col items-center rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E879F9]/60">
                    <span className="relative w-11 h-11 flex items-center justify-center">
                      <span aria-hidden className="absolute inset-[5px] rotate-45 rounded-lg border bg-[#160B2A] transition-transform duration-300 group-hover:scale-110"
                        style={{ borderColor: s.tone, boxShadow: `0 0 16px -4px ${s.tone}` }} />
                      <span className="relative text-[15px] font-extrabold text-white tabular-nums">{loading ? '·' : s.count}</span>
                    </span>
                    <span className="mt-2 text-[12px] font-bold text-white">{s.label}</span>
                    <span className="text-[10.5px] uppercase tracking-[0.1em]" style={{ color: s.tone }}>{s.lore}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* Dernières recrues */}
          <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.16s' }}>
            <PanelTitle icon={<Users size={16} />} title="Dernières recrues" hint="Les cinq candidatures les plus récentes" />
            {loading ? (
              <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 qxr-skeleton" />)}</div>
            ) : recentApps.length === 0 ? (
              <EmptyHall icon={<Users size={18} />} text="Aucun héros n’a encore frappé à la porte." />
            ) : (
              <ul className="flex flex-col gap-2">
                {recentApps.map((app) => {
                  const statusInfo = APPLICATION_STATUSES[app.status] ?? { label: app.status, color: 'cream' }
                  const candidate = app.candidate
                  const rank = heroRank(candidate?.xp)
                  return (
                    <li key={app.id}>
                      <Link href="/recruteur/candidatures"
                        className="group flex items-center gap-3 p-2.5 pr-3 rounded-xl border border-[#C084FC]/15 bg-[rgba(12,5,24,0.45)] hover:border-[#E879F9]/45 hover:bg-[rgba(168,85,247,0.1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E879F9]/60">
                        <HeroPortrait name={candidate?.full_name ?? 'Candidat'} src={candidate?.avatar_url} avatarConfig={candidate?.avatar_config} size={44} rarity={rank?.rarity ?? 'commune'} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">{candidate?.full_name ?? 'Candidat'}</span>
                            {rank && <span className="text-[10px] font-bold text-[var(--qx-gold)] shrink-0">Niv. {rank.level}</span>}
                          </div>
                          <div className="text-xs text-[var(--kz-mute)] truncate">{app.job?.title ?? '—'} · {timeAgo(app.created_at)}</div>
                        </div>
                        <Badge color={statusInfo.color as BadgeColor} size="sm" className="hidden sm:inline-flex">{statusInfo.label}</Badge>
                        <ArrowRight size={14} aria-hidden className="text-[var(--kz-mute)] group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Prochain rendez-vous */}
          <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.12s' }}>
            <PanelTitle icon={<CalendarClock size={16} />} title="Prochain rendez-vous" tone="var(--qx-cyan)"
              action={<Link href="/recruteur/entretiens"><Button kind="soft" size="sm">Agenda</Button></Link>} />
            {ivLoading ? (
              <div className="h-20 qxr-skeleton" />
            ) : !nextIv ? (
              <EmptyHall icon={<CalendarClock size={18} />} text="Aucun entretien planifié. Planifiez-en un depuis une candidature." />
            ) : (() => {
              const d = new Date(nextIv.scheduled_at)
              const t = IV_TYPE[nextIv.type] ?? IV_TYPE.video
              const isToday = d.toDateString() === new Date().toDateString()
              const accent = isToday ? 'var(--qx-gold)' : 'var(--qx-cyan)'
              return (
                <div className="flex items-center gap-4">
                  <div className="w-16 shrink-0 rounded-xl border text-center py-2 bg-[rgba(12,5,24,0.6)]"
                    style={{ borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`, boxShadow: `0 0 20px -8px ${accent}` }}>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--kz-mute)]">{d.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                    <div className="text-[24px] font-extrabold text-white leading-none font-[family-name:var(--font-epic)]">{d.getDate()}</div>
                    <div className="text-[11px] font-bold tabular-nums mt-0.5" style={{ color: accent }}>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="min-w-0">
                    {isToday && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--qx-gold)]">Aujourd&apos;hui</span>}
                    <div className="text-sm font-bold text-white truncate">{nextIv.candidate?.full_name ?? 'Candidat'}</div>
                    <div className="text-xs text-[var(--kz-mute)] truncate">{nextIv.job?.title ?? 'Entretien'}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--qx-cyan)] mt-1"><t.Icon size={12} aria-hidden />{t.label} · {nextIv.duration_min} min</div>
                  </div>
                </div>
              )
            })()}
            {upcoming.length > 1 && (
              <p className="text-[11px] text-[var(--kz-mute)] mt-3">+ {upcoming.length - 1} autre{upcoming.length > 2 ? 's' : ''} rendez-vous à venir</p>
            )}
          </section>

          {/* Quêtes en cours */}
          <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.18s' }}>
            <PanelTitle icon={<ScrollText size={16} />} title="Quêtes en cours"
              action={<Link href="/recruteur/offres"><Button kind="soft" size="sm">Gérer</Button></Link>} />
            {loading ? <div className="h-24 qxr-skeleton" /> :
              activeJobs.length === 0 ? (
                <EmptyHall icon={<ScrollText size={18} />}
                  text={<>Aucune quête affichée. <Link href="/recruteur/offres/nouvelle" className="font-bold text-[var(--qx-magenta)] hover:underline">Créer une offre</Link></>} />
              ) : (
                <ul className="flex flex-col gap-3">
                  {activeJobs.slice(0, 4).map((job) => (
                    <li key={job.id}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-sm font-semibold text-white truncate">{job.title}</span>
                        <span className="text-[11px] font-bold text-[var(--qx-gold)] tabular-nums shrink-0">{job.applications_count} cand.</span>
                      </div>
                      <div className="qxr-xp-mini" style={toneStyle('var(--kz-green)')} aria-hidden>
                        <span style={{ width: `${Math.max(4, ((job.applications_count ?? 0) / maxJobApps) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </section>

          {/* Missives */}
          <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.24s' }}>
            <PanelTitle icon={<Feather size={16} />} title="Missives" tone="var(--qx-magenta)"
              action={<Link href="/recruteur/messages"><Button kind="soft" size="sm">Tout voir</Button></Link>} />
            {conversations.length === 0 ? (
              <EmptyHall icon={<Feather size={18} />} text="Aucune missive pour l’instant." />
            ) : (
              <ul className="flex flex-col gap-1">
                {conversations.slice(0, 3).map((conv) => {
                  const candidate = conv.candidate
                  return (
                    <li key={conv.id}>
                      <Link href={`/recruteur/messages?c=${conv.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[rgba(168,85,247,0.12)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E879F9]/60">
                        <span className="w-8 h-8 rounded-full border border-[#C084FC]/40 flex items-center justify-center text-[11px] font-bold text-white shrink-0 bg-[rgba(168,85,247,0.18)]">
                          {initialsOf(candidate?.full_name)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{candidate?.full_name}</div>
                          <div className="text-[11px] text-[var(--kz-mute)]">{timeAgo(conv.last_message_at)}</div>
                        </div>
                        <span aria-hidden className="qxr-seal shrink-0" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* KazaScore */}
          {profile?.id && <KazaScoreCard recruiterId={profile.id} />}

          {/* Conseil du maître de guilde */}
          <section className="qxr-oracle p-5 qx-rise" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-start gap-3">
              <Sigil tone="var(--qx-gold)" size="sm"><Crown size={13} /></Sigil>
              <div className="min-w-0">
                <p className="kz-eyebrow text-[var(--qx-gold)] mb-1.5">Conseil du maître de guilde</p>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {stats.activeJobs === 0 ? 'Publiez votre première offre pour commencer à recevoir des candidatures.' :
                   stats.totalApplications === 0 ? 'Vos offres sont en ligne. Partagez-les pour attirer des candidats.' :
                   `${pipelineCounts.pending} candidature(s) en attente de traitement.`}
                </p>
                <Link href="/recruteur/candidatures">
                  <Button kind="dark" size="sm" className="mt-3" iconRight={<ArrowRight size={13} />}>Voir les candidatures</Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function EmptyHall({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#C084FC]/25 text-xs text-[var(--kz-mute)]">
      <span aria-hidden className="text-[var(--qx-neon)] shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
