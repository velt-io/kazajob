'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Map as MapIcon, MapPin, Sparkles, ArrowRight } from 'lucide-react'
import { computeJourney, journeySummary, RARITY_META, ROMAN } from '@/lib/quest-journey'
import type { Application, Profile } from '@/lib/types'

/**
 * Bannière « Mon aventure » du QG : chapitre en cours du parcours (mêmes règles
 * que la carte /candidat/quetes, données réelles du compte) + accès à la carte.
 */
export function JourneyBanner({ profile, applications, favoritesCount, skillsCount }: {
  profile: Profile | null
  applications: Application[]
  favoritesCount: number
  skillsCount: number
}) {
  const chapters = useMemo(() => computeJourney({
    hasAvatar: !!(profile?.avatar_config || profile?.avatar_url),
    profileFields: [profile?.location, profile?.bio, profile?.phone].filter(Boolean).length,
    skills: skillsCount,
    hasCv: !!(profile?.cv_url || profile?.cv_data),
    favorites: favoritesCount,
    applications: applications.filter((a) => a.status !== 'withdrawn').length,
    interviews: applications.filter((a) => ['interview', 'offer', 'hired'].includes(a.status)).length,
    hired: applications.filter((a) => a.status === 'hired').length,
  }), [profile, skillsCount, favoritesCount, applications])
  const summary = journeySummary(chapters)
  const current = summary.current ?? chapters[chapters.length - 1]
  const r = RARITY_META[current.rarity]

  return (
    <Link href="/candidat/quetes" aria-label={`Ouvrir la carte de l'aventure — chapitre ${ROMAN[current.index - 1]} : ${current.title}`}
      className="group block relative overflow-hidden rounded-[20px] border border-[#E879F9]/45 mb-6 qx-rise focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/50"
      style={{ background: 'radial-gradient(80% 140% at 100% 0%, rgba(232,121,249,0.28), transparent 60%), radial-gradient(60% 120% at 0% 100%, rgba(34,211,238,0.16), transparent 60%), linear-gradient(120deg, #2E1065, #1A0B2E 55%, #12081F)', boxShadow: `0 0 50px -18px ${r.glow}` }}>
      <span className="qxc-corners" aria-hidden />
      <div className="relative p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex-1 min-w-0">
          <p className="kz-eyebrow text-[var(--qx-gold)] mb-2 flex items-center gap-2"><MapIcon size={12} aria-hidden />Mon aventure · {summary.done} chapitres sur {summary.total} accomplis</p>
          <h2 className="text-[22px] sm:text-[28px] font-bold text-white leading-tight">
            {ROMAN[current.index - 1]}. <span className="qx-text-arcane">{current.title}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12px]">
            <span className="flex items-center gap-1 text-[var(--qx-cyan)]"><MapPin size={12} aria-hidden />{current.place}</span>
            <span className="font-bold uppercase tracking-[0.12em] text-[10px]" style={{ color: r.color }}>{r.label}</span>
            <span className="flex items-center gap-1 font-bold qx-text-legend"><Sparkles size={12} className="text-[var(--qx-gold)]" aria-hidden />+{current.xp} XP</span>
          </div>
          <div className="mt-3 max-w-[460px]">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="text-[var(--kz-text)] truncate">Objectif : {current.objective}</span>
              <span className="font-bold text-[var(--kz-mute)] tabular-nums shrink-0 ml-2">{current.progress} %</span>
            </div>
            <div className="qx-xp"><span style={{ width: `${Math.max(current.progress, 3)}%` }} /></div>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-4 shrink-0">
          {/* Chemin des 9 gemmes */}
          <ol className="flex items-center gap-1.5" aria-label={`${summary.done} chapitres terminés sur ${summary.total}`}>
            {chapters.map((c) => (
              <li key={c.id} title={`${ROMAN[c.index - 1]}. ${c.title}`}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-45 rounded-[3px] border ${c.status === 'done' ? 'bg-[#FACC15] border-[#FEF3C7] shadow-[0_0_10px_rgba(250,204,21,0.8)]' : c.status === 'current' ? 'bg-[#E879F9]/30 border-[#E879F9] qx-pulse' : 'bg-[rgba(124,58,237,0.15)] border-[#7C3AED]/50'}`} />
            ))}
          </ol>
          <span className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-bold uppercase tracking-[0.08em] text-[#1A0B2E] border border-[#FDE68A] bg-[linear-gradient(120deg,#FDE68A,#FACC15_45%,#F59E0B)] shadow-[0_0_22px_-4px_rgba(250,204,21,0.7)] group-hover:-translate-y-0.5 group-hover:shadow-[0_0_32px_-2px_rgba(250,204,21,0.9)] transition">
            Ouvrir la carte <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  )
}
