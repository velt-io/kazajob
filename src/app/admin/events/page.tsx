'use client'

import { useEffect, useState } from 'react'
import { Star, Trash2, ExternalLink, Users, Calendar, UserCheck, Monitor, BookOpen } from 'lucide-react'
import { EVENT_TYPES } from '@/lib/constants'
import { Tooltip } from '@/components/ui/radix'
import { ACCENT, EmptyPanel, IconButton, PageHeader, SkeletonList, tint } from '@/components/os/recruiter/primitives'

interface AdminEvent {
  id: string
  title: string
  type: string
  date: string
  location: string
  max_participants: number
  jitsi_room: string | null
  is_published: boolean
  organizer: { full_name: string; email: string } | null
  registrations_count: number
}

const TYPE_ACCENT: Record<string, string> = { job_dating: ACCENT.violet, webinar: ACCENT.blue, atelier: ACCENT.orange }
const TYPE_ICONS: Record<string, React.ReactNode> = {
  job_dating: <UserCheck size={12} />,
  webinar:    <Monitor   size={12} />,
  atelier:    <BookOpen  size={12} />,
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events')
      if (res.ok) setEvents((await res.json()) as AdminEvent[])
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [])

  const togglePublish = async (id: string, current: boolean) => {
    await fetch(`/api/admin/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !current }),
    })
    await fetchEvents()
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Supprimer définitivement cet événement ?')) return
    setDeletingId(id)
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' })
    await fetchEvents()
    setDeletingId(null)
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader eyebrow="Communauté" title="KazaEvents" subtitle="Tous les événements publiés par les recruteurs" />

      {loading ? (
        <SkeletonList rows={3} height={72} />
      ) : events.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel title="Aucun événement" icon={<Star size={26} />} accent={ACCENT.teal} />
        </div>
      ) : (
        <div className="osr-table-wrap">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 uppercase">Événement</th>
                <th className="text-left px-4 py-3 uppercase hidden md:table-cell">Organisateur</th>
                <th className="text-left px-4 py-3 uppercase hidden sm:table-cell">Date</th>
                <th className="text-center px-4 py-3 uppercase">Inscrits</th>
                <th className="text-center px-4 py-3 uppercase">Statut</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {events.map(evt => {
                const typeInfo = EVENT_TYPES[evt.type] ?? { label: evt.type }
                const isPast = new Date(evt.date) < new Date()
                const accent = TYPE_ACCENT[evt.type] ?? ACCENT.mute
                const fill = evt.max_participants > 0 ? Math.min(100, (evt.registrations_count / evt.max_participants) * 100) : 0
                return (
                  <tr key={evt.id}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] font-semibold shrink-0"
                          style={{ background: tint(accent, 16), color: `color-mix(in srgb, ${accent} 80%, white)` }}>
                          {TYPE_ICONS[evt.type]}{typeInfo.label}
                        </span>
                        <span className="font-semibold text-white truncate max-w-[200px]">{evt.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--kz-text)] hidden md:table-cell">
                      <div className="text-[13px]">{evt.organizer?.full_name ?? '—'}</div>
                      <div className="text-[11px] text-[var(--kz-mute)]">{evt.organizer?.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--kz-mute)] hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-[13px]">
                        <Calendar size={12} />
                        {new Date(evt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                      {isPast && <span className="text-[11px] text-[var(--kz-mute)]">Terminé</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-white">
                          <Users size={12} className="text-[var(--kz-mute)]" />{evt.registrations_count}/{evt.max_participants}
                        </span>
                        <span className="osr-bar w-14 !h-1"><span style={{ width: `${fill}%`, background: accent }} /></span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Tooltip content={evt.is_published ? 'Masquer' : 'Publier'}>
                        <button
                          onClick={() => togglePublish(evt.id, evt.is_published)}
                          aria-label={evt.is_published ? `Masquer ${evt.title}` : `Publier ${evt.title}`}
                          className="osr-pill transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]"
                          style={{ '--osr-accent': evt.is_published ? ACCENT.green : ACCENT.mute } as React.CSSProperties}
                        >
                          {evt.is_published ? 'Publié' : 'Masqué'}
                        </button>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-0.5 justify-end">
                        {evt.jitsi_room && (
                          <Tooltip content="Ouvrir la salle Jitsi">
                            <a href={`https://meet.jit.si/${evt.jitsi_room}`} target="_blank" rel="noreferrer" aria-label="Ouvrir la salle Jitsi" className="osr-icon-btn">
                              <ExternalLink size={14} />
                            </a>
                          </Tooltip>
                        )}
                        <IconButton label="Supprimer" tone="danger" onClick={() => deleteEvent(evt.id)} disabled={deletingId === evt.id}>
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
