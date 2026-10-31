'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Mail, Phone, Download, MessageCircle, Briefcase, FolderGit2, Globe, FileText, ExternalLink, Play, Flame, Sparkles, ScrollText, Gem, Feather, Compass, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { useStartConversation } from '@/features/messages/useMessages'
import { ARCHETYPES, type ArchetypeKey } from '@/lib/quiz'
import type { Profile, Application } from '@/lib/types'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'
import { PanelTitle, Sigil, toneStyle } from '@/components/quest/recruteur/QuestChrome'
import { HeroPortrait, RarityTag } from '@/components/quest/recruteur/HeroPortrait'
import { heroRank, RARITY_TONE, STAGE_META } from '@/components/quest/recruteur/hero'

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const startConversation = useStartConversation()
  const [candidate, setCandidate] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)
  const router = useRouter()

  const handleMessage = async () => {
    if (!profile?.id || !candidate) return
    setMessaging(true)
    const convId = await startConversation(candidate.id, profile.id)
    if (convId) router.push(`/recruteur/messages?c=${convId}`)
    setMessaging(false)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/profiles/${id}`)
        if (res.ok) {
          const { profile, applications: apps } = await res.json()
          if (profile) setCandidate(profile as Profile)
          if (apps) setApplications(apps as Application[])
        }
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <PageLoader />
  if (!candidate) return <div className="qx-panel max-w-md mx-auto text-center py-16 text-[var(--kz-mute)]">Candidat introuvable.</div>

  const rank = heroRank(candidate.xp)
  const rarity = rank?.rarity ?? 'commune'
  const tone = RARITY_TONE[rarity]
  const archetype = candidate.quiz_result?.archetype ? ARCHETYPES[candidate.quiz_result.archetype as ArchetypeKey] : undefined
  const pitchUrl = (candidate as unknown as Record<string, unknown>).video_pitch_url as string | null
  const talents = [...(candidate.soft_skills ?? [])].filter(Boolean)
  const hobbies = [...(candidate.hobbies ?? [])].filter(Boolean)

  const c = candidate as unknown as {
    linkedin_url?: string | null; github_url?: string | null; portfolio_url?: string | null
    portfolio_pdf_url?: string | null; realisations?: { title: string; description?: string; url?: string }[] | null
  }
  const links = [
    c.linkedin_url && { label: 'LinkedIn', href: c.linkedin_url, icon: <Briefcase size={13} /> },
    c.github_url && { label: 'GitHub', href: c.github_url, icon: <FolderGit2 size={13} /> },
    c.portfolio_url && { label: 'Portfolio', href: c.portfolio_url, icon: <Globe size={13} /> },
    c.portfolio_pdf_url && { label: 'Portfolio PDF', href: c.portfolio_pdf_url, icon: <FileText size={13} /> },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode }[]
  const reals = c.realisations ?? []

  return (
    <div className="max-w-[1080px] mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-[var(--kz-mute)] hover:text-white mb-5 transition-colors">
        <ArrowLeft size={16} aria-hidden />
        Retour
      </button>

      {/* Bannière du héros */}
      <section className="qx-panel overflow-hidden mb-5 qx-rise" style={{ boxShadow: `0 0 48px -18px ${tone}` }} aria-labelledby="hero-name">
        <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[18px]"
          style={{ background: `radial-gradient(60% 120% at 12% 0%, color-mix(in srgb, ${tone} 22%, transparent), transparent 60%), radial-gradient(50% 90% at 100% 100%, rgba(232,121,249,0.12), transparent 60%)` }} />
        <div className="relative p-5 sm:p-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-7">
          <div className="flex justify-center md:block">
            <HeroPortrait name={candidate.full_name} src={candidate.avatar_url} avatarConfig={candidate.avatar_config} size={132} rarity={rarity} />
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap mb-2">
              {rank ? <RarityTag rarity={rarity} /> : null}
              {rank && <span className="text-[12px] font-bold text-white">Niveau {rank.level} · {rank.title}</span>}
            </div>
            <h1 id="hero-name" className="text-[28px] sm:text-[36px] font-bold text-white leading-tight break-words">{candidate.full_name}</h1>
            <div className="flex items-center justify-center md:justify-start gap-x-4 gap-y-1 flex-wrap mt-1.5 text-sm">
              {archetype && <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: archetype.color }}><Compass size={14} aria-hidden />Classe : {archetype.label}</span>}
              {candidate.location && <span className="inline-flex items-center gap-1 text-[var(--qx-cyan)]"><MapPin size={13} aria-hidden />{candidate.location}</span>}
            </div>
            {rank && (
              <div className="mt-4 max-w-[420px] mx-auto md:mx-0">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-[var(--kz-mute)]">{rank.progress} % vers {rank.nextTitle}</span>
                  <span className="font-bold text-[var(--qx-gold)] tabular-nums">{rank.xp.toLocaleString('fr-FR')} XP</span>
                </div>
                <div className="qx-xp" role="progressbar" aria-label={`Progression vers ${rank.nextTitle}`} aria-valuenow={rank.progress} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${Math.max(rank.progress, 3)}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:w-[220px] shrink-0">
            {candidate.cv_url && (
              <a href={candidate.cv_url} target="_blank" rel="noreferrer" className="flex-1">
                <Button kind="dark" size="md" full icon={<Download size={14} />}>
                  Telecharger le CV
                </Button>
              </a>
            )}
            <Button kind="primary" size="md" full icon={<MessageCircle size={14} />} className="flex-1"
              loading={messaging} onClick={handleMessage}>
              Envoyer un message
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        {/* Colonne gauche */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Attributs */}
          <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.06s' }}>
            <PanelTitle icon={<Shield size={15} />} title="Attributs" as="h2" />
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: candidate.xp?.toLocaleString('fr-FR') ?? '—', l: 'XP total', icon: <Sparkles size={13} />, t: 'var(--qx-gold)' },
                { v: candidate.streak ?? 0, l: 'Streak jours', icon: <Flame size={13} />, t: 'var(--kz-orange)' },
                { v: applications.length, l: 'Candidatures', icon: <ScrollText size={13} />, t: 'var(--qx-cyan)' },
              ].map((s) => (
                <div key={s.l} className="text-center p-2.5 rounded-xl border border-[#C084FC]/20 bg-[rgba(12,5,24,0.5)]" style={toneStyle(s.t)}>
                  <span aria-hidden className="flex justify-center mb-1" style={{ color: s.t }}>{s.icon}</span>
                  <div className="text-xl font-extrabold text-white tabular-nums leading-none">{String(s.v)}</div>
                  <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--kz-mute)] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.1s' }}>
            <PanelTitle icon={<Feather size={15} />} title="Contact" as="h2" tone="var(--qx-magenta)" />
            <div className="flex flex-col gap-2.5">
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-sm text-[var(--kz-ink)] hover:text-[var(--qx-magenta)] break-all transition-colors">
                <Mail size={14} className="text-[var(--kz-mute)] shrink-0" aria-hidden />
                {candidate.email}
              </a>
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`} className="flex items-center gap-2 text-sm text-[var(--kz-ink)] hover:text-[var(--qx-magenta)] transition-colors">
                  <Phone size={14} className="text-[var(--kz-mute)] shrink-0" aria-hidden />
                  {candidate.phone}
                </a>
              )}
            </div>
          </section>

          {/* Pitch vidéo */}
          {pitchUrl && (
            <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.14s' }}>
              <PanelTitle icon={<Play size={15} />} title="Pitch vidéo du candidat" as="h2" tone="var(--qx-cyan)" />
              <video
                src={pitchUrl}
                controls
                className="w-full rounded-xl border border-[var(--kz-edge)] bg-black"
                style={{ maxHeight: '220px' }}
              />
            </section>
          )}
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Classe (indicateur profil du quiz) */}
          {archetype && (
            <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.08s', boxShadow: `0 0 36px -14px ${archetype.color}` }}>
              <div className="flex items-start gap-3">
                <Sigil tone={archetype.color}><Compass size={16} /></Sigil>
                <div className="min-w-0">
                  <div className="kz-eyebrow" style={{ color: archetype.color }}>Classe du héros</div>
                  <h2 className="text-lg font-bold text-white mt-0.5">{archetype.label}</h2>
                  <p className="text-sm text-[var(--kz-text)] leading-relaxed mt-1.5">{archetype.recruiterHint}</p>
                </div>
              </div>
            </section>
          )}

          {(candidate.bio || talents.length > 0 || hobbies.length > 0) && (
            <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.12s' }}>
              <PanelTitle icon={<ScrollText size={15} />} title="Chronique" as="h2" />
              {candidate.bio && <p className="text-sm leading-relaxed text-[var(--kz-text)]">{candidate.bio}</p>}
              {talents.length > 0 && (
                <div className={candidate.bio ? 'mt-4' : ''}>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--kz-mute)] mb-2">Talents</p>
                  <div className="flex flex-wrap gap-1.5">
                    {talents.map((t) => (
                      <span key={t} className="text-[12px] font-semibold px-2.5 py-1 rounded-md border border-[#C084FC]/35 text-[#E9D5FF] bg-[rgba(168,85,247,0.12)]">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {hobbies.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--kz-mute)] mb-2">Passions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hobbies.map((h) => (
                      <span key={h} className="text-[12px] font-semibold px-2.5 py-1 rounded-md border border-[#22D3EE]/30 text-[#A5F3FC] bg-[rgba(34,211,238,0.08)]">{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* KazaPortfolio = artefacts */}
          {(links.length > 0 || reals.length > 0) && (
            <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.16s' }}>
              <PanelTitle icon={<Gem size={15} />} title="KazaPortfolio" hint="Les artefacts du héros" as="h2" tone="var(--qx-cyan)" />
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {links.map((l) => (
                    <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#22D3EE]/35 text-xs font-semibold text-[#A5F3FC] bg-[rgba(34,211,238,0.08)] hover:border-[#22D3EE]/70 hover:shadow-[0_0_16px_-6px_rgba(34,211,238,0.9)] transition-all">
                      {l.icon}{l.label}<ExternalLink size={10} aria-hidden />
                    </a>
                  ))}
                </div>
              )}
              {reals.length > 0 && (
                <div className="flex flex-col gap-2">
                  {reals.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl border border-[#C084FC]/20 bg-[rgba(12,5,24,0.5)]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{r.title}</span>
                        {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs font-semibold flex items-center gap-1 text-[var(--qx-magenta)] hover:underline">Voir <ExternalLink size={10} aria-hidden /></a>}
                      </div>
                      {r.description && <p className="text-xs text-[var(--kz-mute)] mt-0.5">{r.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {applications.length > 0 && (
            <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.2s' }}>
              <PanelTitle icon={<ScrollText size={15} />} title="Journal des quêtes" hint="Candidatures du héros à vos offres" as="h2" />
              <ol className="flex flex-col gap-2">
                {applications.map((app) => {
                  const statusInfo = APPLICATION_STATUSES[app.status] ?? { label: app.status, color: 'cream' }
                  const stageTone = STAGE_META[app.status]?.tone ?? 'var(--qx-neon)'
                  return (
                    <li key={app.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#C084FC]/15 bg-[rgba(12,5,24,0.45)]">
                      <span aria-hidden className="qxr-column-gem" style={toneStyle(stageTone)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{app.job?.title}</div>
                        <div className="text-xs text-[var(--kz-mute)] truncate">{app.job?.company?.name} · {timeAgo(app.created_at)}</div>
                      </div>
                      <Badge color={statusInfo.color as BadgeColor} size="sm">{statusInfo.label}</Badge>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
