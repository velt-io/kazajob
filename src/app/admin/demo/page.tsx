'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { CalendarPlus, Trash2, Clock, Mail, Phone, Building2, Plus, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { ACCENT, EmptyPanel, PageHeader, StatusPill, Widget, tint } from '@/components/os/recruiter/primitives'
import { OSR_SELECT, SectionTitle } from '@/components/os/recruiter/admin-ui'

interface Slot { id: string; starts_at: string; duration_min: number; is_booked: boolean }
interface Booking { id: string; name: string; company: string | null; email: string; phone: string | null; message: string | null; status: string; created_at: string; when: string | null }

const ST: Record<string, { label: string; accent: string }> = {
  confirmed: { label: 'Confirmé', accent: ACCENT.green },
  cancelled: { label: 'Annulé', accent: ACCENT.red },
  done:      { label: 'Terminé', accent: ACCENT.violet },
}

export default function AdminDemoPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [newSlot, setNewSlot] = useState('')
  const [dur, setDur] = useState('30')

  const load = async () => {
    try {
      const [s, b] = await Promise.all([fetch('/api/admin/demo/slots'), fetch('/api/admin/demo/bookings')])
      if (s.ok) setSlots(await s.json())
      if (b.ok) setBookings(await b.json())
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const addSlot = async () => {
    if (!newSlot) return
    await fetch('/api/admin/demo/slots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starts: [new Date(newSlot).toISOString()], durationMin: parseInt(dur) }),
    })
    setNewSlot('')
    load()
  }

  const delSlot = async (id: string) => {
    await fetch(`/api/admin/demo/slots/${id}`, { method: 'DELETE' })
    load()
  }

  const setStatus = async (id: string, status: string) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b))
    await fetch(`/api/admin/demo/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    load()
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="max-w-[1000px] mx-auto">
      <PageHeader
        eyebrow="Commercial"
        title="Démos & rendez-vous"
        subtitle={<>Lien public à mettre dans vos mailings : <code className="osr-chip font-mono">/demo</code></>}
      />

      {/* Créneaux */}
      <Widget title="Ouvrir un créneau" icon={<CalendarPlus size={14} />} accent={ACCENT.blue} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:items-start">
          <div className="flex-1"><Input type="datetime-local" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} aria-label="Date et heure du créneau" /></div>
          <div className="sm:w-36"><Select options={[{ value: '15', label: '15 min' }, { value: '30', label: '30 min' }, { value: '45', label: '45 min' }, { value: '60', label: '1 heure' }]} value={dur} onChange={(e) => setDur(e.target.value)} aria-label="Durée" /></div>
          <Button kind="primary" size="lg" icon={<Plus size={15} />} onClick={addSlot} className="!h-11">Ajouter</Button>
        </div>
        {slots.length === 0 ? (
          <p className="text-[13px] text-[var(--kz-mute)]">Aucun créneau ouvert. Ajoutez-en pour permettre la réservation en ligne.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => {
              const accent = s.is_booked ? ACCENT.orange : ACCENT.green
              return (
                <div key={s.id} className="flex items-center gap-2 h-8 pl-3 pr-1.5 rounded-full text-[12px] font-semibold"
                  style={{ background: tint(accent, 14), color: `color-mix(in srgb, ${accent} 80%, white)` }}>
                  <Clock size={12} />{fmt(s.starts_at)} · {s.duration_min} min
                  {s.is_booked ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--osr-fill-2)] text-white mr-0.5">Réservé</span>
                  ) : (
                    <button onClick={() => delSlot(s.id)} aria-label="Supprimer le créneau"
                      className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--kz-mute)] hover:text-[var(--osr-red)] hover:bg-[var(--osr-fill-2)] transition-colors">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Widget>

      {/* RDV */}
      <SectionTitle icon={<CalendarClock size={16} />} aside={<span className="text-[13px] text-[var(--kz-mute)] tabular-nums">{bookings.length}</span>}>
        Demandes de RDV
      </SectionTitle>
      {loading ? <PageLoader /> : bookings.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel title="Aucune demande" description="Les demandes de démo arriveront ici, depuis la page publique /demo." icon={<CalendarPlus size={26} />} accent={ACCENT.blue} />
        </div>
      ) : (
        <div className="osr-panel p-2 osr-sep">
          {bookings.map((b, i) => (
            <div key={b.id} className="osr-row osr-in px-3 py-3" style={{ '--i': i } as CSSProperties}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[15px] font-semibold text-white">{b.name}</span>
                    {b.company && <span className="text-[12px] text-[var(--kz-mute)] flex items-center gap-1"><Building2 size={11} />{b.company}</span>}
                    <StatusPill accent={ST[b.status]?.accent ?? ACCENT.mute}>{ST[b.status]?.label ?? b.status}</StatusPill>
                  </div>
                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[12px] text-[var(--kz-mute)]">
                    <a href={`mailto:${b.email}`} className="flex items-center gap-1 hover:text-white transition-colors min-w-0 break-all"><Mail size={11} />{b.email}</a>
                    {b.phone && <a href={`tel:${b.phone}`} className="flex items-center gap-1 hover:text-white transition-colors"><Phone size={11} />{b.phone}</a>}
                    <span className="flex items-center gap-1 font-semibold text-[var(--kz-blue)]"><Clock size={11} />{b.when ? fmt(b.when) : 'À convenir'}</span>
                  </div>
                  {b.message && <p className="text-[13px] text-[var(--kz-text)] mt-2 pl-3 border-l-2 border-[var(--osr-hair)]">{b.message}</p>}
                </div>
                <select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)} aria-label={`Statut du rendez-vous de ${b.name}`}
                  className={`${OSR_SELECT} shrink-0`}>
                  <option value="confirmed">Confirmé</option>
                  <option value="cancelled">Annulé</option>
                  <option value="done">Terminé</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
