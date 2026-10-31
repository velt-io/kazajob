'use client'

import { useMemo, useState } from 'react'
import { Calendar, Video, Phone, MapPin, ExternalLink, ChevronLeft, ChevronRight, Swords, Hourglass, Check, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useInterviews, type Interview } from '@/features/interviews/useInterviews'
import { island } from '@/lib/island'
import { PanelTitle, QuestEmpty, QuestPageHeader } from '@/components/quest/candidat/QuestKit'
import { countdownLabel, dayKey, monthGrid } from '@/components/quest/candidat/quest-ui'

const TYPE_ICON = {
  video:  <Video size={15} />,
  phone:  <Phone size={15} />,
  onsite: <MapPin size={15} />,
}

const TYPE_LABEL = {
  video:  'Visioconférence',
  phone:  'Téléphone',
  onsite: 'Présentiel',
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: 'À confirmer', color: '#FACC15' },
  confirmed: { label: 'Confirmé',    color: '#4ADE80' },
  cancelled: { label: 'Annulé',      color: '#A3A3B8' },
  done:      { label: 'Terminé',     color: '#C084FC' },
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const hhmm = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

export default function CandidateAgendaPage() {
  const { upcoming, byDate, loading, update } = useInterviews()

  // Rendez-vous non annulés, regroupés par jour (clé AAAA-MM-JJ) et triés.
  const groups = useMemo(() => Object.values(byDate)
    .map((ivs) => ivs.filter((iv) => iv.status !== 'cancelled'))
    .filter((ivs) => ivs.length > 0)
    .map((ivs) => ({ key: dayKey(new Date(ivs[0].scheduled_at)), date: new Date(ivs[0].scheduled_at), ivs }))
    .sort((a, b) => a.date.getTime() - b.date.getTime()), [byDate])
  const daysWith = useMemo(() => new Set(groups.map((g) => g.key)), [groups])
  const next = useMemo(() => [...upcoming].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0], [upcoming])

  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null)
  const [focusDay, setFocusDay] = useState<string | null>(null)

  if (loading) return <PageLoader />

  const base = next ? new Date(next.scheduled_at) : new Date()
  const view = cursor ?? { y: base.getFullYear(), m: base.getMonth() }
  const weeks = monthGrid(view.y, view.m)
  const today = new Date()
  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
  }

  const goToDay = (key: string) => {
    setFocusDay(key)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(`rdv-${key}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  const confirm = async (iv: Interview) => {
    const res = await update(iv.id, { status: 'confirmed' })
    if (!(res as { error?: unknown } | null)?.error) {
      island({ title: 'Rendez-vous scellé', subtitle: iv.job?.title ?? 'Entretien confirmé', tone: 'success' })
    }
  }

  return (
    <div className="max-w-[1080px] mx-auto">
      <QuestPageHeader
        eyebrow="Calendrier de la guilde"
        title="Rendez-vous"
        accent="de guilde"
        icon={<CalendarDays size={20} />}
        subtitle={`${upcoming.length} entretien${upcoming.length > 1 ? 's' : ''} à venir · chaque épreuve rapproche du trésor.`}
      />

      {upcoming.length === 0 ? (
        <QuestEmpty
          title="Aucun entretien planifié"
          description="Lorsqu'un recruteur planifie un entretien avec toi, il apparaîtra ici."
          icon={<Calendar size={28} />}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 mb-8">
            {/* Prochaine épreuve */}
            {next && (() => {
              const d = new Date(next.scheduled_at)
              const st = STATUS_META[next.status] ?? STATUS_META.pending
              return (
                <div className="qxc-card qxc-legend p-5 sm:p-6 flex flex-col qx-rise" style={{ ['--r' as string]: 'var(--qx-gold)' }}>
                  <span className="qxc-corners" aria-hidden />
                  <p className="kz-eyebrow text-[var(--qx-gold)] mb-3 flex items-center gap-1.5"><Swords size={12} aria-hidden />Prochaine épreuve</p>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-20 rounded-xl overflow-hidden border border-[#FACC15]/50 text-center shadow-[0_0_24px_-8px_rgba(250,204,21,0.9)]">
                      <div className="bg-[linear-gradient(120deg,#FDE68A,#FACC15,#F59E0B)] text-[#1A0B2E] text-[10px] font-bold uppercase tracking-[0.14em] py-1">
                        {d.toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                      <div className="bg-[rgba(12,5,24,0.75)] py-2">
                        <div className="text-[30px] font-bold text-white leading-none font-[family-name:var(--font-epic)]">{d.getDate()}</div>
                        <div className="text-[11px] text-[var(--kz-mute)] mt-1 capitalize">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[20px] sm:text-[24px] font-bold text-white leading-tight break-words">{next.job?.title ?? 'Entretien'}</h2>
                      <div className="text-sm text-[var(--kz-text)] mt-1">{next.job?.company?.name ?? next.recruiter?.full_name}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-[12px]">
                        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg font-bold text-[#1A0B2E] bg-[linear-gradient(120deg,#FDE68A,#FACC15)]">
                          <Hourglass size={12} aria-hidden />{countdownLabel(d)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[var(--kz-text)]">{TYPE_ICON[next.type]}{hhmm(d)} · {next.duration_min} min</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md border" style={{ color: st.color, borderColor: `color-mix(in srgb, ${st.color} 55%, transparent)`, background: `color-mix(in srgb, ${st.color} 12%, transparent)` }}>{st.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[#FACC15]/20">
                    {next.visio_link && next.type === 'video' && (
                      <a href={next.visio_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[12px] font-bold uppercase tracking-[0.08em] text-white border border-[#F0ABFC]/60 bg-[linear-gradient(120deg,#7C3AED,#A855F7_45%,#E879F9)] shadow-[0_0_22px_-4px_rgba(232,121,249,0.75)] hover:-translate-y-0.5 transition">
                        <Video size={15} aria-hidden />Rejoindre la visio
                      </a>
                    )}
                    {next.status === 'pending' && (
                      <Button kind="dark" size="md" className="h-10" icon={<Check size={15} />} onClick={() => confirm(next)}>Confirmer ma venue</Button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Calendrier */}
            <div className="qx-panel p-4 sm:p-5 qx-rise" style={{ animationDelay: '0.1s' }}>
              <PanelTitle icon={<Calendar size={13} />} as="h2"
                extra={
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => shift(-1)} aria-label="Mois précédent" className="w-8 h-8 grid place-items-center rounded-lg border border-[#C084FC]/25 hover:bg-[rgba(168,85,247,0.15)]"><ChevronLeft size={15} /></button>
                    <button type="button" onClick={() => shift(1)} aria-label="Mois suivant" className="w-8 h-8 grid place-items-center rounded-lg border border-[#C084FC]/25 hover:bg-[rgba(168,85,247,0.15)]"><ChevronRight size={15} /></button>
                  </div>
                }>
                <span className="capitalize">{monthLabel}</span>
              </PanelTitle>
              <div className="qxc-cal mb-1" aria-hidden>
                {WEEKDAYS.map((w, i) => <div key={i} className="text-center text-[10px] font-bold text-[var(--kz-mute)] py-1">{w}</div>)}
              </div>
              <div className="qxc-cal" role="group" aria-label={`Calendrier ${monthLabel}`}>
                {weeks.flat().map((day, i) => {
                  if (day === null) return <div key={i} aria-hidden />
                  const date = new Date(view.y, view.m, day)
                  const key = dayKey(date)
                  const has = daysWith.has(key)
                  const isToday = key === dayKey(today)
                  const past = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
                  return has ? (
                    <button key={i} type="button" className="qxc-day" data-has="true" data-today={isToday} data-past={past}
                      onClick={() => goToDay(key)} aria-label={`${label} : rendez-vous`}>
                      {day}
                    </button>
                  ) : (
                    <div key={i} className="qxc-day" data-today={isToday}>{day}</div>
                  )
                })}
              </div>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-[var(--kz-mute)]">
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#FACC15]" aria-hidden />Rendez-vous</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm border border-[#22D3EE]" aria-hidden />Aujourd&apos;hui</span>
              </div>
            </div>
          </div>

          {/* Chronique des rendez-vous */}
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <div key={g.key} id={`rdv-${g.key}`} className="scroll-mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.4))]" />
                  <span className={`text-[12px] font-bold uppercase tracking-[0.14em] px-2 capitalize font-[family-name:var(--font-epic)] ${focusDay === g.key ? 'text-[var(--qx-gold)] qx-glow-text' : 'text-[var(--kz-mute)]'}`}>
                    {g.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(250,204,21,0.4),transparent)]" />
                </div>

                <div className="flex flex-col gap-3">
                  {g.ivs.map((iv) => {
                    const d = new Date(iv.scheduled_at)
                    const isToday = d.toDateString() === new Date().toDateString()
                    const isPast = d < new Date()
                    const st = STATUS_META[iv.status] ?? STATUS_META.pending
                    const tone = isToday ? 'var(--qx-gold)' : isPast ? '#A3A3B8' : 'var(--qx-neon)'

                    return (
                      <article key={iv.id} className={`qxc-card p-4 sm:p-5 ${isPast ? 'opacity-75' : ''} ${focusDay === g.key ? 'qx-rise' : ''}`} style={{ ['--r' as string]: tone }}>
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-xl border flex flex-col items-center justify-center shrink-0 font-bold"
                            style={{ borderColor: `color-mix(in srgb, ${tone} 60%, transparent)`, background: `color-mix(in srgb, ${tone} 14%, rgba(12,5,24,0.7))` }}>
                            <div className="text-[18px] leading-none text-white tabular-nums">{hhmm(d)}</div>
                            <div className="text-[10px] text-[var(--kz-mute)] mt-1">{iv.duration_min} min</div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-[15px] sm:text-base font-bold text-white font-[family-name:var(--font-epic)] tracking-wide break-words">{iv.job?.title ?? 'Entretien'}</h3>
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md border" style={{ color: st.color, borderColor: `color-mix(in srgb, ${st.color} 55%, transparent)`, background: `color-mix(in srgb, ${st.color} 12%, transparent)` }}>{st.label}</span>
                              {isToday && <span className="text-[10px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md text-[#1A0B2E] bg-[#FACC15]">Aujourd&apos;hui</span>}
                            </div>
                            <div className="text-sm text-[var(--kz-text)] mb-2">
                              {iv.job?.company?.name ?? iv.recruiter?.full_name}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-[var(--kz-mute)] flex-wrap">
                              <span className="text-[var(--qx-cyan)]" aria-hidden>{TYPE_ICON[iv.type]}</span>
                              {TYPE_LABEL[iv.type]}
                              {iv.location && <span>· {iv.location}</span>}
                            </div>

                            {iv.notes && (
                              <div className="mt-2.5 text-xs text-[var(--kz-text)] p-2.5 rounded-lg border border-[#FACC15]/20 bg-[rgba(250,204,21,0.05)] italic">
                                « {iv.notes} »
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {(iv.visio_link || (!isPast && iv.status === 'pending')) && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-[#C084FC]/15 flex-wrap">
                            {iv.visio_link && iv.type === 'video' && !isPast && (
                              <a href={iv.visio_link} target="_blank" rel="noreferrer" className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold uppercase tracking-[0.08em] text-white border border-[#C084FC]/60 bg-[#6D28D9] shadow-[0_0_20px_-6px_rgba(168,85,247,0.8)] hover:bg-[#7C3AED] transition">
                                <Video size={15} aria-hidden />Rejoindre la visio
                              </a>
                            )}
                            {!isPast && iv.status === 'pending' && (
                              <Button kind="outline" size="md" icon={<Check size={14} />} onClick={() => confirm(iv)}>
                                Confirmer
                              </Button>
                            )}
                            {iv.visio_link && (
                              <a href={iv.visio_link} target="_blank" rel="noreferrer" aria-label="Ouvrir le lien de l'entretien dans un nouvel onglet"
                                className="w-9 h-9 grid place-items-center rounded-xl bg-[rgba(168,85,247,0.12)] hover:bg-[rgba(168,85,247,0.22)] text-[var(--kz-ink)] transition-colors">
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
