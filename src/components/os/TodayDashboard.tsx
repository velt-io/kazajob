'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Briefcase, CalendarCheck, Heart, Flame, Sparkles, Check, MapPin, Gamepad2, ChevronRight } from 'lucide-react'
import { ActivityRings, RING_COLORS } from './ActivityRings'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { formatSalary, timeAgo } from '@/lib/utils'
import type { Application, Job, Profile } from '@/lib/types'
import type { GamificationData } from '@/features/gamification/useGamification'

/**
 * Tableau de bord candidat « Aujourd'hui » (thème OS 2027) : grande typo,
 * widgets en verre, anneaux d'activité, quêtes façon liste de rappels.
 */
export function TodayDashboard({ profile, gami, applications, appsLoading, recommendedJobs, jobsLoading, favoritesCount, profileScore, showQuiz }: {
  profile: Profile
  gami: GamificationData
  applications: Application[]
  appsLoading: boolean
  recommendedJobs: Job[]
  jobsLoading: boolean
  favoritesCount: number
  profileScore: number
  showQuiz: boolean
}) {
  const firstName = profile.full_name?.split(' ')[0] ?? ''
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const interviews = applications.filter((a) => a.status === 'interview' || a.status === 'offer').length
  const activeApps = applications.filter((a) => a.status !== 'withdrawn')
  const nextQuest = gami.activeQuests[0]
  const weekApps = Math.min(100, (activeApps.length / 5) * 100)

  return (
    <div className="max-w-[1180px] mx-auto">
      {/* En-tête « Aujourd'hui » */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)] capitalize">{today}</p>
          <h1 className="text-[36px] lg:text-[52px] font-semibold tracking-[-0.05em] leading-[1] text-white mt-1">
            Bonzour, <span className="os-text-aurora">{firstName || 'toi'}</span>
          </h1>
        </div>
        <Link href="/candidat/offres">
          <span className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-[15px] font-semibold text-white bg-[linear-gradient(120deg,#FF9F0A,#FF375F_45%,#BF5AF2)] shadow-[0_10px_30px_-10px_rgba(255,55,95,0.7)] hover:brightness-110 transition">
            Explorer les offres <ArrowRight size={16} />
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Anneaux */}
        <section className="lg:col-span-5 rounded-[28px] os-glass p-6 flex items-center gap-6">
          <ActivityRings size={150} stroke={16} gap={3} rings={[
            { value: gami.enabled ? gami.xpProgress : 0, ...RING_COLORS.move, label: 'Niveau' },
            { value: weekApps, ...RING_COLORS.exercise, label: 'Candidatures' },
            { value: profileScore, ...RING_COLORS.stand, label: 'Profil' },
          ]} />
          <div className="flex flex-col gap-3 min-w-0">
            <Ring label="Niveau" value={`${gami.level.emoji} ${gami.level.title}`} sub={`${gami.xp.toLocaleString('fr-FR')} XP · ${gami.xpProgress} %`} color="#FA114F" />
            <Ring label="Candidatures" value={`${activeApps.length} / 5`} sub="objectif de la semaine" color="#92E82A" />
            <Ring label="Profil" value={`${profileScore} %`} sub={profileScore < 100 ? 'à compléter' : 'complet'} color="#1EEAEF" />
          </div>
        </section>

        {/* Prochaine étape */}
        <section className="lg:col-span-7 relative overflow-hidden rounded-[28px] p-6 flex flex-col justify-between min-h-[220px] border border-white/10"
          style={{ background: 'linear-gradient(140deg, #1E3A8A 0%, #5B21B6 55%, #BE185D 110%)' }}>
          <div aria-hidden className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-[#FF9F0A] opacity-30 blur-3xl" />
          <div className="relative flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/80">
            <Sparkles size={14} /> Prochaine étape
          </div>
          {nextQuest ? (
            <div className="relative">
              <div className="text-[26px] lg:text-[30px] font-semibold tracking-[-0.03em] text-white leading-tight">{nextQuest.title}</div>
              <div className="text-[15px] text-white/80 mt-1">{nextQuest.desc}</div>
              <div className="flex items-center gap-3 mt-5">
                <div className="flex-1 h-2 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(nextQuest.progress, 3)}%` }} />
                </div>
                <span className="text-[13px] font-semibold text-white tabular-nums">{nextQuest.progress} %</span>
                <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">+{nextQuest.xpReward} XP</span>
              </div>
            </div>
          ) : (
            <div className="relative text-[26px] font-semibold text-white">Toutes tes quêtes sont terminées 🎉</div>
          )}
        </section>

        {/* Chiffres */}
        {[
          { icon: <Briefcase size={16} />, color: '#FF9F0A', label: 'Candidatures', value: activeApps.length, href: '/candidat/candidatures' },
          { icon: <CalendarCheck size={16} />, color: '#30D158', label: 'Entretiens', value: interviews, href: '/candidat/entretiens' },
          { icon: <Heart size={16} />, color: '#FF375F', label: 'Favoris', value: favoritesCount, href: '/candidat/favoris' },
          { icon: <Flame size={16} />, color: '#FFD60A', label: 'Jours de série', value: profile.streak ?? 0, href: '/candidat/profil' },
        ].map((s) => (
          <Link key={s.label} href={s.href} data-tilt className="lg:col-span-3 group rounded-[24px] os-glass p-5 hover:bg-white/[0.08] transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white" style={{ background: s.color }}>{s.icon}</span>
              <ArrowUpRight size={16} className="text-[var(--kz-mute)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-[34px] font-semibold tracking-[-0.05em] text-white mt-3 leading-none tabular-nums">{s.value}</div>
            <div className="text-[13px] text-[var(--kz-mute)] mt-1.5">{s.label}</div>
          </Link>
        ))}

        {/* Offres recommandées */}
        <section className="lg:col-span-7 rounded-[28px] os-glass p-2">
          <WidgetHeader title="Pour toi" href="/candidat/offres" link="Tout voir" />
          {jobsLoading ? (
            <SkeletonRows />
          ) : recommendedJobs.length === 0 ? (
            <p className="px-4 pb-5 text-sm text-[var(--kz-mute)]">Ajoute des compétences à ton profil pour recevoir des recommandations.</p>
          ) : (
            recommendedJobs.slice(0, 4).map((job) => (
              <Link key={job.id} href={`/candidat/offres/${job.id}`} className="flex items-center gap-3 px-4 py-3 rounded-[18px] hover:bg-white/[0.06] transition-colors">
                <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-[13px] font-semibold text-white shrink-0 bg-[linear-gradient(145deg,#5E5CE6,#BF5AF2)]">
                  {(job.company?.name ?? 'CO').slice(0, 2).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-white truncate">{job.title}</div>
                  <div className="text-[12px] text-[var(--kz-mute)] truncate flex items-center gap-1">
                    {job.company?.name} · <MapPin size={11} />{job.location} · {formatSalary(job.salary_min, job.salary_max)}
                  </div>
                </div>
                {job.match_score !== undefined && (
                  <span className="text-[15px] font-semibold os-text-aurora tabular-nums shrink-0">{job.match_score}%</span>
                )}
                <ChevronRight size={16} className="text-[var(--kz-mute)] shrink-0" />
              </Link>
            ))
          )}
        </section>

        {/* Quêtes (liste de rappels) */}
        <section className="lg:col-span-5 rounded-[28px] os-glass p-2">
          <WidgetHeader title="Quêtes" sub={`${gami.doneQuests.length} sur ${gami.quests.length}`} />
          <ul className="px-2 pb-2">
            {gami.quests.slice(0, 6).map((q) => (
              <li key={q.id} className="flex items-center gap-3 px-2 py-2.5 border-b border-white/[0.05] last:border-0">
                <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 ${q.completed ? 'bg-[#0A84FF]' : 'border-2 border-white/25'}`}>
                  {q.completed && <Check size={13} strokeWidth={3} className="text-white" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[14px] truncate ${q.completed ? 'text-[var(--kz-mute)] line-through' : 'text-white'}`}>{q.title}</div>
                  {!q.completed && q.progress > 0 && (
                    <div className="h-1 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-[#0A84FF]" style={{ width: `${q.progress}%` }} />
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-[#FA114F] shrink-0">+{q.xpReward}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => gami.toggle()} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium text-[var(--kz-mute)] hover:text-white transition-colors">
            <Gamepad2 size={13} /> {gami.enabled ? 'Masquer les récompenses' : 'Afficher les récompenses'}
          </button>
        </section>

        {/* Candidatures récentes */}
        <section className="lg:col-span-7 rounded-[28px] os-glass p-2">
          <WidgetHeader title="Candidatures récentes" href="/candidat/candidatures" link="Suivre" />
          {appsLoading ? <SkeletonRows /> : activeApps.length === 0 ? (
            <p className="px-4 pb-5 text-sm text-[var(--kz-mute)]">Aucune candidature pour l’instant. Ta première est à un geste.</p>
          ) : activeApps.slice(0, 4).map((a) => {
            const st = APPLICATION_STATUSES[a.status as keyof typeof APPLICATION_STATUSES]
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-white truncate">{a.job?.title ?? 'Offre'}</div>
                  <div className="text-[12px] text-[var(--kz-mute)]">{a.job?.company?.name ?? ''} · {timeAgo(a.created_at)}</div>
                </div>
                {st && <Badge color={st.color} size="sm">{st.label}</Badge>}
              </div>
            )
          })}
        </section>

        {/* Profil / quiz */}
        <section className="lg:col-span-5 rounded-[28px] os-glass p-5 flex items-center gap-4">
          <Avatar name={profile.full_name} src={profile.avatar_url} avatarConfig={profile.avatar_config} size={64} color="rgba(255,255,255,0.1)" />
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-semibold text-white truncate">{profile.full_name}</div>
            <div className="text-[13px] text-[var(--kz-mute)] truncate">{profile.location ?? 'Ajoute ta ville'}</div>
            <Link href={showQuiz ? '/candidat/quiz' : '/candidat/profil'} className="inline-flex items-center gap-1 mt-2 text-[13px] font-semibold text-[#0A84FF] hover:brightness-125">
              {showQuiz ? 'Découvrir mon style de travail (2 min)' : 'Améliorer mon profil'} <ArrowRight size={13} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function Ring({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color }}>{label}</div>
      <div className="text-[17px] font-semibold text-white truncate leading-tight">{value}</div>
      <div className="text-[12px] text-[var(--kz-mute)] truncate">{sub}</div>
    </div>
  )
}

function WidgetHeader({ title, sub, href, link }: { title: string; sub?: string; href?: string; link?: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-white" style={{ fontFamily: 'inherit' }}>{title}</h2>
      {sub && <span className="text-[13px] text-[var(--kz-mute)]">{sub}</span>}
      {href && link && <Link href={href} className="text-[14px] font-medium text-[#0A84FF] hover:brightness-125">{link}</Link>}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-2 px-4 pb-4">
      {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-2xl bg-white/[0.05] animate-pulse" />)}
    </div>
  )
}
