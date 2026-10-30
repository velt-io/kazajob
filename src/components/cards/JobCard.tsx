'use client'

import Link from 'next/link'
import { MapPin, Heart, Sparkles, Rocket } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import type { Job } from '@/lib/types'
import { formatSalary, timeAgo } from '@/lib/utils'
import { KZ } from '@/lib/constants'
import { ViewTransition } from 'react'

const COMPANY_COLORS = [
  KZ.orangeSoft, KZ.violetSoft, KZ.greenSoft, KZ.yellowSoft, KZ.blueSoft,
]

interface JobCardProps {
  job: Job
  isFavorite?: boolean
  onToggleFavorite?: (jobId: string) => void
  showMatch?: boolean
  compact?: boolean
}

export function JobCard({ job, isFavorite, onToggleFavorite, showMatch = true, compact }: JobCardProps) {
  const color = COMPANY_COLORS[(job.company?.name?.charCodeAt(0) ?? 0) % COMPANY_COLORS.length]
  const companyInitials = (job.company?.name ?? 'CO').slice(0, 2).toUpperCase()
  const isNew = Date.now() - new Date(job.created_at).getTime() < 86400000 * 3
  const isBoosted = !!job.is_boosted

  return (
    <div
      className="kz-card p-5 bg-[var(--kz-paper)] flex flex-col gap-3.5 relative group hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_var(--kz-shadow)] transition-all duration-100"
      style={isBoosted ? { borderColor: KZ.orange, boxShadow: '4px 4px 0 ' + KZ.orange } : undefined}
    >
      {isBoosted && (
        <div className="absolute -top-3 left-4" style={{ transform: 'rotate(-5deg)' }}>
          <Badge color="orange" size="sm"><span className="flex items-center gap-1"><Rocket size={10} />À la une</span></Badge>
        </div>
      )}
      {isNew && !isBoosted && (
        <div className="absolute -top-3 right-4" style={{ transform: 'rotate(6deg)' }}>
          <Badge color="orange" size="sm">Nouveau</Badge>
        </div>
      )}

      <div className="flex gap-3 items-start">
        <div
          className="w-12 h-12 rounded-lg border border-[var(--kz-edge)] flex items-center justify-center font-bold text-[var(--kz-ink)] shrink-0 text-base"
          style={{ background: color }}
        >
          {companyInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[var(--kz-mute)]">{job.company?.name}</div>
          <ViewTransition name={`job-title-${job.id}`} share="morph">
            <div className="text-base font-bold text-[var(--kz-ink)] mt-0.5 leading-snug truncate">
              {job.title}
            </div>
          </ViewTransition>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(job.id) }}
            className="shrink-0 mt-0.5 text-[var(--kz-mute)] hover:text-[var(--kz-orange)] transition-colors"
          >
            <Heart size={18} fill={isFavorite ? 'var(--kz-orange)' : 'none'} color={isFavorite ? 'var(--kz-orange)' : 'currentColor'} />
          </button>
        )}
      </div>

      {!compact && (
        <div className="flex gap-1.5 flex-wrap">
          <Tag color="cream">{job.job_type}</Tag>
          {job.remote && <Tag color="green">Remote</Tag>}
          {job.skills?.slice(0, 2).map((s) => (
            <Tag key={s.id}>{s.name}</Tag>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-2.5 border-t border-[var(--kz-line)]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-xs text-[var(--kz-text)]">
            <MapPin size={11} />
            {job.location}
          </div>
          <div className="text-xs font-semibold text-[var(--kz-text)]">
            {formatSalary(job.salary_min, job.salary_max)}
          </div>
        </div>
        {showMatch && job.match_score !== undefined && (
          <Badge color="violet" icon={<Sparkles size={11} />}>
            {job.match_score}%
          </Badge>
        )}
        {!showMatch && (
          <span className="text-[10px] text-[var(--kz-mute)]">{timeAgo(job.created_at)}</span>
        )}
      </div>

      <Link href={`/candidat/offres/${job.id}`} className="absolute inset-0" aria-label={job.title} />
    </div>
  )
}
