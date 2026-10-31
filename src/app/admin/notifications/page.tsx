'use client'

import { useEffect, useState } from 'react'
import { Bell, Send, Users, User, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ACCENT, PageHeader, StatusPill, Widget, tint } from '@/components/os/recruiter/primitives'

type Target = 'all' | 'candidate' | 'recruiter'

interface SentNotif {
  id: string
  title: string
  message: string
  target: Target
  sent_at: string
  recipients: number
}

const TARGET_OPTIONS: { value: Target; label: string; desc: string; accent: string }[] = [
  { value: 'all',       label: 'Tous les utilisateurs', desc: 'Candidats + Recruteurs',    accent: ACCENT.violet },
  { value: 'candidate', label: 'Candidats uniquement',  desc: 'Recherche d\'emploi',        accent: ACCENT.orange },
  { value: 'recruiter', label: 'Recruteurs uniquement', desc: 'Entreprises & recruteurs',   accent: ACCENT.green  },
]
const TARGET_ACCENT: Record<Target, string> = { all: ACCENT.violet, candidate: ACCENT.orange, recruiter: ACCENT.green }

export default function AdminNotificationsPage() {
  const [title, setTitle]       = useState('')
  const [message, setMessage]   = useState('')
  const [link, setLink]         = useState('')
  const [target, setTarget]     = useState<Target>('all')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [history, setHistory]   = useState<SentNotif[]>([])
  const [recipientCount, setRecipientCount] = useState(0)

  // Compter les destinataires
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/users/count?role=${target}`)
        if (res.ok) setRecipientCount((await res.json()).count ?? 0)
      } catch { /* noop */ }
    }
    load()
  }, [target])

  // Historique (stocké en local state pour la session)
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return
    setSending(true)
    setSent(false)

    let recipients = 0
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, link, target }),
      })
      if (res.ok) recipients = (await res.json()).recipients ?? 0
    } catch { /* noop */ }

    // Historique local
    const newEntry: SentNotif = {
      id: crypto.randomUUID(),
      title: title.trim(),
      message: message.trim(),
      target,
      sent_at: new Date().toISOString(),
      recipients,
    }
    setHistory(h => [newEntry, ...h])
    setTitle(''); setMessage(''); setLink('')
    setSent(true)
    setSending(false)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <PageHeader eyebrow="Communication" title="Notifications" subtitle="Envoyer une notification push à vos utilisateurs" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Formulaire */}
        <Widget title="Nouvelle notification" icon={<Bell size={14} />} accent={ACCENT.violet} bodyClassName="px-5 pb-5 flex flex-col gap-4">
          {/* Cible */}
          <div>
            <span id="notif-target" className="block text-xs font-medium text-[var(--kz-mute)] mb-2">Destinataires</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-labelledby="notif-target">
              {TARGET_OPTIONS.map(opt => {
                const on = target === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setTarget(opt.value)}
                    className="p-3 rounded-[14px] border text-left transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]"
                    style={{
                      borderColor: on ? `color-mix(in srgb, ${opt.accent} 60%, transparent)` : 'var(--osr-hair)',
                      background: on ? tint(opt.accent, 14) : 'var(--osr-fill)',
                      boxShadow: on ? `0 0 30px -14px ${opt.accent}` : 'none',
                    }}
                  >
                    <div className="text-[13px] font-semibold text-white">{opt.label}</div>
                    <div className="text-[11px] text-[var(--kz-mute)]">{opt.desc}</div>
                  </button>
                )
              })}
            </div>
            <p className="text-[12px] text-[var(--kz-mute)] mt-2 flex items-center gap-1.5" aria-live="polite">
              <Users size={12} />
              <strong className="text-white tabular-nums">{recipientCount}</strong> destinataire{recipientCount > 1 ? 's' : ''}
            </p>
          </div>

          <Input
            label="Titre *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nouveau : KazaEvents disponible !"
            maxLength={80}
          />

          <Textarea
            label="Message *"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Découvrez les prochains job datings en ligne sur Kazajob…"
            rows={3}
            maxLength={300}
          />

          <Input
            label="Lien (optionnel)"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="/candidat/evenements"
          />

          {sent && (
            <div role="status" className="os-pop flex items-center gap-2 p-3 rounded-[14px]" style={{ background: tint(ACCENT.green, 14) }}>
              <CheckCircle size={16} className="text-[var(--kz-green)]" />
              <span className="text-sm font-semibold text-white">Notification envoyée</span>
            </div>
          )}

          <Button
            kind="primary"
            size="lg"
            full
            icon={<Send size={15} />}
            loading={sending}
            disabled={!title.trim() || !message.trim()}
            onClick={handleSend}
          >
            Envoyer à {recipientCount} utilisateur{recipientCount > 1 ? 's' : ''}
          </Button>
        </Widget>

        {/* Historique de session */}
        <Widget title="Historique" sub="Cette session">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={24} className="mx-auto mb-2 text-[var(--kz-mute)] opacity-40" />
              <p className="text-[13px] text-[var(--kz-mute)]">Aucune notification envoyée</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map(h => (
                <div key={h.id} className="os-pop osr-surface p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-white truncate">{h.title}</span>
                    <StatusPill accent={TARGET_ACCENT[h.target]}>
                      {h.target === 'all' ? 'Tous' : h.target === 'candidate' ? 'Candidats' : 'Recruteurs'}
                    </StatusPill>
                  </div>
                  <p className="text-[11px] text-[var(--kz-mute)] line-clamp-2">{h.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--kz-mute)]">
                    <span className="flex items-center gap-1"><User size={10} />{h.recipients} destinataires</span>
                    <span>{new Date(h.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Widget>
      </div>
    </div>
  )
}
