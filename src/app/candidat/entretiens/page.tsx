'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Calendar, Video, Phone, MapPin, ExternalLink, Check, Clock, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useInterviews, type Interview } from '@/features/interviews/useInterviews'
import { island } from '@/lib/island'
import { cn } from '@/lib/utils'
import { GlassEmpty, LargeTitle, Pill, type Tone } from '@/components/os/candidate/primitives'

const TYPE_ICON: Record<Interview['type'], ReactNode> = {
  video:  <Video size={14} />,
  phone:  <Phone size={14} />,
  onsite: <MapPin size={14} />,
}

const TYPE_LABEL: Record<Interview['type'], string> = {
  video:  'Visioconférence',
  phone:  'Téléphone',
  onsite: 'Présentiel',
}

const TYPE_COLOR: Record<Interview['type'], string> = {
  video:  'var(--kz-blue)',
  phone:  'var(--kz-green)',
  onsite: 'var(--kz-orange)',
}

const STATUS: Record<string, { tone: Tone; label: string }> = {
  pending:   { tone: 'yellow', label: 'À confirmer' },
  confirmed: { tone: 'green',  label: 'Confirmé' },
  cancelled: { tone: 'gray',   label: 'Annulé' },
  done:      { tone: 'violet', label: 'Terminé' },
}

const hhmm = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

function dayLabel(d: Date, now: number) {
  const today = new Date(now)
  const tomorrow = new Date(now); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Aujourd’hui'
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function countdown(target: Date, now: number) {
  const min = Math.round((target.getTime() - now) / 60000)
  if (min <= 0) return 'Maintenant'
  if (min < 60) return `Dans ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Dans ${h} h${min % 60 ? ` ${String(min % 60).padStart(2, '0')}` : ''}`
  const d = Math.floor(h / 24)
  return `Dans ${d} jour${d > 1 ? 's' : ''}${h % 24 ? ` ${h % 24} h` : ''}`
}

export default function CandidateAgendaPage() {
  const { upcoming, byDate, loading, update } = useInterviews()
  // Présentation : horloge locale (compte à rebours), jour sélectionné dans le bandeau.
  const [now, setNow] = useState(() => Date.now())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  if (loading) return <PageLoader />

  // Groupes par jour, triés chronologiquement (annulés masqués comme avant)
  const groups = Object.values(byDate)
    .map((ivs) => ivs.filter((iv) => iv.status !== 'cancelled').sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at)))
    .filter((ivs) => ivs.length > 0)
    .map((ivs) => ({ date: new Date(ivs[0].scheduled_at), ivs }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const next = [...upcoming].sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at))[0]
  const busyDays = new Set(groups.map((g) => dayKey(g.date)))
  const strip = Array.from({ length: 14 }, (_, i) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d })
  const todayLabel = new Date(now).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const jumpTo = (key: string) => {
    setSelectedDay(key)
    document.getElementById(`day-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmInterview = async (id: string) => {
    const res = await update(id, { status: 'confirmed' })
    if (!(res as { error?: string } | undefined)?.error) island({ title: 'Entretien confirmé', subtitle: 'Le recruteur est prévenu', tone: 'success' })
  }

  return (
    <div className="max-w-[860px] mx-auto">
      <LargeTitle
        eyebrow={<span className="capitalize">{todayLabel}</span>}
        title="Entretiens"
        subtitle={`${upcoming.length} entretien${upcoming.length > 1 ? 's' : ''} à venir`}
      />

      {upcoming.length === 0 ? (
        <GlassEmpty
          title="Aucun entretien planifié"
          description="Lorsqu'un recruteur planifie un entretien avec toi, il apparaîtra ici."
          icon={<Calendar size={26} />}
        />
      ) : (
        <>
          {/* ── Prochain entretien ── */}
          {next && (() => {
            const d = new Date(next.scheduled_at)
            const end = new Date(d.getTime() + (next.duration_min ?? 0) * 60000)
            const color = TYPE_COLOR[next.type]
            return (
              <section className="os-glass osc-in relative overflow-hidden rounded-[30px] p-6 sm:p-7 mb-6 shadow-[var(--os-elevation)]">
                <div aria-hidden className="absolute -right-24 -top-24 w-72 h-72 rounded-full blur-3xl opacity-40" style={{ background: color }} />
                <div className="relative flex flex-col sm:flex-row sm:items-end gap-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--kz-mute)]">Prochain entretien</p>
                    <p className="text-[34px] sm:text-[40px] font-semibold tracking-[-0.05em] leading-none mt-2 os-text-aurora" aria-live="polite">{countdown(d, now)}</p>
                    <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)] mt-3 truncate">{next.job?.title ?? 'Entretien'}</h2>
                    <p className="text-[14px] text-[var(--kz-mute)] truncate">{next.job?.company?.name ?? next.recruiter?.full_name}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[13px] text-[var(--kz-text)]">
                      <span className="inline-flex items-center gap-1.5 capitalize"><Calendar size={14} className="text-[var(--kz-mute)]" />{dayLabel(d, now)}</span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums"><Clock size={14} className="text-[var(--kz-mute)]" />{hhmm(d)} – {hhmm(end)}</span>
                      <span className="inline-flex items-center gap-1.5" style={{ color }}>{TYPE_ICON[next.type]}{TYPE_LABEL[next.type]}</span>
                    </div>
                  </div>
                  {next.visio_link && next.type === 'video' && (
                    <a href={next.visio_link} target="_blank" rel="noreferrer" className="shrink-0">
                      <Button kind="primary" size="lg" full icon={<Video size={16} />}>Rejoindre</Button>
                    </a>
                  )}
                </div>
              </section>
            )
          })()}

          {/* ── Bandeau des jours (14 jours) ── */}
          <nav aria-label="Jours à venir" className="osc-scroll-x osc-fade-edges gap-1.5 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 [scroll-snap-type:none]">
            {strip.map((d) => {
              const key = dayKey(d)
              const busy = busyDays.has(key)
              const isToday = d.toDateString() === new Date(now).toDateString()
              const selected = selectedDay === key
              return (
                <button key={key} type="button" disabled={!busy} onClick={() => jumpTo(key)}
                  aria-label={`${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${busy ? ', entretien prévu' : ''}`}
                  className={cn('osc-press shrink-0 w-12 py-2 rounded-[16px] flex flex-col items-center gap-1 transition-colors', busy ? 'hover:bg-[var(--osc-surface-hi)]' : 'opacity-45 cursor-default', selected && 'bg-[var(--osc-surface-hi)]')}>
                  <span className={cn('text-[11px] font-semibold uppercase', isToday ? 'text-[var(--kz-orange)]' : 'text-[var(--kz-mute)]')}>
                    {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').slice(0, 3)}
                  </span>
                  <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[16px] font-semibold tabular-nums',
                    isToday ? 'text-white' : selected ? 'bg-[var(--kz-ink)] text-[var(--kz-inverse)]' : 'text-[var(--kz-ink)]')}
                    style={isToday ? { background: 'var(--os-aurora)' } : undefined}>
                    {d.getDate()}
                  </span>
                  <span className={cn('w-1.5 h-1.5 rounded-full', busy ? 'bg-[var(--kz-blue)]' : 'bg-transparent')} />
                </button>
              )
            })}
          </nav>

          {/* ── Liste par jour ── */}
          <div className="flex flex-col gap-7">
            {groups.map(({ date, ivs }) => (
              <section key={dayKey(date)} id={`day-${dayKey(date)}`} className="scroll-mt-4">
                <div className="sticky top-0 z-10 -mx-2 px-2 py-2 mb-2 flex items-baseline justify-between bg-[linear-gradient(180deg,var(--kz-cream)_70%,transparent)]">
                  <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[var(--kz-ink)] capitalize">{dayLabel(date, now)}</h2>
                  <span className="text-[13px] text-[var(--kz-mute)]">{ivs.length} entretien{ivs.length > 1 ? 's' : ''}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {ivs.map((iv, i) => {
                    const d = new Date(iv.scheduled_at)
                    const end = new Date(d.getTime() + (iv.duration_min ?? 0) * 60000)
                    const isPast = d.getTime() < now
                    const color = TYPE_COLOR[iv.type]
                    const st = STATUS[iv.status] ?? STATUS.cancelled
                    const canJoin = !!iv.visio_link && iv.type === 'video' && !isPast
                    const canConfirm = !isPast && iv.status === 'pending'

                    return (
                      <article key={iv.id} className={cn('osc-card osc-in flex overflow-hidden', isPast && 'opacity-60')} style={{ ['--i' as string]: i }}>
                        {/* Heure */}
                        <div className="w-[68px] sm:w-[84px] shrink-0 py-4 pl-3 pr-2 text-right tabular-nums">
                          <div className="text-[15px] font-semibold text-[var(--kz-ink)]">{hhmm(d)}</div>
                          <div className="text-[12px] text-[var(--kz-mute)]">{hhmm(end)}</div>
                          <div className="text-[11px] text-[var(--kz-mute)] mt-1">{iv.duration_min} min</div>
                        </div>
                        {/* Barre de couleur (type) */}
                        <div aria-hidden className="w-[3px] my-3 rounded-full shrink-0" style={{ background: color }} />
                        {/* Contenu */}
                        <div className="flex-1 min-w-0 p-4" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${color} 9%, transparent), transparent 70%)` }}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[var(--kz-ink)] leading-snug">{iv.job?.title ?? 'Entretien'}</h3>
                              <p className="text-[13px] text-[var(--kz-mute)] truncate">{iv.job?.company?.name ?? iv.recruiter?.full_name}</p>
                            </div>
                            <Pill tone={st.tone} dot className="shrink-0">{st.label}</Pill>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[13px]">
                            <span className="inline-flex items-center gap-1.5 font-medium" style={{ color }}>{TYPE_ICON[iv.type]}{TYPE_LABEL[iv.type]}</span>
                            {iv.location && <span className="inline-flex items-center gap-1 text-[var(--kz-text)] min-w-0"><MapPin size={13} className="text-[var(--kz-mute)] shrink-0" /><span className="truncate">{iv.location}</span></span>}
                          </div>

                          {iv.notes && (
                            <div className="mt-3 flex gap-2 text-[13px] leading-relaxed text-[var(--kz-text)] p-3 rounded-[14px] bg-[var(--osc-surface)]">
                              <StickyNote size={14} className="shrink-0 mt-0.5 text-[var(--kz-mute)]" />
                              <span className="min-w-0">{iv.notes}</span>
                            </div>
                          )}

                          {(canJoin || canConfirm || iv.visio_link) && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {canJoin && (
                                <a href={iv.visio_link!} target="_blank" rel="noreferrer" className="flex-1 min-w-[160px]">
                                  <Button kind="primary" size="md" full icon={<Video size={15} />}>
                                    Rejoindre la visio
                                  </Button>
                                </a>
                              )}
                              {canConfirm && (
                                <Button kind="outline" size="md" icon={<Check size={15} />} onClick={() => confirmInterview(iv.id)}>
                                  Confirmer
                                </Button>
                              )}
                              {iv.visio_link && (
                                <a href={iv.visio_link} target="_blank" rel="noreferrer" aria-label="Ouvrir le lien de l’entretien">
                                  <Button kind="soft" size="md" icon={<ExternalLink size={14} />} aria-label="Ouvrir le lien de l’entretien" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
