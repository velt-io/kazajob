'use client'

import { useEffect, useState } from 'react'
import { Plus, Calendar, Users, Trash2, ExternalLink, Star, UserCheck, Monitor, BookOpen, Megaphone, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Tooltip } from '@/components/ui/radix'
import { useAuth } from '@/features/auth/useAuth'
import { EVENT_TYPES } from '@/lib/constants'
import { ACCENT, EmptyPanel, IconButton, PageHeader, SkeletonList, StatusPill, tint } from '@/components/os/recruiter/primitives'
import { choiceStyle, stagger } from '@/components/os/recruiter/secondary-ui'

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
  is_published: boolean
  registrations_count: number
}

const TYPE_ACCENT: Record<string, string> = {
  job_dating:      ACCENT.violet,
  webinar:         ACCENT.blue,
  atelier:         ACCENT.orange,
  info_collective: ACCENT.green,
}
const TYPE_ICONS: Record<string, React.ReactNode> = {
  job_dating:      <UserCheck size={14} />,
  webinar:         <Monitor   size={14} />,
  atelier:         <BookOpen  size={14} />,
  info_collective: <Megaphone size={14} />,
}

export default function RecruiterEventsPage() {
  const { profile } = useAuth()
  const [events, setEvents] = useState<KazaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Formulaire
  const [form, setForm] = useState({
    title: '', type: 'job_dating', date: '', duration_minutes: '60',
    max_participants: '30', location: 'En ligne', description: '',
  })

  const fetchEvents = async () => {
    if (!profile?.id) return
    try {
      const res = await fetch('/api/recruiter/events')
      if (res.ok) setEvents((await res.json()) as KazaEvent[])
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [profile?.id])

  const handleCreate = async () => {
    if (!profile?.id || !form.title || !form.date) return
    setSaving(true)
    const res = await fetch('/api/recruiter/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        date: new Date(form.date).toISOString(),
        jitsi_room: `kaza-event-${Date.now().toString(36)}`,
        is_published: true,
      }),
    })
    if (res.ok) {
      setModal(false)
      setForm({ title: '', type: 'job_dating', date: '', duration_minutes: '60', max_participants: '30', location: 'En ligne', description: '' })
      await fetchEvents()
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet événement ? Les inscriptions seront annulées.')) return
    setDeletingId(id)
    await fetch(`/api/recruiter/events/${id}`, { method: 'DELETE' })
    await fetchEvents()
    setDeletingId(null)
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <PageHeader
        eyebrow="Événements"
        title="KazaEvents"
        subtitle="Job datings, webinaires et ateliers pour rencontrer vos candidats."
        actions={
          <Button kind="primary" size="md" icon={<Plus size={15} />} onClick={() => setModal(true)}>
            Créer un événement
          </Button>
        }
      />

      {loading ? (
        <div className="osr-panel p-3"><SkeletonList rows={2} height={92} /></div>
      ) : events.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel
            icon={<Star size={28} />}
            accent={ACCENT.violet}
            title="Aucun événement créé"
            description="Organisez un job dating, un webinaire ou un atelier pour rencontrer vos candidats."
            action={<Button kind="primary" icon={<Plus size={15} />} onClick={() => setModal(true)}>Créer un événement</Button>}
          />
        </div>
      ) : (
        <div className="osr-panel p-2 osr-sep">
          {events.map((evt, i) => {
            const typeInfo = EVENT_TYPES[evt.type] ?? { label: evt.type }
            const accent = TYPE_ACCENT[evt.type] ?? ACCENT.mute
            const eventDate = new Date(evt.date)
            const isPast = eventDate < new Date()
            const fill = evt.max_participants > 0 ? Math.min(100, (evt.registrations_count / evt.max_participants) * 100) : 0

            return (
              <div key={evt.id} className="osr-row osr-in flex items-start gap-4 px-3 py-4" style={{ ...stagger(i), opacity: deletingId === evt.id ? 0.5 : undefined }}>
                {/* Date (pastille Calendrier) */}
                <div className="w-14 shrink-0 rounded-[14px] overflow-hidden border border-white/10 text-center" style={{ opacity: isPast ? 0.55 : 1 }}>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.06em] py-0.5 text-white" style={{ background: accent }}>
                    {eventDate.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                  </div>
                  <div className="text-[22px] font-semibold text-white leading-none py-2 tabular-nums bg-white/[0.05]">{eventDate.getDate()}</div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-semibold"
                      style={{ background: tint(accent, 16), color: `color-mix(in srgb, ${accent} 80%, white)` }}>
                      {TYPE_ICONS[evt.type] ?? <Calendar size={12} />}{typeInfo.label}
                    </span>
                    {isPast && <StatusPill accent={ACCENT.mute}>Terminé</StatusPill>}
                    {!evt.is_published && <StatusPill accent={ACCENT.orange}>Brouillon</StatusPill>}
                  </div>
                  <h3 className="text-[15px] font-semibold text-white truncate">{evt.title}</h3>
                  <div className="text-[12px] text-[var(--kz-mute)] mt-1 flex gap-x-3 gap-y-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      {' '}à {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {evt.registrations_count} / {evt.max_participants} inscrits
                    </span>
                  </div>
                  <div className="osr-bar !h-1 mt-2.5 max-w-[220px]" aria-hidden>
                    <span style={{ width: `${fill}%`, background: accent, ...stagger(i) }} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  {evt.jitsi_room && (
                    <Tooltip content="Rejoindre la salle">
                      <a href={`https://meet.jit.si/${evt.jitsi_room}`} target="_blank" rel="noreferrer" aria-label="Rejoindre la salle" className="osr-icon-btn">
                        <ExternalLink size={15} />
                      </a>
                    </Tooltip>
                  )}
                  <IconButton label="Supprimer" tone="danger" onClick={() => handleDelete(evt.id)} disabled={deletingId === evt.id}>
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal création */}
      <Modal open={modal} onClose={() => setModal(false)} title="Créer un événement">
        <div className="flex flex-col gap-4">
          <Input
            label="Titre de l'événement *"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Job Dating Tech · Réunion"
          />

          <div>
            <span className="block text-xs font-medium text-[var(--kz-mute)] mb-1.5" id="evt-type-label">Type *</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-labelledby="evt-type-label">
              {Object.entries(EVENT_TYPES).map(([key, val]) => {
                const selected = form.type === key
                const accent = TYPE_ACCENT[key] ?? ACCENT.blue
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setForm(f => ({ ...f, type: key }))}
                    className="p-2.5 rounded-[14px] border text-center text-[12px] font-semibold transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0A84FF]/40"
                    style={{ ...choiceStyle(selected, accent), color: selected ? 'white' : 'var(--kz-mute)' }}
                  >
                    <div className="flex justify-center mb-1" style={{ color: selected ? accent : undefined }}>{TYPE_ICONS[key]}</div>
                    {val.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date et heure *"
              type="datetime-local"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="evt-duration" className="text-xs font-medium text-[var(--kz-mute)]">Durée</label>
              <select
                id="evt-duration"
                className="h-11 w-full px-3.5 rounded-xl border border-white/10 bg-white/[0.06] text-sm text-[var(--kz-text)] outline-none focus:border-[#0A84FF] focus:ring-4 focus:ring-[#0A84FF]/25 [&>option]:bg-[#1C1C22]"
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
              >
                {[30, 45, 60, 90, 120].map(d => (
                  <option key={d} value={d}>{d < 60 ? `${d} min` : `${d / 60}h`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Lieu / Plateforme"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="En ligne (Jitsi)"
            />
            <Input
              label="Places max"
              type="number"
              value={form.max_participants}
              onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))}
              min="1"
              max="500"
            />
          </div>

          <Textarea
            label="Description (optionnel)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Présentez votre événement, les thèmes abordés, le profil recherché..."
            rows={3}
          />

          <div className="flex items-start gap-2.5 p-3 rounded-[14px] text-[13px] text-[var(--kz-text)]" style={{ background: tint(ACCENT.blue, 12) }}>
            <Info size={15} className="shrink-0 mt-0.5 text-[var(--kz-blue)]" />
            Un lien Jitsi Meet sera automatiquement généré et partagé avec les inscrits le jour J.
          </div>

          <div className="flex gap-2.5">
            <Button kind="soft" size="lg" full onClick={() => setModal(false)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={saving} onClick={handleCreate}
              disabled={!form.title || !form.date}>
              Créer l&apos;événement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
