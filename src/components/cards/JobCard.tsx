'use client'

import Link from 'next/link'
import { MapPin, Heart, Sparkles, Rocket, Coins, Clock } from 'lucide-react'
import type { Job } from '@/lib/types'
import { formatSalary, timeAgo } from '@/lib/utils'
import { ViewTransition } from 'react'
import { bountyRarity, isFresh } from '@/components/quest/candidat/quest-ui'
import { Crest, RarityBadge, rarityVars } from '@/components/quest/candidat/QuestKit'

interface JobCardProps {
  job: Job
  isFavorite?: boolean
  onToggleFavorite?: (jobId: string) => void
  showMatch?: boolean
  compact?: boolean
}

/**
 * Offre d'emploi présentée comme une « prime » de tableau de guilde (thème Quest).
 * La rareté découle des vraies données (compatibilité, mise en avant, salaire).
 */
export function JobCard({ job, isFavorite, onToggleFavorite, showMatch = true, compact }: JobCardProps) {
  const companyInitials = (job.company?.name ?? 'CO').slice(0, 2).toUpperCase()
  const isNew = isFresh(job.created_at)
  const isBoosted = !!job.is_boosted
  const { rarity, reasons } = bountyRarity(job)
  const hasSalary = !!(job.salary_min || job.salary_max)

  return (
    <article
      data-tilt
      className={`qxc-card ${rarity === 'legendaire' ? 'qxc-legend' : ''} p-4 sm:p-5 flex flex-col gap-3.5 group min-w-0`}
      style={rarityVars(rarity)}
      title={reasons.length ? reasons.join(' · ') : undefined}
    >
      {isBoosted && (
        <span className="qxc-seal absolute -top-3 -right-2 w-10 h-10 z-10 pointer-events-none" aria-hidden>
          <Rocket size={16} />
        </span>
      )}

      <div className="flex gap-3 items-start">
        <Crest rarity={rarity} size={compact ? 42 : 48}>{companyInitials}</Crest>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--kz-mute)] truncate">{job.company?.name}</div>
          <ViewTransition name={`job-title-${job.id}`} share="morph">
            <div className="text-[15px] sm:text-base font-bold text-white mt-0.5 leading-snug line-clamp-2 font-[family-name:var(--font-epic)] tracking-wide">
              {job.title}
            </div>
          </ViewTransition>
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(job.id) }}
            aria-label={isFavorite ? `Retirer « ${job.title} » des favoris` : `Ajouter « ${job.title} » aux favoris`}
            aria-pressed={!!isFavorite}
            className="relative z-10 shrink-0 w-9 h-9 -mt-1 -mr-1 grid place-items-center rounded-lg text-[var(--kz-mute)] hover:text-[var(--qx-magenta)] hover:bg-[rgba(232,121,249,0.12)] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/40"
          >
            <Heart size={18} fill={isFavorite ? 'var(--qx-magenta)' : 'none'} color={isFavorite ? 'var(--qx-magenta)' : 'currentColor'} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <RarityBadge rarity={rarity} size="sm" />
        {isBoosted && <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md text-[#F5D0FE] border border-[#E879F9]/50 bg-[rgba(232,121,249,0.12)]">À la une</span>}
        {isNew && <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md text-[#67E8F9] border border-[#22D3EE]/50 bg-[rgba(34,211,238,0.1)]">Nouveau</span>}
      </div>

      {!compact && (
        <div className="flex gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md text-[var(--kz-ink)] bg-[rgba(168,85,247,0.12)] border border-[#C084FC]/25">{job.job_type}</span>
          {job.remote && <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md text-[#86EFAC] bg-[rgba(74,222,128,0.1)] border border-[#4ADE80]/30">Télétravail</span>}
          {job.skills?.slice(0, 2).map((s) => (
            <span key={s.id} className="px-2 py-0.5 text-[11px] font-semibold rounded-md text-[var(--kz-text)] bg-[rgba(12,5,24,0.5)] border border-[#C084FC]/20 max-w-[140px] truncate">{s.name}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex justify-between items-end gap-3 pt-3 border-t border-[#C084FC]/15">
        <div className="flex flex-col gap-1 min-w-0">
          <div className={`flex items-center gap-1.5 text-[13px] font-bold min-w-0 ${hasSalary ? '' : 'text-[var(--kz-mute)]'}`}>
            <Coins size={13} className="text-[var(--qx-gold)] shrink-0" aria-hidden />
            <span className={`truncate ${hasSalary ? 'qx-text-legend' : ''}`}>{formatSalary(job.salary_min, job.salary_max)}</span>
          </div>
          <div className="flex items-center gap-1 text-[12px] text-[var(--kz-text)] min-w-0">
            <MapPin size={11} className="text-[var(--qx-cyan)] shrink-0" aria-hidden />
            <span className="truncate">{job.location}</span>
          </div>
        </div>
        {showMatch && job.match_score !== undefined && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-bold text-white border border-[#E879F9]/50 bg-[rgba(232,121,249,0.14)] shadow-[0_0_14px_-4px_rgba(232,121,249,0.8)]"
            aria-label={`Compatibilité ${job.match_score} %`}>
            <Sparkles size={11} className="text-[var(--qx-magenta)]" aria-hidden />{job.match_score}%
          </span>
        )}
        {!showMatch && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] text-[var(--kz-mute)]"><Clock size={10} aria-hidden />{timeAgo(job.created_at)}</span>
        )}
      </div>

      <Link href={`/candidat/offres/${job.id}`} className="absolute inset-0 rounded-[18px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/50" aria-label={`Voir la prime : ${job.title}${job.company?.name ? ` chez ${job.company.name}` : ''}`} />
    </article>
  )
}
