'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, SlidersHorizontal, Briefcase, X, ScrollText, ChevronLeft, ChevronRight, Info, Crown, Sparkles, Gem } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { JobCard } from '@/components/cards/JobCard'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useJobs } from '@/features/jobs/useJobs'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { REUNION_CITIES, JOB_TYPES, JOB_SECTORS, CITY_COORDS, RADIUS_OPTIONS, REQUIRED_LEVELS } from '@/lib/constants'
import { RARITY_META } from '@/lib/quest-journey'
import type { JobFilters } from '@/lib/types'
import { QuestPageHeader, QuestEmpty } from '@/components/quest/candidat/QuestKit'
import { rarityCounts } from '@/components/quest/candidat/quest-ui'

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
  if (key === 'remote') return value ? 'Télétravail uniquement' : null
  if (key === 'salary_min') return SALARY_OPTIONS.find((o) => o.value === String(value))?.label ?? `≥ ${value}€`
  if (key === 'date_range') return DATE_OPTIONS.find((o) => o.value === String(value))?.label ?? null
  if (key === 'level') return REQUIRED_LEVELS.find((l) => l.id === String(value))?.label ?? String(value)
  if (key === 'sort') return value !== 'newest' ? (SORT_OPTIONS.find((o) => o.value === String(value))?.label ?? null) : null
  return null
}

const TALLY = [['legendaire', Crown], ['epique', Sparkles], ['rare', Gem]] as const

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

  const tally = rarityCounts(jobs)
  const page = filters.page ?? 1
  const pages = Math.ceil(count / (filters.limit ?? 12))

  return (
    <div className="max-w-[1200px] mx-auto">
      <QuestPageHeader
        eyebrow="Guilde des aventuriers · La Réunion 974"
        title="Tableau des"
        accent="primes"
        icon={<ScrollText size={20} />}
        subtitle={<>{loading ? 'Le crieur déroule les affiches…' : `${count} prime${count !== 1 ? 's' : ''} affichée${count !== 1 ? 's' : ''} sur le tableau`} · choisis ta prochaine quête.</>}
      >
        {!loading && jobs.length > 0 && (
          <div className="flex items-center gap-1.5" role="list" aria-label="Raretés sur cette page">
            {TALLY.map(([r, Icon]) => (
              <span key={r} role="listitem" className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-[12px] font-bold"
                style={{ color: RARITY_META[r].color, borderColor: `color-mix(in srgb, ${RARITY_META[r].color} 45%, transparent)`, background: `color-mix(in srgb, ${RARITY_META[r].color} 10%, transparent)` }}
                title={`${RARITY_META[r].label} : ${tally[r]} sur cette page`}>
                <Icon size={12} aria-hidden />{tally[r]}<span className="sr-only"> {RARITY_META[r].label}</span>
              </span>
            ))}
          </div>
        )}
      </QuestPageHeader>

      {/* ── Tableau de guilde : recherche + filtres ── */}
      <div className="qx-panel p-3 sm:p-4 mb-3 qx-rise" style={{ animationDelay: '0.08s' }} role="search" aria-label="Rechercher une prime">
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-0 basis-full sm:basis-auto">
            <Input
              value={rawQ}
              onChange={(e) => setRawQ(e.target.value)}
              placeholder="Métier, compétence, entreprise..."
              aria-label="Métier, compétence ou entreprise"
              icon={<Search size={16} />}
            />
          </div>
          <div className="flex-1 sm:flex-none sm:w-48 min-w-0">
            <Select
              options={CITY_OPTIONS}
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              aria-label="Ville"
              className="w-full"
            />
          </div>
          <Button
            type="button"
            kind={showFilters ? 'dark' : 'outline'}
            size="md"
            className="h-11"
            icon={<SlidersHorizontal size={15} />}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="qx-guild-filters"
            aria-label={`Filtres${activeChips.length ? ` (${activeChips.length} actifs)` : ''}`}
          >
            <span className="hidden sm:inline">Filtres</span>
            {activeChips.length > 0 && <span className="qxc-count ml-0.5">{activeChips.length}</span>}
          </Button>
        </div>

        {/* ── Rayon (dès qu'une ville est choisie) ── */}
        {cityInput && (
          <div className="flex items-center gap-2 mt-3 flex-wrap" role="group" aria-label="Rayon autour de la ville">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--qx-cyan)]">
              <MapPin size={12} aria-hidden /> Rayon
            </span>
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={radius === opt.value}
                onClick={() => setRadius(radius === opt.value ? null : opt.value)}
                className="qxc-chip"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Filtres avancés ── */}
        {showFilters && (
          <div id="qx-guild-filters" className="mt-4 pt-4 border-t border-[#C084FC]/20 flex flex-col gap-4 qx-rise">
            <fieldset>
              <legend className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--qx-gold)] mb-2">Contrat</legend>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" className="qxc-chip qxc-chip-gold" aria-pressed={!filters.job_type} onClick={() => updateFilters({ job_type: undefined })}>Tous</button>
                {JOB_TYPES.map((t) => (
                  <button key={t} type="button" className="qxc-chip" aria-pressed={filters.job_type === t}
                    onClick={() => updateFilters({ job_type: t })}>
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--qx-gold)] mb-2">Mode de travail</legend>
              <div className="flex gap-1.5">
                {([{ v: undefined, l: 'Tous' }, { v: true, l: 'Télétravail' }] as const).map(({ v, l }) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={filters.remote === v}
                    onClick={() => updateFilters({ remote: v })}
                    className="qxc-chip"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-5 gap-3">
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
            </div>
          </div>
        )}
      </div>

      {/* ── Runes des filtres actifs ── */}
      {activeChips.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          {activeChips.map(([k, v]) => {
            const label = chipLabel(k, v, cityInput, radius)
            if (!label) return null
            return (
              <span key={k} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-lg text-[11px] font-bold text-[#FDE68A] border border-[#FACC15]/45 bg-[rgba(250,204,21,0.1)] max-w-full">
                <span className="truncate">{label}</span>
                <button
                  type="button"
                  aria-label={`Retirer le filtre ${label}`}
                  className="w-5 h-5 grid place-items-center rounded-md hover:bg-[rgba(250,204,21,0.2)]"
                  onClick={() => {
                    if (k === 'q') { setRawQ(''); updateFilters({ q: undefined }) }
                    else if (k === 'location') { setCityInput(''); setRadius(null) }
                    else updateFilters({ [k]: undefined } as Partial<JobFilters>)
                  }}
                >
                  <X size={11} />
                </button>
              </span>
            )
          })}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold underline underline-offset-4 text-[var(--kz-mute)] hover:text-white"
          >
            Tout effacer
          </button>
        </div>
      )}

      <details className="mb-4 text-[12px] text-[var(--kz-mute)]">
        <summary className="inline-flex items-center gap-1.5 cursor-pointer select-none hover:text-white list-none [&::-webkit-details-marker]:hidden">
          <Info size={12} aria-hidden /> Comment la rareté d&apos;une prime est-elle calculée ?
        </summary>
        <ul className="mt-2 grid sm:grid-cols-2 gap-1.5 rounded-xl border border-[#C084FC]/20 bg-[rgba(12,5,24,0.5)] p-3">
          <li><b style={{ color: RARITY_META.legendaire.color }}>Légendaire</b> · compatibilité ≥ 90 %, ou offre à la une payée ≥ 2 500 €/mois</li>
          <li><b style={{ color: RARITY_META.epique.color }}>Épique</b> · compatibilité ≥ 75 %, offre à la une, ou ≥ 3 000 €/mois</li>
          <li><b style={{ color: RARITY_META.rare.color }}>Rare</b> · compatibilité ≥ 60 %, ou ≥ 2 000 €/mois</li>
          <li><b style={{ color: RARITY_META.commune.color }}>Commune</b> · toutes les autres primes</li>
        </ul>
      </details>

      {/* ── Primes ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" aria-busy="true" aria-label="Chargement des primes">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="qxc-card h-[210px] animate-pulse" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <QuestEmpty
          title="Aucune prime sur le tableau"
          description="Essaie d'autres mots-clés ou élargis ta zone d'exploration."
          icon={<Briefcase size={28} />}
          action={<Button kind="outline" onClick={clearAll}>Effacer les filtres</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 pt-2 qxc-stagger">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} isFavorite={isFavorite(job.id)} onToggleFavorite={toggle} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {count > (filters.limit ?? 12) && (
        <nav className="flex justify-center items-center gap-2 mt-8" aria-label="Pagination des primes">
          <Button
            kind="outline" size="md"
            icon={<ChevronLeft size={15} />}
            disabled={page <= 1}
            onClick={() => updateFilters({ page: page - 1 })}
            aria-label="Page précédente"
          >
            <span className="hidden sm:inline">Précédent</span>
          </Button>
          <span className="flex items-center px-4 h-9 rounded-xl border border-[#FACC15]/35 bg-[rgba(250,204,21,0.08)] text-sm font-bold text-[#FDE68A] font-[family-name:var(--font-epic)] tabular-nums">
            Page {page} / {pages}
          </span>
          <Button
            kind="outline" size="md"
            iconRight={<ChevronRight size={15} />}
            disabled={page >= pages}
            onClick={() => updateFilters({ page: page + 1 })}
            aria-label="Page suivante"
          >
            <span className="hidden sm:inline">Suivant</span>
          </Button>
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
