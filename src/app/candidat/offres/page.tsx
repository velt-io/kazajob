'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, Briefcase, X, ArrowUpDown, Wifi, ChevronLeft, ChevronRight, Check, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/radix'
import { JobCard } from '@/components/cards/JobCard'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { FilterPill } from '@/components/os/candidate/FilterPill'
import { FeaturedJobCard } from '@/components/os/candidate/FeaturedJobCard'
import { GlassEmpty, Segmented } from '@/components/os/candidate/primitives'
import { useJobs } from '@/features/jobs/useJobs'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { REUNION_CITIES, JOB_TYPES, JOB_SECTORS, CITY_COORDS, RADIUS_OPTIONS, REQUIRED_LEVELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { JobFilters } from '@/lib/types'

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function citiesInRadius(center: string, radiusKm: number): string[] {
  if (radiusKm === 0) return [...REUNION_CITIES]
  const cc = CITY_COORDS[center]
  if (!cc) return [center]
  return REUNION_CITIES.filter((c) => {
    const crd = CITY_COORDS[c]
    return crd && haversineKm(cc[0], cc[1], crd[0], crd[1]) <= radiusKm
  })
}

const TYPE_OPTIONS = [{ value: '', label: 'Tous les contrats' }, ...JOB_TYPES.map((t) => ({ value: t, label: t }))]
const SECTOR_OPTIONS = [{ value: '', label: 'Tous les secteurs' }, ...JOB_SECTORS.map((s) => ({ value: s, label: s }))]
const LEVEL_OPTIONS = [{ value: '', label: 'Tous les niveaux' }, ...REQUIRED_LEVELS.map((l) => ({ value: l.id, label: l.label }))]
const SALARY_OPTIONS = [
  { value: '',     label: 'Tous les salaires' },
  { value: '1400', label: '≥ 1 400 €/mois' },
  { value: '1700', label: '≥ 1 700 €/mois' },
  { value: '2000', label: '≥ 2 000 €/mois' },
  { value: '2500', label: '≥ 2 500 €/mois' },
  { value: '3000', label: '≥ 3 000 €/mois' },
]
const DATE_OPTIONS = [
  { value: '',      label: 'Toutes les dates' },
  { value: 'week',  label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois-ci' },
]
const SORT_OPTIONS = [
  { value: 'newest',      label: 'Plus récentes' },
  { value: 'salary_desc', label: 'Salaire décroissant' },
  { value: 'salary_asc',  label: 'Salaire croissant' },
]
const CITY_CHOICES = [{ v: '', l: 'Toute la Réunion' }, ...REUNION_CITIES.map((c) => ({ v: c, l: c }))]

const labelOf = (opts: { value: string; label: string }[], v: string | undefined) =>
  v ? (opts.find((o) => o.value === v)?.label ?? v) : null

function JobsContent() {
  const searchParams = useSearchParams()
  const [initialFilters] = useState<JobFilters>(() => ({
    q:        searchParams.get('q') || undefined,
    location: searchParams.get('location') || undefined,
    job_type: searchParams.get('job_type') || undefined,
    sector:   searchParams.get('sector') || undefined,
    remote:   searchParams.get('remote') === 'true' ? true : undefined,
    page: 1, limit: 12,
  }))

  const { profile } = useAuth()
  const { jobs, loading, count, filters, updateFilters } = useJobs(initialFilters)
  const { isFavorite, toggle } = useFavorites(profile?.id)

  const [rawQ, setRawQ] = useState(initialFilters.q ?? '')
  const [cityInput, setCityInput] = useState(initialFilters.location ?? '')
  const [radius, setRadius] = useState<number | null>(null) // null = no radius selected yet
  const [cityOpen, setCityOpen] = useState(false)
  const qDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRenderQ = useRef(true)
  const isFirstRenderCity = useRef(true)

  // Debounced keyword update
  useEffect(() => {
    if (isFirstRenderQ.current) { isFirstRenderQ.current = false; return }
    if (qDebounceRef.current) clearTimeout(qDebounceRef.current)
    qDebounceRef.current = setTimeout(() => {
      updateFilters({ q: rawQ.trim() || undefined })
    }, 400)
    return () => { if (qDebounceRef.current) clearTimeout(qDebounceRef.current) }
  }, [rawQ, updateFilters])

  // City + radius → compute locations[]
  useEffect(() => {
    if (isFirstRenderCity.current) { isFirstRenderCity.current = false; return }
    if (!cityInput) {
      updateFilters({ location: undefined, locations: undefined, radius: undefined })
      // Logique d'origine conservée telle quelle (réinitialise le rayon quand la ville est vidée).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRadius(null)
    } else if (radius === null || radius === 0) {
      updateFilters({ location: cityInput, locations: undefined, radius: radius ?? undefined })
    } else {
      const nearby = citiesInRadius(cityInput, radius)
      updateFilters({ location: cityInput, locations: nearby, radius })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityInput, radius])

  const clearAll = useCallback(() => {
    setRawQ('')
    setCityInput('')
    setRadius(null)
    updateFilters({
      q: undefined, location: undefined, locations: undefined, radius: undefined,
      job_type: undefined, sector: undefined, remote: undefined,
      salary_min: undefined, date_range: undefined, level: undefined, sort: undefined,
    })
  }, [updateFilters])

  // Filtres actifs (hors pagination / tri par défaut)
  const activeChips = Object.entries(filters).filter(([k, v]) => {
    if (['page', 'limit', 'locations', 'radius'].includes(k)) return false
    if (k === 'sort' && v === 'newest') return false
    if (k === 'remote' && v === false) return false
    return v !== undefined
  })

  const page = filters.page ?? 1
  const totalPages = Math.ceil(count / (filters.limit ?? 12))

  // « À la une » : offres boostées (sinon la plus récente) en page 1, sans filtre actif.
  const showFeatured = !loading && page === 1 && activeChips.length === 0 && jobs.length > 0
  const boosted = jobs.filter((j) => j.is_boosted).slice(0, 3)
  const featured = showFeatured ? (boosted.length > 0 ? boosted : jobs.length > 3 ? jobs.slice(0, 1) : []) : []
  const featuredIds = new Set(featured.map((j) => j.id))
  const listJobs = jobs.filter((j) => !featuredIds.has(j.id))

  const pillBase = 'osc-press shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap border outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]'

  return (
    <div className="max-w-[1180px] mx-auto">
      {/* ── En-tête ── */}
      <header className="mb-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--kz-mute)]">La Réunion 974</p>
        <h1 className="text-[34px] sm:text-[44px] lg:text-[52px] font-semibold tracking-[-0.05em] leading-[1.02] text-[var(--kz-ink)] mt-1">
          Offres d&apos;emploi
        </h1>
        <p className="text-[15px] text-[var(--kz-mute)] mt-2" aria-live="polite">
          {loading ? 'Recherche en cours…' : (
            <>
              <span className="os-text-aurora font-semibold tabular-nums">{count.toLocaleString('fr-FR')}</span>{' '}
              offre{count !== 1 ? 's' : ''} {activeChips.length > 0 ? 'pour ta recherche' : 'à découvrir'}
            </>
          )}
        </p>
      </header>

      {/* ── Barre de recherche (verre) ── */}
      <div className="os-glass rounded-[24px] p-1.5 flex flex-col sm:flex-row gap-1.5 shadow-[0_24px_48px_-28px_rgba(0,0,0,0.9)]">
        <label className="flex items-center gap-3 h-12 px-4 flex-1 min-w-0 rounded-[18px] bg-[var(--osc-surface)] focus-within:bg-[var(--osc-surface-hi)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--kz-blue)_55%,transparent)] transition">
          <Search size={18} className="text-[var(--kz-mute)] shrink-0" />
          <input
            value={rawQ}
            onChange={(e) => setRawQ(e.target.value)}
            placeholder="Métier, compétence, entreprise…"
            aria-label="Rechercher une offre"
            type="search"
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[var(--kz-ink)] placeholder:text-[var(--kz-mute)] [&::-webkit-search-cancel-button]:hidden"
          />
          {rawQ && (
            <button type="button" onClick={() => setRawQ('')} aria-label="Effacer la recherche"
              className="osc-press osc-fade w-6 h-6 rounded-full flex items-center justify-center bg-[var(--kz-mute)] text-[var(--kz-inverse)] shrink-0">
              <X size={13} strokeWidth={3} />
            </button>
          )}
        </label>

        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <button type="button" aria-label={`Ville : ${cityInput || 'Toute la Réunion'}`}
              className="osc-press flex items-center gap-2.5 h-12 px-4 sm:w-[230px] rounded-[18px] text-left hover:bg-[var(--osc-surface)] data-[state=open]:bg-[var(--osc-surface-hi)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]">
              <MapPin size={18} className={cityInput ? 'text-[var(--kz-blue)]' : 'text-[var(--kz-mute)]'} />
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-medium text-[var(--kz-mute)] leading-none">Où ?</span>
                <span className="block text-[15px] font-semibold text-[var(--kz-ink)] truncate mt-1 leading-none">{cityInput || 'Toute la Réunion'}</span>
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(300px,calc(100vw-32px))] p-1.5">
            <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)]">Ville</p>
            <div className="max-h-[min(360px,60vh)] overflow-y-auto flex flex-col">
              {CITY_CHOICES.map(({ v, l }) => (
                <button key={v || '__all'} type="button" aria-pressed={cityInput === v}
                  onClick={() => { setCityInput(v); setCityOpen(false) }}
                  className={cn('flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] outline-none transition-colors hover:bg-[var(--kz-line)] focus-visible:bg-[var(--kz-blue)] focus-visible:text-white',
                    cityInput === v ? 'font-semibold text-[var(--kz-ink)]' : 'text-[var(--kz-text)]')}>
                  <span className="flex items-center gap-2.5 truncate">
                    {v ? <MapPin size={14} className="text-[var(--kz-mute)] shrink-0" /> : <Navigation size={14} className="text-[var(--kz-mute)] shrink-0" />}{l}
                  </span>
                  {cityInput === v && <Check size={16} className="text-[var(--kz-blue)] shrink-0" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Rayon (dès qu'une ville est choisie) ── */}
      {cityInput && (
        <div className="osc-drop flex items-center gap-x-3 gap-y-2 mt-3 flex-wrap">
          <span className="text-[13px] font-medium text-[var(--kz-mute)]">Autour de {cityInput}</span>
          <Segmented
            label="Rayon de recherche"
            size="sm"
            value={radius ?? -1}
            onChange={(v) => setRadius(v === -1 || radius === v ? null : v)}
            options={[{ value: -1, label: 'Ville seule' }, ...RADIUS_OPTIONS.map((o) => ({ value: o.value as number, label: o.label }))]}
          />
        </div>
      )}

      {/* ── Filtres en pilules ── */}
      <div className="osc-scroll-x osc-fade-edges gap-2 mt-4 mb-8 -mx-4 px-4 py-1 sm:mx-0 sm:px-0 [scroll-snap-type:none]">
        <FilterPill label="Trier" icon={<ArrowUpDown size={13} />} options={SORT_OPTIONS}
          value={filters.sort ?? 'newest'}
          valueLabel={filters.sort && filters.sort !== 'newest' ? labelOf(SORT_OPTIONS, filters.sort) : null}
          onSelect={(v) => updateFilters({ sort: (v as JobFilters['sort']) || 'newest' })} />
        <FilterPill label="Contrat" options={TYPE_OPTIONS} value={filters.job_type ?? ''}
          valueLabel={filters.job_type ?? null}
          onSelect={(v) => updateFilters({ job_type: v || undefined })} />
        <FilterPill label="Secteur" options={SECTOR_OPTIONS} value={filters.sector ?? ''}
          valueLabel={filters.sector ?? null}
          onSelect={(v) => updateFilters({ sector: v || undefined })} />
        <FilterPill label="Expérience" options={LEVEL_OPTIONS} value={filters.level ?? ''}
          valueLabel={labelOf(LEVEL_OPTIONS, filters.level)}
          onSelect={(v) => updateFilters({ level: v || undefined })} />
        <FilterPill label="Salaire" options={SALARY_OPTIONS} value={String(filters.salary_min ?? '')}
          valueLabel={labelOf(SALARY_OPTIONS, filters.salary_min ? String(filters.salary_min) : undefined)}
          onSelect={(v) => updateFilters({ salary_min: v ? Number(v) : undefined })} />
        <FilterPill label="Publication" options={DATE_OPTIONS} value={filters.date_range ?? ''}
          valueLabel={labelOf(DATE_OPTIONS, filters.date_range)}
          onSelect={(v) => updateFilters({ date_range: (v || undefined) as JobFilters['date_range'] })} />
        <button
          type="button"
          aria-pressed={filters.remote === true}
          onClick={() => updateFilters({ remote: filters.remote === true ? undefined : true })}
          className={cn(pillBase, filters.remote === true
            ? 'bg-[var(--kz-green)] text-black border-transparent'
            : 'bg-[var(--osc-surface)] text-[var(--kz-text)] border-[var(--kz-edge)] hover:bg-[var(--osc-surface-hi)]')}
        >
          <Wifi size={13} />Télétravail
        </button>
        {activeChips.length > 0 && (
          <button type="button" onClick={clearAll}
            className={cn(pillBase, 'osc-fade border-transparent text-[var(--kz-blue)] hover:bg-[var(--kz-blue-soft)]')}>
            <X size={13} />Tout effacer ({activeChips.length})
          </button>
        )}
      </div>

      {/* ── À la une ── */}
      {featured.length > 0 && (
        <section aria-label="À la une" className="mb-10">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[var(--kz-ink)]">{boosted.length > 0 ? 'À la une' : 'À découvrir'}</h2>
            {featured.length > 1 && <span className="text-[13px] text-[var(--kz-mute)] sm:hidden">Fais glisser</span>}
          </div>
          <div className={cn(
            featured.length === 1 ? 'grid grid-cols-1' : 'osc-scroll-x gap-4 -mx-4 px-4 scroll-px-4 sm:mx-0 sm:px-0 sm:scroll-px-0 sm:grid sm:overflow-visible',
            featured.length === 2 && 'sm:grid-cols-2',
            featured.length === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
          )}>
            {featured.map((job, i) => (
              <div key={job.id} className={featured.length > 1 ? 'w-[86%] shrink-0 sm:w-auto' : ''}>
                <FeaturedJobCard job={job} index={i} eyebrow={job.is_boosted ? 'À la une' : 'Nouvelle offre'} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Liste ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" aria-busy="true" aria-label="Chargement des offres">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="osc-skeleton h-[214px] rounded-[24px] border border-[var(--kz-line)]" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <GlassEmpty
          title="Aucune offre trouvée"
          description="Essaie d'autres mots-clés ou élargis ta recherche."
          icon={<Briefcase size={26} />}
          action={<Button kind="outline" onClick={clearAll}>Effacer les filtres</Button>}
        />
      ) : listJobs.length > 0 && (
        <>
          {featured.length > 0 && <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[var(--kz-ink)] mb-3">Toutes les offres</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {listJobs.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} isFavorite={isFavorite(job.id)} onToggleFavorite={toggle} />
            ))}
          </div>
        </>
      )}

      {/* ── Pagination ── */}
      {count > (filters.limit ?? 12) && (
        <nav aria-label="Pagination" className="flex justify-center mt-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-full os-glass">
            <button type="button" aria-label="Page précédente"
              disabled={page <= 1}
              onClick={() => updateFilters({ page: page - 1 })}
              className="osc-press w-10 h-10 rounded-full flex items-center justify-center text-[var(--kz-ink)] hover:bg-[var(--kz-line)] disabled:opacity-30 disabled:pointer-events-none">
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 text-[14px] font-semibold tabular-nums text-[var(--kz-ink)]">
              {page} <span className="text-[var(--kz-mute)] font-medium">sur {totalPages}</span>
            </span>
            <button type="button" aria-label="Page suivante"
              disabled={page >= totalPages}
              onClick={() => updateFilters({ page: page + 1 })}
              className="osc-press w-10 h-10 rounded-full flex items-center justify-center text-[var(--kz-ink)] hover:bg-[var(--kz-line)] disabled:opacity-30 disabled:pointer-events-none">
              <ChevronRight size={18} />
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}

export default function CandidateJobsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JobsContent />
    </Suspense>
  )
}
