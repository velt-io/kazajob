'use client'

import { useState } from 'react'
import { Calendar, Video, Phone, MapPin, Plus, Send, ExternalLink, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useInterviews, type Interview } from '@/features/interviews/useInterviews'
import { KZ } from '@/lib/constants'
import { QuestHeader } from '@/components/quest/recruteur/QuestChrome'

const TYPE_OPTIONS = [
  { value: 'video',  label: 'Visioconférence' },
  { value: 'phone',  label: 'Entretien téléphonique' },
  { value: 'onsite', label: 'Présentiel' },
]
const VISIO_OPTIONS = [
  { value: 'jitsi',    label: 'Jitsi Meet (lien généré automatiquement)' },
  { value: 'external', label: 'Mon propre lien (Zoom, Meet, Teams...)' },
]
const DURATION_OPTIONS = [
  { value: '30',  label: '30 minutes' },
  { value: '45',  label: '45 minutes' },
  { value: '60',  label: '1 heure' },
  { value: '90',  label: '1h30' },
]

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'cream' | 'violet'> = {
  pending:   'yellow',
  confirmed: 'green',
  cancelled: 'cream',
  done:      'violet',
}

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

  return (
    <div className="max-w-[900px] mx-auto">
      <QuestHeader
        eyebrow="Agenda entretiens"
        icon={<Calendar size={18} />}
        tone="var(--qx-cyan)"
        title={<>Les <span className="qx-text-arcane">épreuves</span> à venir</>}
        subtitle={`${upcoming.length} entretien(s) à venir`}
        actions={<Badge color="violet" size="md">Planifiez depuis une candidature</Badge>}
      />

      {upcoming.length === 0 ? (
        <div className="qx-panel">
          <EmptyState
            title="Aucun entretien planifié"
            description="Planifiez des entretiens depuis la page Candidatures en changeant le statut d'une candidature."
            icon={<Calendar size={28} />}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(byDate)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, ivs]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.45))]" />
                  <span className="text-[13px] font-bold text-[var(--qx-gold)] px-2 capitalize font-[family-name:var(--font-epic)] tracking-wide">{date}</span>
                  <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(250,204,21,0.45),transparent)]" />
                </div>

                {ivs.filter(iv => iv.status !== 'cancelled').map((iv) => {
                  const d = new Date(iv.scheduled_at)
                  const isToday = d.toDateString() === new Date().toDateString()
                  const isPast = d < new Date()
                  const candidate = iv.candidate

                  return (
                    <div key={iv.id} className="qx-panel p-4 sm:p-5 mb-3 qx-rise"
                      style={isToday ? { borderColor: 'var(--qx-gold)', boxShadow: '0 0 0 1px rgba(250,204,21,0.25), 0 0 36px -10px var(--qx-gold)' } : undefined}>

                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Heure */}
                        <div className="w-16 h-16 rounded-xl border flex flex-col items-center justify-center shrink-0 font-extrabold bg-[rgba(12,5,24,0.6)]"
                          style={{ borderColor: isToday ? 'var(--qx-gold)' : 'color-mix(in srgb, var(--qx-cyan) 50%, transparent)', boxShadow: `0 0 20px -8px ${isToday ? 'var(--qx-gold)' : 'var(--qx-cyan)'}` }}>
                          <div className="text-lg leading-none text-white tabular-nums">{d.getHours().toString().padStart(2,'0')}:{d.getMinutes().toString().padStart(2,'0')}</div>
                          <div className="text-[10px] mt-1" style={{ color: isToday ? 'var(--qx-gold)' : 'var(--qx-cyan)' }}>{iv.duration_min}min</div>
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-base font-bold text-white">{iv.job?.title ?? 'Entretien'}</span>
                            <Badge color={STATUS_COLOR[iv.status] ?? 'cream'} size="sm">
                              {iv.status === 'pending' ? 'En attente' : iv.status === 'confirmed' ? 'Confirmé' : iv.status === 'done' ? 'Terminé' : 'Annulé'}
                            </Badge>
                            {isToday && <Badge color="orange" size="sm">Aujourd&apos;hui</Badge>}
                          </div>

                          {/* Candidat */}
                          {candidate && (
                            <div className="flex items-center gap-x-2 gap-y-0.5 mb-2 flex-wrap">
                              <Avatar name={candidate.full_name} src={candidate.avatar_url} avatarConfig={candidate.avatar_config} size={24} color={KZ.orangeSoft} />
                              <span className="text-sm font-semibold text-[var(--kz-ink)]">{candidate.full_name}</span>
                              <span className="text-xs text-[var(--kz-mute)] break-all">{candidate.email}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-xs text-[var(--kz-mute)]">
                            {iv.type === 'video' && <Video size={13} />}
                            {iv.type === 'phone' && <Phone size={13} />}
                            {iv.type === 'onsite' && <MapPin size={13} />}
                            {iv.type === 'video' ? 'Visioconférence' : iv.type === 'phone' ? 'Téléphone' : 'Présentiel'}
                            {iv.location && <span>· {iv.location}</span>}
                          </div>

                          {iv.visio_link && (
                            <div className="mt-1 text-xs text-[var(--kz-mute)] flex items-center gap-1.5">
                              <ExternalLink size={11} />
                              <a href={iv.visio_link} target="_blank" rel="noreferrer" className="hover:underline break-all text-[var(--qx-magenta)]">
                                {iv.visio_link}
                              </a>
                            </div>
                          )}

                          {iv.notes && (
                            <div className="mt-2 text-xs text-[var(--kz-mute)] p-2.5 rounded-lg border border-[var(--kz-line)]" style={{ background: KZ.cream2 }}>
                              {iv.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions recruteur */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--kz-line)]">
                        {iv.visio_link && iv.type === 'video' && !isPast && (
                          <a href={iv.visio_link} target="_blank" rel="noreferrer">
                            <Button kind="violet" size="sm" icon={<Video size={14} />}>Rejoindre</Button>
                          </a>
                        )}
                        {!isPast && (
                          <Button
                            kind="soft"
                            size="sm"
                            icon={<Send size={13} />}
                            loading={sendingReminder === iv.id}
                            onClick={() => sendReminder(iv)}
                          >
                            Envoyer rappel
                          </Button>
                        )}
                        {iv.status === 'pending' && (
                          <Button kind="outline" size="sm" onClick={() => update(iv.id, { status: 'confirmed' })}>
                            Confirmer
                          </Button>
                        )}
                        {!isPast && iv.status !== 'cancelled' && (
                          <Button kind="danger" size="sm" onClick={() => update(iv.id, { status: 'cancelled' })}>
                            Annuler
                          </Button>
                        )}
                        {!isPast && iv.status !== 'done' && isPast && (
                          <Button kind="soft" size="sm" onClick={() => update(iv.id, { status: 'done' })}>
                            Marquer terminé
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
