'use client'

import { useEffect, useState } from 'react'
import { MapPin, Users, Clock, ExternalLink, Star, UserCheck, Monitor, BookOpen, Check, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { EVENT_TYPES } from '@/lib/constants'
import { GlassEmpty, LargeTitle, Pill } from '@/components/os/candidate/primitives'
import { cn } from '@/lib/utils'

const EVENT_ICONS: Record<string, React.ReactNode> = {
  job_dating:      <UserCheck size={13} />,
  webinar:         <Monitor   size={13} />,
  atelier:         <BookOpen  size={13} />,
  info_collective: <Megaphone size={13} />,
}

// Couleurs du thème par type (les couleurs de constants.ts sont pensées pour le thème clair)
const EVENT_TINT: Record<string, string> = {
  job_dating:      'var(--kz-violet)',
  webinar:         'var(--kz-blue)',
  atelier:         'var(--kz-orange)',
  info_collective: 'var(--kz-green)',
}

interface KazaEvent {
  id: string
  title: string
  description: string | null
  type: string
  date: string
  duration_minutes: number
  max_participants: number
  location: string
  jitsi_room: string | null
  registrations_count: number
  is_registered: boolean
}

export default function CandidateEventsPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<KazaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)

  const fetchEvents = async () => {
    if (!profile?.id) return
    try {
      const res = await fetch('/api/events')
      if (res.ok) {
        const all = (await res.json()) as KazaEvent[]
        // À venir uniquement, triés par date croissante
        const now = Date.now()
        setEvents(
          all
            .filter((e) => new Date(e.date).getTime() >= now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        )
      }
    } catch { /* noop */ }
    setLoading(false)
  }

  // Logique d'origine conservée telle quelle.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchEvents() }, [profile?.id])

  const handleRegister = async (eventId: string, isReg: boolean) => {
    if (!profile?.id) return
    setRegistering(eventId)
    await fetch(`/api/events/${eventId}/register`, { method: isReg ? 'DELETE' : 'POST' })
    await fetchEvents()
    setRegistering(null)
  }

  const isEventLive = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    return d <= now && new Date(d.getTime() + 120 * 60_000) > now
  }

  return (
    <div className="max-w-[860px] mx-auto">
      <LargeTitle
        eyebrow="Événements"
        title="KazaEvents"
        accent="974"
        subtitle="Job datings en ligne, webinaires, ateliers : rencontre les recruteurs de La Réunion."
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="osc-skeleton h-36 rounded-[24px] border border-[var(--kz-line)]" />)}
        </div>
      ) : events.length === 0 ? (
        <GlassEmpty
          title="Aucun événement à venir"
          description="Les prochains KazaEvents seront publiés bientôt. Reviens vite !"
          icon={<Star size={26} />}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((evt, i) => {
            const typeInfo = EVENT_TYPES[evt.type] ?? { label: evt.type }
            const tint = EVENT_TINT[evt.type] ?? 'var(--kz-mute)'
            const eventDate = new Date(evt.date)
            const isFull = evt.registrations_count >= evt.max_participants && !evt.is_registered
            const live = isEventLive(evt.date)
            const spotsLeft = evt.max_participants - evt.registrations_count
            const fill = evt.max_participants > 0 ? Math.min(100, (evt.registrations_count / evt.max_participants) * 100) : 0

            return (
              <article
                key={evt.id}
                className={cn('osc-card osc-in p-5 sm:p-6 flex flex-col sm:flex-row gap-5', live && 'os-ring-aurora')}
                style={{ ['--i' as string]: i }}
              >
                {/* Pastille date façon Calendrier */}
                <div className="w-[68px] shrink-0 self-start rounded-[18px] overflow-hidden border border-[var(--kz-edge)] text-center bg-[var(--osc-surface)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] py-1 text-white" style={{ background: tint }}>
                    {eventDate.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                  </div>
                  <div className="text-[28px] font-semibold tracking-[-0.04em] text-[var(--kz-ink)] leading-none pt-2 tabular-nums">{eventDate.getDate()}</div>
                  <div className="text-[10px] text-[var(--kz-mute)] pb-2 pt-1 capitalize">{eventDate.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</div>
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold"
                      style={{ color: tint, background: `color-mix(in srgb, ${tint} 16%, transparent)` }}>
                      {EVENT_ICONS[evt.type]}{typeInfo.label}
                    </span>
                    {live && (
                      <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold text-[var(--kz-green)] bg-[var(--kz-green-soft)]">
                        <span className="osc-pulse w-1.5 h-1.5 rounded-full bg-[var(--kz-green)] text-[var(--kz-green)]" />En direct
                      </span>
                    )}
                    {evt.is_registered && !live && <Pill tone="green"><Check size={11} strokeWidth={3} />Inscrit</Pill>}
                  </div>

                  <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)] leading-snug">{evt.title}</h3>
                  {evt.description && (
                    <p className="text-[14px] text-[var(--kz-mute)] mt-1 line-clamp-2 leading-relaxed">{evt.description}</p>
                  )}

                  <div className="flex gap-x-4 gap-y-1 flex-wrap text-[13px] text-[var(--kz-text)] mt-3">
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <Clock size={13} className="text-[var(--kz-mute)]" />
                      {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {evt.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1.5"><MapPin size={13} className="text-[var(--kz-mute)]" />{evt.location}</span>
                  </div>

                  {/* Jauge des places */}
                  <div className="mt-4 max-w-[320px]">
                    <div className="flex items-center justify-between text-[12px] mb-1.5">
                      <span className="flex items-center gap-1.5 text-[var(--kz-mute)]"><Users size={12} />
                        {isFull ? <span className="text-[var(--kz-orange)] font-semibold">Complet</span> : <span><strong className="text-[var(--kz-ink)]">{spotsLeft}</strong> places restantes</span>}
                      </span>
                      <span className="text-[var(--kz-mute)] tabular-nums">{evt.registrations_count}/{evt.max_participants}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--kz-line)] overflow-hidden">
                      <div className="osc-track-fill h-full rounded-full" style={{ width: `${fill}%`, background: tint, ['--i' as string]: i }} />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0 sm:items-end sm:justify-center">
                  {live && evt.is_registered && evt.jitsi_room ? (
                    <a href={`https://meet.jit.si/${evt.jitsi_room}`} target="_blank" rel="noreferrer">
                      <Button kind="primary" size="md" icon={<ExternalLink size={14} />}>Rejoindre</Button>
                    </a>
                  ) : (
                    <Button
                      kind={evt.is_registered ? 'soft' : isFull ? 'outline' : 'primary'}
                      size="md"
                      loading={registering === evt.id}
                      disabled={isFull && !evt.is_registered}
                      onClick={() => handleRegister(evt.id, evt.is_registered)}
                    >
                      {evt.is_registered ? 'Se désinscrire' : isFull ? 'Complet' : 'S\'inscrire'}
                    </Button>
                  )}
                  {evt.is_registered && !live && (
                    <p className="text-[11px] text-[var(--kz-mute)] sm:text-right">Lien disponible le jour J</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
