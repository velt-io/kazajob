'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, Clock, ExternalLink, Star, UserCheck, Monitor, BookOpen, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { KZ, EVENT_TYPES } from '@/lib/constants'
import { QuestEmpty, QuestPageHeader } from '@/components/quest/candidat/QuestKit'

const EVENT_ICONS: Record<string, React.ReactNode> = {
  job_dating: <UserCheck size={13} />,
  webinar:    <Monitor   size={13} />,
  atelier:    <BookOpen  size={13} />,
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
    <div className="max-w-[900px] mx-auto">
      <QuestPageHeader
        eyebrow="Rassemblements de la guilde"
        title="KazaEvents"
        accent="974"
        icon={<Star size={20} />}
        subtitle="Job dating en ligne, webinaires, ateliers — rencontrez les recruteurs de La Réunion."
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="qxc-card h-32 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <QuestEmpty
          title="Aucun événement à venir"
          description="Les prochains KazaEvents seront publiés bientôt. Revenez vite !"
          icon={<Star size={28} />}
        />
      ) : (
        <ul className="flex flex-col gap-4 qxc-stagger">
          {events.map(evt => {
            const typeInfo = EVENT_TYPES[evt.type] ?? { label: evt.type, color: KZ.mute, bg: KZ.cream2 }
            const eventDate = new Date(evt.date)
            const isFull = evt.registrations_count >= evt.max_participants && !evt.is_registered
            const live = isEventLive(evt.date)
            const spotsLeft = evt.max_participants - evt.registrations_count
            const tone = live ? '#4ADE80' : evt.is_registered ? 'var(--qx-gold)' : 'var(--qx-neon)'

            return (
              <li
                key={evt.id}
                className={`qxc-card ${live ? 'qxc-legend' : ''} p-4 sm:p-5 flex flex-col sm:flex-row gap-4`}
                style={{ ['--r' as string]: tone }}
              >
                {/* Date */}
                <div className="w-16 shrink-0 self-start rounded-xl overflow-hidden border text-center"
                  style={{ borderColor: `color-mix(in srgb, ${tone} 55%, transparent)` }}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] py-0.5 text-[#1A0B2E]" style={{ background: tone }}>
                    {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
                  </div>
                  <div className="py-1.5 bg-[rgba(12,5,24,0.7)] text-[24px] font-bold text-white leading-none font-[family-name:var(--font-epic)]">
                    {eventDate.getDate()}
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border"
                      style={{ color: `color-mix(in srgb, ${typeInfo.color} 60%, white)`, borderColor: `color-mix(in srgb, ${typeInfo.color} 50%, transparent)`, background: `color-mix(in srgb, ${typeInfo.color} 14%, transparent)` }}
                    >
                      {EVENT_ICONS[evt.type]}{typeInfo.label}
                    </span>
                    {live && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border border-[#F87171]/50 bg-[rgba(248,113,113,0.12)] text-[#FCA5A5]">
                        <span className="qxc-live" aria-hidden /> En direct
                      </span>
                    )}
                    {evt.is_registered && !live && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border border-[#FACC15]/50 bg-[rgba(250,204,21,0.12)] text-[#FDE68A]">
                        <Check size={11} aria-hidden /> Inscrit
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1 font-[family-name:var(--font-epic)] tracking-wide break-words">{evt.title}</h3>
                  {evt.description && (
                    <p className="text-sm text-[var(--kz-mute)] mb-2 line-clamp-2">{evt.description}</p>
                  )}

                  <div className="flex gap-x-4 gap-y-1 flex-wrap text-xs text-[var(--kz-text)]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-[var(--kz-mute)]" aria-hidden />
                      {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {' '}· {evt.duration_minutes}min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-[var(--qx-cyan)]" aria-hidden /> {evt.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-[var(--qx-gold)]" aria-hidden />
                      {isFull ? (
                        <span className="text-[#FDBA74] font-semibold">Complet</span>
                      ) : (
                        <span><strong className="text-white">{spotsLeft}</strong> places restantes</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0 sm:items-end justify-start">
                  {live && evt.is_registered && evt.jitsi_room ? (
                    <a
                      href={`https://meet.jit.si/${evt.jitsi_room}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold uppercase tracking-[0.08em] text-white border border-[#F0ABFC]/60 bg-[linear-gradient(120deg,#7C3AED,#A855F7_45%,#E879F9)] shadow-[0_0_22px_-4px_rgba(232,121,249,0.75)] hover:-translate-y-0.5 transition"
                    >
                      <ExternalLink size={13} aria-hidden /> Rejoindre
                    </a>
                  ) : (
                    <Button
                      kind={evt.is_registered ? 'soft' : isFull ? 'outline' : 'primary'}
                      size="sm"
                      loading={registering === evt.id}
                      disabled={isFull && !evt.is_registered}
                      onClick={() => handleRegister(evt.id, evt.is_registered)}
                    >
                      {evt.is_registered ? "Se désinscrire" : isFull ? "Complet" : "S'inscrire"}
                    </Button>
                  )}
                  {evt.is_registered && !live && (
                    <p className="text-[11px] text-[var(--kz-mute)] sm:text-right flex items-center gap-1"><Calendar size={11} aria-hidden />Lien disponible le jour J</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
