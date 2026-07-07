'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, SlidersHorizontal, Briefcase, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { JobCard } from '@/components/cards/JobCard'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useJobs } from '@/features/jobs/useJobs'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { REUNION_CITIES, JOB_TYPES, JOB_SECTORS, CITY_COORDS, RADIUS_OPTIONS, REQUIRED_LEVELS } from '@/lib/constants'
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

const CITY_OPTIONS = [{ value: '', label: 'Toute la Réunion' }, ...REUNION_CITIES.map((c) => ({ value: c, label: c }))]
const TYPE_OPTIONS = [{ value: '', label: 'Tous les types' }, ...JOB_TYPES.map((t) => ({ value: t, label: t }))]
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
  { value: 'newest',      label: 'Plus récent' },
  { value: 'salary_desc', label: 'Salaire ↓' },
  { value: 'salary_asc',  label: 'Salaire ↑' },
]

function chipLabel(key: string, value: unknown, city: string, radius: number | null): string | null {
  if (key === 'q') return `"${value}"`
  if (key === 'location') {
    if (radius !== null && radius > 0) return `${value} (${radius} km)`
    if (radius === 0) return `${value} · île entière`
    return String(value)
  }
  if (key === 'job_type') return String(value)
  if (key === 'sector') return String(value)
  if (key === 'remote') return value ? 'Remote uniquement' : null
  if (key === 'salary_min') return SALARY_OPTIONS.find((o) => o.value === String(value))?.label ?? `≥ ${value}€`
  if (key === 'date_range') return DATE_OPTIONS.find((o) => o.value === String(value))?.label ?? null
  if (key === 'level') return REQUIRED_LEVELS.find((l) => l.id === String(value))?.label ?? String(value)
  if (key === 'sort') return value !== 'newest' ? (SORT_OPTIONS.find((o) => o.value === String(value))?.label ?? null) : null
  return null
}

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

  const [showFilters, setShowFilters] = useState(false)
  const [rawQ, setRawQ] = useState(initialFilters.q ?? '')
  const [cityInput, setCityInput] = useState(initialFilters.location ?? '')
  const [radius, setRadius] = useState<number | null>(null) // null = no radius selected yet
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

  // Count active filters for badge on the Filtres button
  const activeChips = Object.entries(filters).filter(([k, v]) => {
    if (['page', 'limit', 'locations', 'radius'].includes(k)) return false
    if (k === 'sort' && v === 'newest') return false
    if (k === 'remote' && v === false) return false
    return v !== undefined
  })

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410] mb-1">
          Offres d&apos;emploi
        </h1>
        <p className="text-sm text-[#6B5A4A]">
          {loading ? '…' : `${count} offre${count !== 1 ? 's' : ''}`} · La Réunion 974
        </p>
      </div>

      {/* ── Barre de recherche principale ── */}
      <div className="flex gap-2 mb-2 flex-wrap sm:flex-nowrap">
        <Input
          value={rawQ}
          onChange={(e) => setRawQ(e.target.value)}
          placeholder="Métier, compétence, entreprise..."
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
              style={{ background: '#FF6B35', color: 'white' }}
            >
              {activeChips.length}
            </span>
          )}
        </Button>
      </div>

      {/* ── Sélecteur de rayon (affiché dès qu'une ville est choisie) ── */}
      {cityInput && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#6B5A4A]">
            <MapPin size={12} /> Rayon :
          </span>
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRadius(radius === opt.value ? null : opt.value)}
              className="px-3 py-1 text-xs font-semibold rounded-full border border-[#1A1410] transition-all"
              style={
                radius === opt.value
                  ? { background: '#1A1410', color: '#FFF7EE' }
                  : { background: 'white', color: '#1A1410' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Filtres avancés ── */}
      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-4 mb-2 rounded-xl border border-[#1A1410] bg-white">
          <Select
            label="Contrat"
            options={TYPE_OPTIONS}
            value={filters.job_type ?? ''}
            onChange={(e) => updateFilters({ job_type: e.target.value || undefined })}
          />
          <Select
            label="Secteur"
            options={SECTOR_OPTIONS}
            value={filters.sector ?? ''}
            onChange={(e) => updateFilters({ sector: e.target.value || undefined })}
          />
          <Select
            label="Niveau"
            options={LEVEL_OPTIONS}
            value={filters.level ?? ''}
            onChange={(e) => updateFilters({ level: e.target.value || undefined })}
          />
          <Select
            label="Salaire min"
            options={SALARY_OPTIONS}
            value={String(filters.salary_min ?? '')}
            onChange={(e) => updateFilters({ salary_min: e.target.value ? Number(e.target.value) : undefined })}
          />
          <Select
            label="Publié"
            options={DATE_OPTIONS}
            value={filters.date_range ?? ''}
            onChange={(e) => updateFilters({ date_range: (e.target.value || undefined) as JobFilters['date_range'] })}
          />
          <Select
            label="Trier par"
            options={SORT_OPTIONS}
            value={filters.sort ?? 'newest'}
            onChange={(e) => updateFilters({ sort: (e.target.value as JobFilters['sort']) || 'newest' })}
          />
          <div className="col-span-2 sm:col-span-3 lg:col-span-6 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#2A2018]">Mode de travail</label>
            <div className="flex gap-2">
              {([{ v: undefined, l: 'Tous' }, { v: true, l: 'Remote' }] as const).map(({ v, l }) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => updateFilters({ remote: v })}
                  className="px-4 py-2 text-sm font-semibold border-[1.5px] rounded-lg border-[#1A1410] transition-all"
                  style={{
                    background: filters.remote === v ? '#1A1410' : 'white',
                    color: filters.remote === v ? '#FFF7EE' : '#1A1410',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Chips des filtres actifs ── */}
      {activeChips.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          {activeChips.map(([k, v]) => {
            const label = chipLabel(k, v, cityInput, radius)
            if (!label) return null
            return (
              <Badge key={k} color="orange" size="sm">
                {label}
                <button
                  className="ml-1"
                  onClick={() => {
                    if (k === 'q') { setRawQ(''); updateFilters({ q: undefined }) }
                    else if (k === 'location') { setCityInput(''); setRadius(null) }
                    else updateFilters({ [k]: undefined } as Partial<JobFilters>)
                  }}
                >
                  <X size={10} />
                </button>
              </Badge>
            )
          })}
          <button
            onClick={clearAll}
            className="text-xs font-semibold underline text-[#6B5A4A] hover:text-[#1A1410]"
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* ── Grille d'offres ── */}
      {loading ? (
        <PageLoader />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="Aucune offre trouvée"
          description="Essaie d'autres mots-clés ou élargis ta recherche."
          icon={<Briefcase size={28} />}
          action={<Button kind="outline" onClick={clearAll}>Effacer les filtres</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} isFavorite={isFavorite(job.id)} onToggleFavorite={toggle} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {count > (filters.limit ?? 12) && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            kind="outline" size="md"
            disabled={(filters.page ?? 1) <= 1}
            onClick={() => updateFilters({ page: (filters.page ?? 1) - 1 })}
          >
            Précédent
          </Button>
          <span className="flex items-center px-4 text-sm font-semibold text-[#1A1410]">
            {filters.page ?? 1} / {Math.ceil(count / (filters.limit ?? 12))}
          </span>
          <Button
            kind="outline" size="md"
            disabled={(filters.page ?? 1) >= Math.ceil(count / (filters.limit ?? 12))}
            onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}
          >
            Suivant
          </Button>
        </div>
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
