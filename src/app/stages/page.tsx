'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Search, MapPin, SlidersHorizontal, GraduationCap, X, Calendar, Euro,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useJobs } from '@/features/jobs/useJobs'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import {
  REUNION_CITIES, JOB_SECTORS, INTERNSHIP_LEVELS, KZ,
  CITY_COORDS, RADIUS_OPTIONS,
} from '@/lib/constants'
import type { JobFilters, Job } from '@/lib/types'

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

const CITY_OPTIONS = [{ value: '', label: 'Toute la Réunion' }, ...REUNION_CITIES.map((c) => ({ value: c, label: c }))]
const SECTOR_OPTIONS = [{ value: '', label: 'Tous les secteurs' }, ...JOB_SECTORS.map((s) => ({ value: s, label: s }))]
const LEVEL_OPTIONS = [{ value: '', label: 'Tout niveau d\'études' }, ...INTERNSHIP_LEVELS.map((l) => ({ value: l.id, label: l.label }))]
const PAID_OPTIONS = [
  { value: '',     label: 'Gratification' },
  { value: 'true', label: 'Gratifié' },
  { value: 'false', label: 'Non gratifié' },
]
const SORT_OPTIONS = [
  { value: 'newest', label: 'Plus récent' },
]

function StageCard({ job, isFav, onFav }: { job: Job; isFav: boolean; onFav: () => void }) {
  return (
    <div
      className="kz-card p-4 bg-[var(--kz-paper)] flex flex-col gap-3 hover:shadow-md transition-shadow"
      style={{ borderColor: KZ.line }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--kz-edge)]"
              style={{ background: KZ.violetSoft, color: KZ.violet }}
            >
              Stage
            </span>
            {job.internship_paid === true && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--kz-edge)]" style={{ background: KZ.greenSoft }}>
                Gratifié
              </span>
            )}
          </div>
          <Link href={`/stages/${job.id}`} className="text-base font-bold text-[var(--kz-ink)] hover:text-[var(--kz-orange)] transition-colors line-clamp-2">
            {job.title}
          </Link>
          <p className="text-xs text-[var(--kz-mute)] mt-0.5">
            {(job.company as { name?: string } | null)?.name ?? 'Entreprise'}
          </p>
        </div>
        <button
          onClick={onFav}
          className="shrink-0 p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-[var(--kz-edge)] transition-all"
          style={{ background: isFav ? KZ.orangeSoft : KZ.paper }}
          aria-label={isFav ? 'Retirer des favoris' : 'Sauvegarder'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? 'var(--kz-orange)' : 'none'} stroke="var(--kz-ink)" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-[var(--kz-mute)]">
        {job.location && (
          <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
        )}
        {job.internship_duration && (
          <span className="flex items-center gap-1"><Calendar size={11} />{job.internship_duration}</span>
        )}
        {job.internship_compensation && (
          <span className="flex items-center gap-1"><Euro size={11} />{job.internship_compensation}</span>
        )}
        {job.sector && (
          <span className="flex items-center gap-1"><GraduationCap size={11} />{job.sector}</span>
        )}
      </div>

      <Link href={`/stages/${job.id}`}>
        <Button kind="outline" size="sm" full>Voir l&apos;offre</Button>
      </Link>
    </div>
  )
}

function StagesContent() {
  const searchParams = useSearchParams()
  const [initialFilters] = useState<JobFilters>(() => ({
    job_type: 'Stage',
    q: searchParams.get('q') || undefined,
    location: searchParams.get('location') || undefined,
    sector: searchParams.get('sector') || undefined,
    page: 1, limit: 12,
  }))

  const { profile } = useAuth()
  const { jobs, loading, count, filters, updateFilters } = useJobs(initialFilters)
  const { isFavorite, toggle } = useFavorites(profile?.id)

  const [showFilters, setShowFilters] = useState(false)
  const [rawQ, setRawQ] = useState(initialFilters.q ?? '')
  const [cityInput, setCityInput] = useState(initialFilters.location ?? '')
  const [radius, setRadius] = useState<number | null>(null)
  const qDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRenderQ = useRef(true)
  const isFirstRenderCity = useRef(true)

  useEffect(() => {
    if (isFirstRenderQ.current) { isFirstRenderQ.current = false; return }
    if (qDebounceRef.current) clearTimeout(qDebounceRef.current)
    qDebounceRef.current = setTimeout(() => {
      updateFilters({ q: rawQ.trim() || undefined })
    }, 400)
    return () => { if (qDebounceRef.current) clearTimeout(qDebounceRef.current) }
  }, [rawQ, updateFilters])

  useEffect(() => {
    if (isFirstRenderCity.current) { isFirstRenderCity.current = false; return }
    if (!cityInput) {
      updateFilters({ location: undefined, locations: undefined, radius: undefined })
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
      sector: undefined, remote: undefined, level: undefined,
      internship_paid: undefined, internship_duration: undefined,
    })
  }, [updateFilters])

  const activeChips = Object.entries(filters).filter(([k, v]) => {
    if (['page', 'limit', 'locations', 'radius', 'job_type'].includes(k)) return false
    if (k === 'sort' && v === 'newest') return false
    return v !== undefined
  })

  return (
    <div className="min-h-screen" style={{ background: KZ.cream }}>
      <div className="max-w-[1100px] mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-6">
          <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>La Réunion 974</p>
          <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[var(--kz-ink)] mb-1">
            Offres de stage
          </h1>
          <p className="text-sm text-[var(--kz-mute)]">
            {loading ? '…' : `${count} stage${count !== 1 ? 's' : ''} disponible${count !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="flex gap-2 mb-2 flex-wrap sm:flex-nowrap">
          <Input
            value={rawQ}
            onChange={(e) => setRawQ(e.target.value)}
            placeholder="Mission, secteur, entreprise..."
            icon={<Search size={16} />}
            className="flex-1 min-w-0"
          />
          <Select
            options={CITY_OPTIONS}
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            className="w-full sm:w-44 shrink-0"
          />
          <Button
            type="button"
            kind={showFilters ? 'dark' : 'outline'}
            size="md"
            icon={<SlidersHorizontal size={15} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="hidden sm:inline">Filtres</span>
            {activeChips.length > 0 && (
              <span
                className="ml-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                style={{ background: 'var(--kz-orange)', color: 'white' }}
              >
                {activeChips.length}
              </span>
            )}
          </Button>
        </div>

        {/* Rayon */}
        {cityInput && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-semibold text-[var(--kz-mute)]">
              <MapPin size={12} /> Rayon :
            </span>
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRadius(radius === opt.value ? null : opt.value)}
                className="px-3 py-1 text-xs font-semibold rounded-full border border-[var(--kz-edge)] transition-all"
                style={
                  radius === opt.value
                    ? { background: 'var(--kz-ink)', color: 'var(--kz-cream)' }
                    : { background: 'var(--kz-paper)', color: 'var(--kz-ink)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Filtres avancés */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4 mb-2 rounded-xl border border-[var(--kz-edge)] bg-[var(--kz-paper)]">
            <Select
              label="Secteur"
              options={SECTOR_OPTIONS}
              value={filters.sector ?? ''}
              onChange={(e) => updateFilters({ sector: e.target.value || undefined })}
            />
            <Select
              label="Niveau d'études"
              options={LEVEL_OPTIONS}
              value={filters.level ?? ''}
              onChange={(e) => updateFilters({ level: e.target.value || undefined })}
            />
            <Select
              label="Gratification"
              options={PAID_OPTIONS}
              value={filters.internship_paid === undefined ? '' : String(filters.internship_paid)}
              onChange={(e) => updateFilters({ internship_paid: e.target.value === '' ? undefined : e.target.value === 'true' })}
            />
          </div>
        )}

        {/* Chips filtres actifs */}
        {activeChips.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap items-center">
            {activeChips.map(([k, v]) => {
              let label: string | null = null
              if (k === 'q') label = `"${v}"`
              else if (k === 'location') label = cityInput
              else if (k === 'sector') label = String(v)
              else if (k === 'level') label = INTERNSHIP_LEVELS.find((l) => l.id === v)?.label ?? String(v)
              else if (k === 'internship_paid') label = v ? 'Gratifié' : 'Non gratifié'
              if (!label) return null
              return (
                <Badge key={k} color="orange" size="sm">
                  {label}
                  <button className="ml-1" onClick={() => {
                    if (k === 'q') { setRawQ(''); updateFilters({ q: undefined }) }
                    else if (k === 'location') { setCityInput(''); setRadius(null) }
                    else updateFilters({ [k]: undefined } as Partial<JobFilters>)
                  }}>
                    <X size={10} />
                  </button>
                </Badge>
              )
            })}
            <button onClick={clearAll} className="text-xs font-semibold underline text-[var(--kz-mute)] hover:text-[var(--kz-ink)]">
              Tout effacer
            </button>
          </div>
        )}

        {/* Grille */}
        {loading ? (
          <PageLoader />
        ) : jobs.length === 0 ? (
          <EmptyState
            title="Aucun stage trouvé"
            description="Essaie d'autres mots-clés ou élargis ta recherche."
            icon={<GraduationCap size={28} />}
            action={<Button kind="outline" onClick={clearAll}>Effacer les filtres</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <StageCard
                key={job.id}
                job={job}
                isFav={isFavorite(job.id)}
                onFav={() => toggle(job.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {count > (filters.limit ?? 12) && (
          <div className="flex justify-center gap-2 mt-6">
            <Button kind="outline" size="md" disabled={(filters.page ?? 1) <= 1}
              onClick={() => updateFilters({ page: (filters.page ?? 1) - 1 })}>
              Précédent
            </Button>
            <span className="flex items-center px-4 text-sm font-semibold text-[var(--kz-ink)]">
              {filters.page ?? 1} / {Math.ceil(count / (filters.limit ?? 12))}
            </span>
            <Button kind="outline" size="md"
              disabled={(filters.page ?? 1) >= Math.ceil(count / (filters.limit ?? 12))}
              onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}>
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StagesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StagesContent />
    </Suspense>
  )
}
