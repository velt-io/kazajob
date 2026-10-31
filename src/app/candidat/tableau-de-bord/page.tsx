'use client'

import Link from 'next/link'
import { ArrowRight, Eye, Briefcase, Sparkles, Star, Flame, Gamepad2, Compass, Castle, ScrollText, Swords, Heart } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { JobCard } from '@/components/cards/JobCard'
import { ApplicationCard } from '@/components/cards/ApplicationCard'
import { useAuth } from '@/features/auth/useAuth'
import { useApplications } from '@/features/applications/useApplications'
import { useState, useEffect } from 'react'
import type { Job } from '@/lib/types'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useGamification } from '@/features/gamification/useGamification'
import { GameDashboard } from '@/components/gamification/GameDashboard'
import { JourneyBanner } from '@/components/quest/candidat/JourneyBanner'
import { ghostLink, PanelTitle, QuestEmpty, QuestPageHeader, SPELL_LINK } from '@/components/quest/candidat/QuestKit'

function QuizBanner() {
  return (
    <Link href="/candidat/quiz" className="group block mb-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#22D3EE]/40 rounded-[18px]">
      <div className="qxc-card p-4 flex items-center gap-4" style={{ ['--r' as string]: 'var(--qx-cyan)' }}>
        <span className="qxc-crest w-12 h-12 text-[var(--qx-cyan)]" style={{ ['--r' as string]: 'var(--qx-cyan)' }} aria-hidden>
          <span className="qxc-crest-frame" /><span><Compass size={18} /></span>
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white font-[family-name:var(--font-epic)] tracking-wide">Découvre ta classe de héros en 2 min</div>
          <div className="text-xs text-[var(--kz-mute)]">Un mini-quiz — les recruteurs verront ton style de travail.</div>
        </div>
        <ArrowRight size={18} className="shrink-0 text-[var(--qx-cyan)] transition-transform group-hover:translate-x-1" aria-hidden />
      </div>
    </Link>
  )
}

export default function CandidateDashboard() {
  const { profile } = useAuth()
  const { applications, loading: appsLoading } = useApplications(profile?.id)
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const { favorites } = useFavorites(profile?.id)
  const gami = useGamification(profile, applications.length, favorites.length)

  useEffect(() => {
    if (!profile?.id) return
    fetch('/api/jobs/recommended?limit=4')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRecommendedJobs(d as Job[]))
      .catch(() => {})
      .finally(() => setJobsLoading(false))
  }, [profile?.id])

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const profileFields = [profile?.full_name, profile?.bio, profile?.location, profile?.phone, profile?.cv_url, profile?.avatar_url || (profile?.avatar_config ? 'avatar' : null)]
  const profileScore = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

  const pendingApps   = applications.filter(a => a.status === 'pending').length
  const interviewApps = applications.filter(a => a.status === 'interview').length

  const journey = (
    <JourneyBanner profile={profile} applications={applications} favoritesCount={favorites.length} skillsCount={gami.skillsCount} />
  )

  if (gami.enabled && profile) {
    return (
      <div className="max-w-[1100px] mx-auto">
        {journey}
        {!profile.quiz_result && <QuizBanner />}
        <GameDashboard
          profile={profile}
          gami={gami}
          applications={applications}
          appsLoading={appsLoading}
          recommendedJobs={recommendedJobs as Parameters<typeof GameDashboard>[0]['recommendedJobs']}
          jobsLoading={jobsLoading}
          favoritesCount={favorites.length}
        />
      </div>
    )
  }

  const xp = profile?.xp ?? 0
  const kpis = [
    { label: 'Candidatures', value: applications.length, delta: pendingApps > 0 ? `${pendingApps} en attente` : undefined, icon: Briefcase, color: '#C084FC' },
    { label: 'Entretiens',   value: interviewApps, delta: interviewApps > 0 ? 'En cours' : undefined, icon: Swords, color: '#E879F9' },
    { label: 'Favoris',      value: favorites.length, icon: Star, color: '#22D3EE' },
    { label: 'Profil',       value: `${profileScore}%`, delta: profileScore < 100 ? 'A completer' : 'Complet', icon: Eye, color: '#FACC15' },
  ]

  return (
    <div className="max-w-[1100px] mx-auto">
      <QuestPageHeader
        eyebrow={`Bonzour ${profile?.full_name?.split(' ')[0] ?? 'toi'} · ${today}`}
        title={recommendedJobs.length > 0 ? `${recommendedJobs.length} prime${recommendedJobs.length > 1 ? 's' : ''}` : 'Bienvenue au'}
        accent={recommendedJobs.length > 0 ? 'pour ton héros.' : 'QG du héros'}
        icon={<Castle size={20} />}
      >
        <button
          type="button"
          onClick={() => gami.toggle()}
          className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-[#E879F9]/50 text-xs font-bold uppercase tracking-[0.08em] text-[#F5D0FE] bg-[rgba(232,121,249,0.1)] hover:bg-[rgba(232,121,249,0.2)] hover:shadow-[0_0_20px_-6px_rgba(232,121,249,0.9)] transition"
          title="Activer le mode Quête"
        >
          <Gamepad2 size={14} aria-hidden /> Mode Quête
        </button>
        <Link href="/candidat/offres" className={SPELL_LINK}>Voir les offres <ArrowRight size={15} aria-hidden /></Link>
      </QuestPageHeader>

      {journey}
      {!profile?.quiz_result && <QuizBanner />}

      {/* Compteurs — 2 colonnes sur mobile, 4 sur desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 qxc-stagger">
        {kpis.map((k) => (
          <div key={k.label} className="qxc-card p-4" style={{ ['--r' as string]: k.color }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--kz-mute)]">{k.label}</span>
              <k.icon size={15} style={{ color: k.color }} aria-hidden />
            </div>
            <div className="text-[28px] font-bold text-white leading-none font-[family-name:var(--font-epic)] tabular-nums">{k.value}</div>
            {k.delta && <div className="text-[11px] mt-1.5 font-semibold" style={{ color: k.color }}>{k.delta}</div>}
          </div>
        ))}
      </div>

      {/* 2 colonnes sur lg, 1 colonne sur mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-5">
        <div className="flex flex-col gap-5 min-w-0">
          {/* Héros */}
          <div className="qx-panel p-4 md:p-5 flex gap-4 items-center">
            <Avatar name={profile?.full_name ?? 'KZ'} src={profile?.avatar_url} avatarConfig={profile?.avatar_config} size={64} color="var(--kz-violet-soft)" badge />
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-white truncate font-[family-name:var(--font-epic)]">{profile?.full_name}</div>
              <div className="text-xs text-[var(--kz-mute)] mb-2 truncate">
                {profile?.bio ? profile.bio.slice(0, 50) + '…' : 'Complete ton profil'}
                {profile?.location ? ` · ${profile.location}` : ''}
              </div>
              <div className="qx-xp" role="progressbar" aria-valuenow={profileScore} aria-valuemin={0} aria-valuemax={100} aria-label="Profil complété"><span style={{ width: `${Math.max(profileScore, 3)}%` }} /></div>
            </div>
            <Link href="/candidat/profil" className={`${ghostLink('sm')} shrink-0`}>Editer</Link>
          </div>

          {/* Primes recommandées */}
          <div>
            <PanelTitle icon={<Sparkles size={13} />} color="var(--qx-magenta)"
              extra={<Link href="/candidat/offres" className="text-sm font-bold text-[var(--qx-gold)] hover:text-white">Tout voir →</Link>}>
              Primes pour toi
            </PanelTitle>
            {jobsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="qxc-card h-36 animate-pulse" />)}
              </div>
            ) : recommendedJobs.length === 0 ? (
              <QuestEmpty title="Aucune offre disponible" icon={<Briefcase size={24} />} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 qxc-stagger">
                {recommendedJobs.slice(0, 4).map((job) => (
                  <JobCard key={job.id} job={job} compact />
                ))}
              </div>
            )}
          </div>

          {/* Candidatures */}
          <div className="qx-panel p-4 md:p-5">
            <PanelTitle icon={<ScrollText size={13} />}
              extra={applications.length > 0 ? <span className="qxc-count">{applications.length}</span> : null}>
              Quêtes en cours
            </PanelTitle>
            {appsLoading ? (
              <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-[var(--kz-cream2)] animate-pulse" />)}</div>
            ) : applications.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--kz-mute)] mb-3">Aucune candidature</p>
                <Link href="/candidat/offres" className={ghostLink('sm')}>Voir les offres</Link>
              </div>
            ) : (
              <>
                {applications.slice(0, 4).map((app) => <ApplicationCard key={app.id} application={app} showActions />)}
                {applications.length > 4 && (
                  <div className="mt-3 pt-3 border-t border-[#C084FC]/20">
                    <Link href="/candidat/candidatures" className={`${ghostLink('sm')} w-full`}>Voir tout</Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Série */}
          <div className="qxc-card p-5 overflow-hidden" style={{ ['--r' as string]: '#FB923C' }}>
            <div aria-hidden className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-[radial-gradient(closest-side,rgba(251,146,60,0.35),transparent)]" />
            <Flame size={28} className="relative text-[#FB923C] drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]" aria-hidden />
            <div className="relative mt-1 text-4xl font-bold leading-none text-white font-[family-name:var(--font-epic)]">
              {profile?.streak ?? 0}<span className="text-base text-[var(--kz-mute)]">j</span>
            </div>
            <div className="relative text-sm font-semibold mt-1 text-white">Série active</div>
            <div className="relative text-xs mt-1 text-[var(--kz-mute)]">
              {(profile?.streak ?? 0) > 0 ? `${profile!.streak} jours — continue !` : 'Connecte-toi chaque jour.'}
            </div>
          </div>

          {/* XP */}
          <div className="qx-panel p-4">
            <div className="kz-eyebrow text-[var(--kz-mute)] mb-1.5">Experience totale</div>
            <div className="text-2xl font-bold tracking-tight mb-2 qx-text-legend font-[family-name:var(--font-epic)]">
              {xp.toLocaleString('fr-FR')} xp
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--kz-mute)] mb-1.5">
              <span>Niveau {Math.floor(xp / 1000) + 1}</span><span className="tabular-nums">{Math.round((xp % 1000) / 10)} %</span>
            </div>
            <div className="qx-xp"><span style={{ width: `${Math.max((xp % 1000) / 10, 3)}%` }} /></div>
          </div>

          {/* Activité */}
          <div className="qx-panel p-4">
            <h4 className="text-sm font-bold text-white mb-3 font-[family-name:var(--font-epic)] tracking-wide">Ton activité</h4>
            {[
              { label: 'Candidatures', value: applications.length, color: '#C084FC', icon: Briefcase },
              { label: 'Entretiens',   value: interviewApps,       color: '#E879F9', icon: Swords },
              { label: 'Favoris',      value: favorites.length,    color: '#22D3EE', icon: Heart },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center py-2 border-b border-[#C084FC]/15 last:border-0">
                <span className="flex items-center gap-2 text-xs text-[var(--kz-mute)]"><s.icon size={12} style={{ color: s.color }} aria-hidden />{s.label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
