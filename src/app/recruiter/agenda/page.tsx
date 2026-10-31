'use client'

import { useState } from 'react'
import { Calendar, Video, Phone, MapPin, Send, ExternalLink, Check, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useInterviews, type Interview } from '@/features/interviews/useInterviews'
import { ACCENT, EmptyPanel, PageHeader, StatusPill, accentStyle, tint } from '@/components/os/recruiter/primitives'
import { stagger } from '@/components/os/recruiter/secondary-ui'

const STATUS_META: Record<string, { label: string; accent: string }> = {
  pending:   { label: 'En attente', accent: ACCENT.yellow },
  confirmed: { label: 'Confirmé',   accent: ACCENT.green },
  cancelled: { label: 'Annulé',     accent: ACCENT.mute },
  done:      { label: 'Terminé',    accent: ACCENT.violet },
}

const TYPE_META = {
  video:  { label: 'Visioconférence', Icon: Video,  accent: ACCENT.blue },
  phone:  { label: 'Téléphone',       Icon: Phone,  accent: ACCENT.green },
  onsite: { label: 'Présentiel',      Icon: MapPin, accent: ACCENT.orange },
} as const

const hhmm = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

export default function RecruiterAgendaPage() {
  const { upcoming, byDate, loading, update } = useInterviews()
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  const sendReminder = async (iv: Interview) => {
    setSendingReminder(iv.id)
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'interview_reminder', interviewId: iv.id, recipient: 'candidate' }),
    })
    setSendingReminder(null)
  }

  if (loading) return <PageLoader />

  // Bande « semaine » (7 jours à partir d'aujourd'hui), points = entretiens à venir
  const today = new Date()
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    const count = upcoming.filter((iv) => new Date(iv.scheduled_at).toDateString() === d.toDateString()).length
    return { d, count, key: d.toLocaleDateString('fr-FR') }
  })

  const groups = Object.entries(byDate)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, ivs]) => [date, ivs.filter((iv) => iv.status !== 'cancelled')] as const)
    .filter(([, ivs]) => ivs.length > 0)

  return (
    <div className="max-w-[960px] mx-auto">
      <PageHeader
        eyebrow="Agenda"
        title="Entretiens"
        subtitle={`${upcoming.length} entretien(s) à venir`}
        actions={<StatusPill accent={ACCENT.violet}>Planifiez depuis une candidature</StatusPill>}
      />

      {/* Semaine */}
      <div className="os-glass rounded-[26px] p-3 sm:p-4 mb-7">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {week.map(({ d, count, key }, i) => {
            const isToday = i === 0
            const target = groups.some(([g]) => g === key) ? `agenda-${key.replace(/\//g, '-')}` : undefined
            const cls = 'flex flex-col items-center gap-1 py-2.5 rounded-[16px] transition-colors'
            const inner = (
              <>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--kz-mute)]">
                  {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                </span>
                <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[16px] sm:text-[18px] font-semibold tabular-nums ${isToday ? 'text-white' : 'text-[var(--kz-ink)]'}`}
                  style={isToday ? { background: 'var(--osr-red)' } : undefined}>
                  {d.getDate()}
                </span>
                <span className="flex gap-0.5 h-1.5" aria-hidden>
                  {Array.from({ length: Math.min(count, 3) }).map((_, k) => (
                    <i key={k} className="block w-1.5 h-1.5 rounded-full" style={{ background: ACCENT.violet }} />
                  ))}
                </span>
              </>
            )
            return target ? (
              <a key={key} href={`#${target}`} className={`${cls} hover:bg-white/[0.06]`}
                aria-label={`${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} : ${count} entretien(s)`}>
                {inner}
              </a>
            ) : (
              <div key={key} className={cls}>{inner}</div>
            )
          })}
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel
            icon={<Calendar size={28} />}
            accent={ACCENT.red}
            title="Aucun entretien planifié"
            description="Planifiez des entretiens depuis la page Candidatures en changeant le statut d'une candidature."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(([date, ivs]) => {
            const day = new Date(ivs[0].scheduled_at)
            const isTodayGroup = day.toDateString() === today.toDateString()
            return (
              <div key={date} id={`agenda-${date.replace(/\//g, '-')}`} className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-3 sm:gap-5 scroll-mt-6">
                {/* Date (colonne gauche façon Calendrier) */}
                <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0 sm:pt-2">
                  <span className={`text-[34px] sm:text-[44px] font-semibold tracking-[-0.05em] leading-none tabular-nums ${isTodayGroup ? 'text-[var(--osr-red)]' : 'text-white'}`}>
                    {day.getDate()}
                  </span>
                  <span className="text-[13px] font-semibold capitalize text-[var(--kz-mute)]">
                    {isTodayGroup ? 'Aujourd’hui' : day.toLocaleDateString('fr-FR', { weekday: 'long' })}
                    <span className="sm:block font-normal"> {day.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                  </span>
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                  {ivs.map((iv, idx) => {
                    const d = new Date(iv.scheduled_at)
                    const isToday = d.toDateString() === new Date().toDateString()
                    const isPast = d < new Date()
                    const candidate = iv.candidate
                    const st = STATUS_META[iv.status] ?? STATUS_META.cancelled
                    const type = TYPE_META[iv.type] ?? TYPE_META.video
                    const end = new Date(d.getTime() + iv.duration_min * 60000)

                    return (
                      <div key={iv.id} className="osr-panel osr-in relative overflow-hidden" style={{ ...stagger(idx), ...accentStyle(type.accent), opacity: isPast ? 0.65 : undefined }}>
                        {/* Bande de couleur (événement Calendrier) */}
                        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[4px]" style={{ background: type.accent }} />
                        {isToday && !isPast && <span aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(90deg, ${tint(type.accent, 12)}, transparent 60%)` }} />}

                        <div className="relative p-4 sm:p-5 pl-5 sm:pl-6">
                          <div className="flex items-start gap-4">
                            <div className="shrink-0 text-left">
                              <div className="text-[20px] font-semibold tracking-[-0.03em] text-white tabular-nums leading-none">{hhmm(d)}</div>
                              <div className="text-[11px] text-[var(--kz-mute)] mt-1 tabular-nums flex items-center gap-1"><Clock size={10} />{hhmm(end)} · {iv.duration_min} min</div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-[16px] font-semibold text-white tracking-[-0.01em]">{iv.job?.title ?? 'Entretien'}</span>
                                <StatusPill accent={st.accent}>{st.label}</StatusPill>
                                {isToday && <StatusPill accent={ACCENT.red} live>Aujourd&apos;hui</StatusPill>}
                              </div>

                              {candidate && (
                                <div className="flex items-center gap-2 mb-2 min-w-0">
                                  <Avatar name={candidate.full_name} src={candidate.avatar_url} avatarConfig={candidate.avatar_config} size={26} color="var(--kz-orange-soft)" />
                                  <span className="text-[14px] font-medium text-[var(--kz-ink)] truncate">{candidate.full_name}</span>
                                  <span className="text-[12px] text-[var(--kz-mute)] truncate hidden sm:inline">{candidate.email}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 text-[12px] text-[var(--kz-mute)] flex-wrap">
                                <type.Icon size={13} style={{ color: type.accent }} />
                                {type.label}
                                {iv.location && <span>· {iv.location}</span>}
                              </div>

                              {iv.visio_link && (
                                <div className="mt-1 text-[12px] flex items-center gap-1.5 min-w-0">
                                  <ExternalLink size={11} className="text-[var(--kz-mute)] shrink-0" />
                                  <a href={iv.visio_link} target="_blank" rel="noreferrer" className="truncate text-[var(--kz-blue)] hover:underline">
                                    {iv.visio_link}
                                  </a>
                                </div>
                              )}

                              {iv.notes && (
                                <div className="mt-3 osr-inset px-3 py-2.5 text-[13px] text-[var(--kz-text)] leading-relaxed">
                                  {iv.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions recruteur */}
                          {(() => {
                            const showJoin = !!iv.visio_link && iv.type === 'video' && !isPast
                            const anyAction = showJoin || !isPast || iv.status === 'pending'
                            if (!anyAction) return null
                            return (
                              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                                {showJoin && (
                                  <a href={iv.visio_link!} target="_blank" rel="noreferrer">
                                    <Button kind="dark" size="sm" icon={<Video size={14} />}>Rejoindre</Button>
                                  </a>
                                )}
                                {!isPast && (
                                  <Button kind="soft" size="sm" icon={<Send size={13} />} loading={sendingReminder === iv.id} onClick={() => sendReminder(iv)}>
                                    Envoyer rappel
                                  </Button>
                                )}
                                {iv.status === 'pending' && (
                                  <Button kind="soft" size="sm" icon={<Check size={13} />} onClick={() => update(iv.id, { status: 'confirmed' })}>
                                    Confirmer
                                  </Button>
                                )}
                                {!isPast && iv.status !== 'cancelled' && (
                                  <Button kind="ghost" size="sm" icon={<X size={13} />} className="!text-[var(--osr-red)] hover:!bg-[color-mix(in_srgb,var(--osr-red)_14%,transparent)]" onClick={() => update(iv.id, { status: 'cancelled' })}>
                                    Annuler
                                  </Button>
                                )}
                                {!isPast && iv.status !== 'done' && isPast && (
                                  <Button kind="soft" size="sm" onClick={() => update(iv.id, { status: 'done' })}>
                                    Marquer terminé
                                  </Button>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
