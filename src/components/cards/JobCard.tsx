'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Heart, Rocket, Briefcase, Wifi } from 'lucide-react'
import type { Job } from '@/lib/types'
import { formatSalary, timeAgo, cn } from '@/lib/utils'
import { ViewTransition } from 'react'
import { CompanyMark, MatchRing } from '@/components/os/candidate/primitives'

interface JobCardProps {
  job: Job
  isFavorite?: boolean
  onToggleFavorite?: (jobId: string) => void
  showMatch?: boolean
  compact?: boolean
  /** Index dans la liste : décale l'animation d'entrée (cascade). */
  index?: number
}

/**
 * Carte d'offre — thème OS 2027 : surface sombre sans flou (listes longues),
 * pastille d'entreprise façon icône d'app, anneau de compatibilité, cœur qui
 * « éclate ». Le titre morphe vers la page détail (View Transition partagée).
 */
export function JobCard({ job, isFavorite, onToggleFavorite, showMatch = true, compact, index = 0 }: JobCardProps) {
  const [popped, setPopped] = useState(false)
  const [now] = useState(() => Date.now())
  const isNew = now - new Date(job.created_at).getTime() < 86400000 * 3
  const isBoosted = !!job.is_boosted

  return (
    <article
      className={cn(
        'osc-in osc-lift group relative flex flex-col gap-4 p-5 rounded-[24px] border border-[var(--kz-edge)]',
        'bg-[color-mix(in_srgb,var(--kz-ink)_4.5%,transparent)] shadow-[inset_0_1px_0_color-mix(in_srgb,white_6%,transparent),0_18px_40px_-28px_rgba(0,0,0,0.9)]',
        isBoosted && 'os-ring-aurora',
      )}
      style={{ ['--i' as string]: index }}
    >
      <div className="flex gap-3 items-start">
        <CompanyMark name={job.company?.name} size={44} />
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--kz-mute)] min-w-0">
            <span className="truncate">{job.company?.name}</span>
            {isBoosted ? (
              <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold text-[var(--kz-orange)]">
                <Rocket size={11} />À la une
              </span>
            ) : isNew ? (
              <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold text-[var(--kz-blue)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--kz-blue)]" />Nouveau
              </span>
            ) : null}
          </div>
          <ViewTransition name={`job-title-${job.id}`} share="morph">
            <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)] mt-0.5 leading-snug line-clamp-2">
              {job.title}
            </h3>
          </ViewTransition>
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPopped(true); onToggleFavorite(job.id) }}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={!!isFavorite}
            data-pop={popped && !!isFavorite}
            className="osc-heart osc-press relative z-10 -mr-1.5 -mt-1.5 w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[var(--kz-mute)] hover:text-[var(--kz-ink)] hover:bg-[var(--kz-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]"
          >
            <Heart size={18} fill={isFavorite ? 'var(--osc-love, var(--kz-orange))' : 'none'} color={isFavorite ? 'var(--osc-love, var(--kz-orange))' : 'currentColor'} />
          </button>
        )}
      </div>

      {!compact && (
        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[13px] text-[var(--kz-text)]">
          <span className="inline-flex items-center gap-1"><MapPin size={13} className="text-[var(--kz-mute)]" />{job.location}</span>
          <span className="inline-flex items-center gap-1"><Briefcase size={13} className="text-[var(--kz-mute)]" />{job.job_type}</span>
          {job.remote && <span className="inline-flex items-center gap-1 text-[var(--kz-green)]"><Wifi size={13} />Télétravail</span>}
        </div>
      )}

      {!compact && !!job.skills?.length && (
        <div className="flex gap-1.5 flex-wrap -mt-1">
          {job.skills.slice(0, 3).map((s) => (
            <span key={s.id} className="px-2.5 h-6 inline-flex items-center rounded-full text-[11px] font-medium text-[var(--kz-text)] bg-[var(--kz-line)]">{s.name}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex justify-between items-end gap-3 pt-3 border-t border-[var(--kz-line)]">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--kz-ink)] truncate">
            {formatSalary(job.salary_min, job.salary_max)}
          </div>
          <div className="text-[11px] text-[var(--kz-mute)] mt-0.5">
            {compact ? job.location : timeAgo(job.created_at)}
          </div>
        </div>
        {showMatch && job.match_score !== undefined && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-medium text-[var(--kz-mute)] hidden min-[380px]:inline">compatible</span>
            <MatchRing value={job.match_score} size={38} stroke={4} />
          </div>
        )}
      </div>

      <Link
        href={`/candidat/offres/${job.id}`}
        className="absolute inset-0 rounded-[24px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]"
        aria-label={`${job.title}${job.company?.name ? ` — ${job.company.name}` : ''}`}
      />
    </article>
  )
}
