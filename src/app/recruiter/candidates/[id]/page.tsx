'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, Mail, Phone, Download, MessageCircle, Briefcase, FolderGit2, Globe, FileText, ExternalLink, Play, Compass, Flame, Zap, Send, UserX, CalendarDays, ArrowUpRight } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { useStartConversation } from '@/features/messages/useMessages'
import { ARCHETYPES, type ArchetypeKey } from '@/lib/quiz'
import type { Profile, Application } from '@/lib/types'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import {
  ACCENT, APP_STATUS_ACCENT, CountUp, EmptyPanel, SkeletonList, StatusPill, Widget, accentStyle, tint,
} from '@/components/os/recruiter/primitives'

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
    if (convId) router.push(`/recruiter/messages?c=${convId}`)
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

  const back = (
    <button onClick={() => router.back()} className="group inline-flex items-center gap-0.5 text-[15px] font-medium text-[var(--kz-blue)] hover:brightness-125 mb-5 -ml-1">
      <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
      Retour
    </button>
  )

  if (loading) {
    return (
      <div className="max-w-[1080px] mx-auto">
        {back}
        <div className="osr-skel h-[240px] rounded-[28px] mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4"><SkeletonList rows={3} height={140} /><SkeletonList rows={2} height={180} /></div>
      </div>
    )
  }
  if (!candidate) {
    return (
      <div className="max-w-[1080px] mx-auto">
        {back}
        <div className="os-glass rounded-[28px]"><EmptyPanel icon={<UserX size={28} />} title="Candidat introuvable." description="Ce profil n’existe plus ou n’est pas accessible." /></div>
      </div>
    )
  }

  const pitchUrl = (candidate as unknown as Record<string, unknown>).video_pitch_url as string | null
  const archetype = candidate.quiz_result?.archetype && ARCHETYPES[candidate.quiz_result.archetype as ArchetypeKey]
    ? ARCHETYPES[candidate.quiz_result.archetype as ArchetypeKey] : null
  const pf = candidate as unknown as {
    linkedin_url?: string | null; github_url?: string | null; portfolio_url?: string | null
    portfolio_pdf_url?: string | null; realisations?: { title: string; description?: string; url?: string }[] | null
  }
  const links = [
    pf.linkedin_url && { label: 'LinkedIn', href: pf.linkedin_url, icon: <Briefcase size={14} />, accent: ACCENT.blue },
    pf.github_url && { label: 'GitHub', href: pf.github_url, icon: <FolderGit2 size={14} />, accent: ACCENT.mute },
    pf.portfolio_url && { label: 'Portfolio', href: pf.portfolio_url, icon: <Globe size={14} />, accent: ACCENT.violet },
    pf.portfolio_pdf_url && { label: 'Portfolio PDF', href: pf.portfolio_pdf_url, icon: <FileText size={14} />, accent: ACCENT.orange },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode; accent: string }[]
  const reals = pf.realisations ?? []
  const accent = archetype?.color ?? ACCENT.violet

  return (
    <div className="max-w-[1080px] mx-auto">
      {back}

      {/* Fiche contact */}
      <div className="relative overflow-hidden rounded-[30px] os-glass mb-4">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[120px] opacity-70"
          style={{ background: `radial-gradient(120% 140% at 15% 0%, ${tint(accent, 45)}, transparent 60%), radial-gradient(90% 120% at 100% 0%, ${tint(ACCENT.blue, 35)}, transparent 60%)` }} />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5 px-6 pt-8 pb-6 text-center sm:text-left">
          <span className="os-pop rounded-full p-[3px] shrink-0" style={{ background: 'var(--os-aurora)', boxShadow: `0 20px 50px -18px ${accent}` }}>
            <span className="block rounded-full p-[3px] bg-[var(--kz-inverse)]">
              <Avatar name={candidate.full_name} src={candidate.avatar_url} avatarConfig={candidate.avatar_config} size={104} color={tint(accent, 25)} />
            </span>
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-[30px] sm:text-[38px] font-semibold tracking-[-0.045em] leading-[1.05] text-white break-words">{candidate.full_name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 mt-2 text-[14px] text-[var(--kz-mute)]">
              {candidate.location && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {candidate.location}</span>}
              {archetype && <span className="inline-flex items-center gap-1.5" style={{ color: `color-mix(in srgb, ${accent} 80%, white)` }}><Compass size={14} />{archetype.label}</span>}
              <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> Membre depuis {new Date(candidate.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Actions rapides (façon Contacts) */}
        <div className="relative grid grid-cols-4 gap-2 px-4 sm:px-6 pb-6 max-w-[560px] mx-auto sm:mx-0">
          <QuickAction label="Message" onClick={handleMessage} loading={messaging} icon={<MessageCircle size={19} />} accent={ACCENT.blue} />
          <QuickAction label="E-mail" href={`mailto:${candidate.email}`} icon={<Mail size={19} />} accent={ACCENT.indigo} />
          <QuickAction label="Appeler" href={candidate.phone ? `tel:${candidate.phone}` : undefined} icon={<Phone size={19} />} accent={ACCENT.green} />
          <QuickAction label="CV" href={candidate.cv_url ?? undefined} external icon={<Download size={19} />} accent={ACCENT.orange} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
        {/* Colonne principale */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Indicateur profil (quiz) */}
          {archetype && (
            <div className="osr-panel osr-glow p-5 flex items-start gap-4" style={accentStyle(accent)}>
              <span className="w-12 h-12 rounded-[15px] flex items-center justify-center text-white shrink-0"
                style={{ background: `linear-gradient(145deg, ${accent}, ${tint(accent, 55)})`, boxShadow: `0 14px 30px -14px ${accent}` }}>
                <Compass size={22} />
              </span>
              <div className="min-w-0">
                <div className="osr-eyebrow !text-[11px]" style={{ color: `color-mix(in srgb, ${accent} 80%, white)` }}>Profil candidat</div>
                <div className="text-[20px] font-semibold tracking-[-0.02em] text-white">{archetype.label}</div>
                <p className="text-[14px] text-[var(--kz-text)] leading-relaxed mt-1">{archetype.recruiterHint}</p>
              </div>
            </div>
          )}

          {candidate.bio && (
            <Widget title="Bio" glass={false}>
              <p className="text-[15px] leading-relaxed text-[var(--kz-text)] whitespace-pre-line">{candidate.bio}</p>
            </Widget>
          )}

          {/* KazaPortfolio */}
          {(links.length > 0 || reals.length > 0) && (
            <Widget title="KazaPortfolio" glass={false}>
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {links.map((l) => (
                    <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                      className="group inline-flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-full text-[13px] font-semibold text-white transition hover:brightness-125 active:scale-[0.97]"
                      style={{ background: tint(l.accent, 16) }}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: l.accent }}>{l.icon}</span>
                      {l.label}<ArrowUpRight size={13} className="text-[var(--kz-mute)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ))}
                </div>
              )}
              {reals.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reals.map((r, i) => (
                    <div key={i} className="osr-inset p-3.5 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[14px] font-semibold text-white">{r.title}</span>
                        {r.url && <a href={r.url} target="_blank" rel="noreferrer" aria-label={`Voir ${r.title}`} className="osr-icon-btn !w-7 !h-7 shrink-0"><ExternalLink size={13} /></a>}
                      </div>
                      {r.description && <p className="text-[12px] text-[var(--kz-mute)] mt-1 leading-relaxed">{r.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Widget>
          )}

          {applications.length > 0 && (
            <Widget title="Candidatures" sub={`${applications.length} au total`} glass={false} bodyClassName="px-3 pb-3">
              <ol className="relative">
                {applications.map((app, i) => {
                  const statusInfo = APPLICATION_STATUSES[app.status] ?? { label: app.status, color: 'cream' }
                  const a = APP_STATUS_ACCENT[app.status] ?? ACCENT.mute
                  return (
                    <li key={app.id} className="osr-row osr-in flex items-center gap-3 px-2 py-3" style={{ ['--i' as string]: i }}>
                      <span className="relative flex flex-col items-center self-stretch w-3 shrink-0" aria-hidden>
                        <span className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ background: a, boxShadow: `0 0 0 4px ${tint(a, 18)}` }} />
                        {i < applications.length - 1 && <span className="flex-1 w-px bg-white/10 mt-1.5 -mb-4" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-white truncate">{app.job?.title}</div>
                        <div className="text-[12px] text-[var(--kz-mute)] truncate">{app.job?.company?.name} · {timeAgo(app.created_at)}</div>
                      </div>
                      <StatusPill accent={a}>{statusInfo.label}</StatusPill>
                    </li>
                  )
                })}
              </ol>
            </Widget>
          )}

          {!archetype && !candidate.bio && links.length === 0 && reals.length === 0 && applications.length === 0 && (
            <div className="osr-panel p-6 text-[14px] text-[var(--kz-mute)] text-center">Ce candidat n’a pas encore complété son profil.</div>
          )}
        </div>

        {/* Inspecteur */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-0 min-w-0" aria-label="Informations">
          <div className="osr-panel overflow-hidden">
            <div className="px-5 pt-4 pb-2 osr-eyebrow !text-[11px]">Contact</div>
            <dl className="osr-sep px-5 pb-2">
              <InfoRow icon={<Mail size={14} />} label="E-mail" value={<a href={`mailto:${candidate.email}`} className="text-[var(--kz-blue)] hover:brightness-125 break-all">{candidate.email}</a>} />
              {candidate.phone && <InfoRow icon={<Phone size={14} />} label="Téléphone" value={<a href={`tel:${candidate.phone}`} className="text-[var(--kz-blue)] hover:brightness-125">{candidate.phone}</a>} />}
              {candidate.location && <InfoRow icon={<MapPin size={14} />} label="Ville" value={candidate.location} />}
            </dl>
            {candidate.cv_url && (
              <div className="px-5 pb-5 pt-1">
                <a href={candidate.cv_url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 h-11 rounded-full text-[14px] font-semibold text-white bg-[linear-gradient(120deg,var(--kz-orange),var(--osr-pink)_45%,var(--kz-violet))] shadow-[0_10px_30px_-12px_rgba(255,55,95,0.7)] hover:brightness-110 active:scale-[0.98] transition">
                  <Download size={15} /> Télécharger le CV
                </a>
              </div>
            )}
          </div>

          <div className="osr-panel p-5">
            <div className="osr-eyebrow !text-[11px] mb-3">Stats</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: candidate.xp ?? 0, l: 'XP total', icon: <Zap size={13} />, a: ACCENT.pink, empty: candidate.xp == null },
                { v: candidate.streak ?? 0, l: 'Streak jours', icon: <Flame size={13} />, a: ACCENT.orange },
                { v: applications.length, l: 'Candidatures', icon: <Send size={13} />, a: ACCENT.blue },
              ].map((s) => (
                <div key={s.l} className="osr-inset p-3 min-w-0">
                  <span className="inline-flex" style={{ color: s.a }}>{s.icon}</span>
                  <div className="text-[22px] font-semibold tracking-[-0.04em] text-white leading-none mt-2">
                    {s.empty ? '—' : <CountUp value={s.v} />}
                  </div>
                  <div className="text-[11px] text-[var(--kz-mute)] mt-1 truncate">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pitch vidéo */}
          {pitchUrl && (
            <div className="osr-panel p-4">
              <div className="osr-eyebrow !text-[11px] mb-2.5 flex items-center gap-1.5"><Play size={11} /> Pitch vidéo du candidat</div>
              <video
                src={pitchUrl}
                controls
                className="w-full rounded-2xl border border-white/10 bg-black"
                style={{ maxHeight: '220px' }}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function QuickAction({ label, icon, accent, onClick, href, external, loading }: {
  label: string
  icon: React.ReactNode
  accent: string
  onClick?: () => void
  href?: string
  external?: boolean
  loading?: boolean
}) {
  const disabled = !onClick && !href
  const inner = (
    <>
      <span className="w-full h-12 rounded-[16px] flex items-center justify-center transition-all duration-300 group-hover:brightness-125 group-active:scale-95"
        style={{ background: disabled ? 'var(--osr-fill)' : tint(accent, 18), color: disabled ? 'var(--kz-mute)' : `color-mix(in srgb, ${accent} 85%, white)` }}>
        {loading ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon}
      </span>
      <span className={`text-[12px] font-medium mt-1.5 ${disabled ? 'text-[var(--kz-mute)]' : 'text-[var(--kz-text)]'}`}>{label}</span>
    </>
  )
  const cls = 'group flex flex-col items-center min-w-0 rounded-[16px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--kz-blue)_40%,transparent)]'
  if (disabled) return <span className={`${cls} opacity-60`} aria-disabled="true" title={`${label} indisponible`}>{inner}</span>
  if (href) return <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{inner}</a>
  return <button type="button" onClick={onClick} disabled={loading} className={cls}>{inner}</button>
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0 text-[var(--kz-mute)] bg-white/[0.06]">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] text-[var(--kz-mute)]">{label}</dt>
        <dd className="text-[14px] text-white mt-0.5">{value}</dd>
      </div>
    </div>
  )
}
