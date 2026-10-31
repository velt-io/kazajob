'use client'

import Link from 'next/link'
import { ViewTransition } from 'react'
import { MapPin, ArrowUpRight } from 'lucide-react'
import type { Job } from '@/lib/types'
import { formatSalary } from '@/lib/utils'
import { CompanyMark, MatchRing, markGradient } from './primitives'

/**
 * Grande carte « À la une » façon onglet Aujourd'hui de l'App Store :
 * couleur d'entreprise en fond, grande typo, reflet au survol.
 * Le titre partage sa View Transition avec la page détail.
 */
export function FeaturedJobCard({ job, eyebrow, index = 0 }: { job: Job; eyebrow: string; index?: number }) {
  const company = job.company?.name ?? 'Entreprise'
  return (
    <article
      className="osc-in osc-shine osc-lift group relative min-h-[300px] sm:min-h-[340px] rounded-[30px] overflow-hidden border border-[var(--kz-edge)] flex flex-col justify-between p-6"
      style={{ ['--i' as string]: index, background: markGradient(company) }}
    >
      {/* Voile pour la lisibilité + halo lumineux */}
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.25)_45%,rgba(0,0,0,0.78)_100%)]" />
      <div aria-hidden className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/25 blur-3xl transition-transform duration-700 group-hover:scale-125" />

      <div className="relative">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/75">{eyebrow}</p>
        <ViewTransition name={`job-title-${job.id}`} share="morph">
          <h3 className="mt-2 text-[26px] sm:text-[30px] font-semibold tracking-[-0.04em] leading-[1.05] text-white line-clamp-3 max-w-[22ch]">
            {job.title}
          </h3>
        </ViewTransition>
        <p className="mt-2 text-[15px] font-medium text-white/80">{formatSalary(job.salary_min, job.salary_max)}</p>
      </div>

      <div className="relative flex items-center gap-3 pt-6">
        <CompanyMark name={company} size={44} className="ring-1 ring-white/30" />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-white truncate">{company}</div>
          <div className="text-[12px] text-white/70 flex items-center gap-1 truncate"><MapPin size={11} />{job.location} · {job.job_type}</div>
        </div>
        {job.match_score !== undefined ? (
          <span className="rounded-full bg-black/30 p-1"><MatchRing value={job.match_score} size={40} stroke={4} /></span>
        ) : (
          <span className="inline-flex items-center gap-1 h-8 px-3.5 rounded-full bg-white/90 text-black text-[13px] font-semibold">
            Voir <ArrowUpRight size={14} />
          </span>
        )}
      </div>

      <Link href={`/candidat/offres/${job.id}`} className="absolute inset-0 z-[2] rounded-[30px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={`${job.title} — ${company}`} />
    </article>
  )
}
