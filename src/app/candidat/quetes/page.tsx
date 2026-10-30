'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Lock, MapPin, Sparkles, Swords, Crown, ScrollText } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import { useApplications } from '@/features/applications/useApplications'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useGamification } from '@/features/gamification/useGamification'
import { QuestMap } from '@/components/quest/QuestMap'
import { island } from '@/lib/island'
import { computeJourney, journeySummary, RARITY_META, ROMAN, type Chapter } from '@/lib/quest-journey'

export default function AdventurePage() {
  const { profile } = useAuth()
  const { applications, loading: appsLoading } = useApplications(profile?.id)
  const { favorites } = useFavorites(profile?.id)
  const gami = useGamification(profile, applications.length, favorites.length)
  const [skills, setSkills] = useState<number | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    fetch('/api/candidate-skills')
      .then((r) => (r.ok ? r.json() : []))
      .then((s: unknown[]) => setSkills(Array.isArray(s) ? s.length : 0))
      .catch(() => {})
  }, [profile?.id])

  const chapters = useMemo(() => computeJourney({
    hasAvatar: !!(profile?.avatar_config || profile?.avatar_url),
    profileFields: [profile?.location, profile?.bio, profile?.phone].filter(Boolean).length,
    skills: skills ?? 0,
    hasCv: !!(profile?.cv_url || profile?.cv_data),
    favorites: favorites.length,
    applications: applications.filter((a) => a.status !== 'withdrawn').length,
    interviews: applications.filter((a) => ['interview', 'offer', 'hired'].includes(a.status)).length,
    hired: applications.filter((a) => a.status === 'hired').length,
  }), [profile, skills, favorites.length, applications])

  const summary = journeySummary(chapters)

  // Surprise : chapitre terminé depuis la dernière visite → bannière « Quête accomplie ».
  // Première visite : on mémorise l'état sans rien annoncer.
  const ready = !!profile && !appsLoading && skills !== null
  useEffect(() => {
    if (!ready || !profile) return
    const key = `kz-quest-done:${profile.id}`
    const done = chapters.filter((c) => c.status === 'done').map((c) => c.id)
    let seen: string[] | null = null
    try { seen = JSON.parse(localStorage.getItem(key) ?? 'null') } catch { /* stockage indisponible */ }
    try { localStorage.setItem(key, JSON.stringify(done)) } catch { /* stockage indisponible */ }
    if (!seen) return
    const fresh = chapters.find((c) => c.status === 'done' && !seen.includes(c.id))
    if (fresh) island({ title: `Quête accomplie : ${fresh.title}`, subtitle: `+${fresh.xp} XP · ${RARITY_META[fresh.rarity].label}`, tone: 'success' })
  }, [ready, profile, chapters])
  const active = chapters.find((c) => c.id === selected) ?? summary.current ?? chapters[chapters.length - 1]

  return (
    <div className="max-w-[1280px] mx-auto">
      {/* En-tête du héros */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6 qx-rise">
        <div>
          <p className="kz-eyebrow text-[var(--qx-neon)] mb-2">Carte du monde · La Réunion</p>
          <h1 className="text-[34px] lg:text-[46px] font-bold text-white leading-none">
            L&apos;aventure de <span className="qx-text-arcane">{profile?.full_name?.split(' ')[0] ?? 'héros'}</span>
          </h1>
          <p className="text-[15px] text-[var(--kz-mute)] mt-2">
            Chapitre {Math.min(summary.done + 1, summary.total)} sur {summary.total} · du lagon au sommet du Piton.
          </p>
        </div>
        <div className="qx-panel px-5 py-4 min-w-[300px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-white">{gami.level.emoji} Niveau {gami.level.level} · {gami.level.title}</span>
            <span className="text-[12px] font-bold text-[var(--qx-gold)]">{gami.xp.toLocaleString('fr-FR')} XP</span>
          </div>
          <div className="qx-xp"><span style={{ width: `${gami.xpProgress}%` }} /></div>
          <div className="text-[11px] text-[var(--kz-mute)] mt-1.5">{gami.xpProgress} % vers {gami.nextLevel.title}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Carte 3D */}
        <section className="lg:col-span-8 qx-panel overflow-hidden qx-rise" style={{ animationDelay: '0.1s' }}>
          <QuestMap chapters={chapters} selectedId={active?.id ?? null} onSelect={setSelected} className="h-[420px] sm:h-[560px]" />
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#C084FC]/20 text-[12px] text-[var(--kz-mute)]">
            <span className="flex items-center gap-3 flex-wrap">
              <Legend color="#FACC15" label="Terminé" /><Legend color="#E879F9" label="Quête principale" /><Legend color="#7C3AED" label="À découvrir" />
            </span>
            <span className="hidden sm:inline">Glisse pour tourner autour de l&apos;île · clique une gemme</span>
          </div>
        </section>

        {/* Journal de quête */}
        <aside className="lg:col-span-4 flex flex-col gap-5">
          {active && <ChapterCard chapter={active} />}
          <div className="qx-panel p-4 qx-rise" style={{ animationDelay: '0.25s' }}>
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-white mb-3"><ScrollText size={16} className="text-[var(--qx-gold)]" /> Journal de quête</h2>
            <ol className="flex flex-col gap-1">
              {chapters.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setSelected(c.id)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${active?.id === c.id ? 'bg-[rgba(168,85,247,0.18)]' : 'hover:bg-[rgba(168,85,247,0.1)]'}`}>
                    <StatusIcon chapter={c} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] font-semibold truncate ${c.status === 'done' ? 'text-[var(--kz-mute)]' : 'text-white'}`}>{ROMAN[c.index - 1]}. {c.title}</div>
                      <div className="text-[11px] text-[var(--kz-mute)] truncate">{c.place}</div>
                    </div>
                    <span className="text-[11px] font-bold shrink-0" style={{ color: RARITY_META[c.rarity].color }}>+{c.xp}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-3 pt-3 border-t border-[#C084FC]/20 flex items-center justify-between text-[12px]">
              <span className="text-[var(--kz-mute)]">Trésor cumulé</span>
              <span className="font-bold qx-text-legend">{summary.xpEarned} / {summary.xpTotal} XP</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rotate-45" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />{label}</span>
}

function StatusIcon({ chapter }: { chapter: Chapter }) {
  if (chapter.status === 'done') return <span className="w-7 h-7 rounded-md flex items-center justify-center bg-[#FACC15] text-[#1A0B2E] shrink-0"><Check size={14} strokeWidth={3} /></span>
  if (chapter.status === 'current') return <span className="w-7 h-7 rounded-md flex items-center justify-center bg-[#E879F9]/20 border border-[#E879F9] text-[#F0ABFC] shrink-0 qx-pulse"><Swords size={14} /></span>
  return <span className="w-7 h-7 rounded-md flex items-center justify-center bg-[rgba(124,58,237,0.15)] border border-[#7C3AED]/50 text-[#A78BFA] shrink-0"><Lock size={12} /></span>
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const r = RARITY_META[chapter.rarity]
  return (
    <div key={chapter.id} className="qx-panel p-5 qx-rise" style={{ boxShadow: `0 0 40px -12px ${r.glow}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--kz-mute)]">Chapitre {ROMAN[chapter.index - 1]}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded border" style={{ color: r.color, borderColor: r.color, background: `color-mix(in srgb, ${r.color} 12%, transparent)` }}>
          {chapter.rarity === 'legendaire' ? <Crown size={10} className="inline -mt-0.5 mr-1" /> : null}{r.label}
        </span>
      </div>
      <h2 className="text-[24px] font-bold text-white leading-tight">{chapter.title}</h2>
      <div className="flex items-center gap-1 text-[12px] text-[var(--qx-cyan)] mt-1"><MapPin size={12} />{chapter.place}</div>
      <p className="text-[14px] leading-relaxed text-[var(--kz-text)] mt-3 italic">« {chapter.lore} »</p>

      <div className="mt-4 rounded-xl border border-[#C084FC]/25 bg-[rgba(12,5,24,0.6)] p-3">
        <div className="flex items-center justify-between text-[12px] mb-2">
          <span className="font-semibold text-white">Objectif : {chapter.objective}</span>
          <span className="font-bold text-[var(--kz-mute)] tabular-nums">{chapter.progress} %</span>
        </div>
        <div className="qx-xp"><span style={{ width: `${Math.max(chapter.progress, 3)}%` }} /></div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="flex items-center gap-1.5 text-[13px] font-bold qx-text-legend"><Sparkles size={14} className="text-[var(--qx-gold)]" />Récompense : {chapter.xp} XP</span>
        {chapter.status === 'done' ? (
          <span className="flex items-center gap-1 text-[12px] font-bold text-[#FACC15]"><Check size={14} />Accomplie</span>
        ) : (
          <Link href={chapter.href} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-bold uppercase tracking-[0.08em] text-white border border-[#F0ABFC]/60 bg-[linear-gradient(120deg,#7C3AED,#A855F7_45%,#E879F9)] shadow-[0_0_22px_-4px_rgba(232,121,249,0.75)] hover:-translate-y-0.5 transition">
            {chapter.cta}
          </Link>
        )}
      </div>
    </div>
  )
}
