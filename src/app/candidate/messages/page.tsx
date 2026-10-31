'use client'

import { useState, useEffect, Fragment } from 'react'
import { MessageCircle, ArrowUp, ChevronLeft, Search, X, Briefcase } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useConversations, useMessages } from '@/features/messages/useMessages'
import { useAuth } from '@/features/auth/useAuth'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

// ── Mise en forme des dates (façon Messages d'iOS) ─────────────
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
const hhmm = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

function listTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, now)) return hhmm(d)
  if (sameDay(d, yesterday)) return 'Hier'
  if (now.getTime() - d.getTime() < 6 * 86400000) return d.toLocaleDateString('fr-FR', { weekday: 'long' })
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function separatorLabel(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, now)) return `Aujourd’hui ${hhmm(d)}`
  if (sameDay(d, yesterday)) return `Hier ${hhmm(d)}`
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ${hhmm(d)}`
}

// Horodatage appelé uniquement depuis des gestionnaires d’événements.
const nowMs = () => Date.now()
const gapMin = (a: Message, b: Message) => Math.abs(new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) / 60000

export default function CandidateMessagesPage() {
  const { profile } = useAuth()
  const { conversations, loading } = useConversations(profile?.id)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const { messages, sendMessage, bottomRef } = useMessages(activeConvId ?? undefined, profile?.id)
  const [input, setInput] = useState('')
  const [showList, setShowList] = useState(true)
  // Présentation : recherche locale + horodatage d'ouverture (les messages plus récents « surgissent »).
  const [query, setQuery] = useState('')
  const [openedAt, setOpenedAt] = useState(0)

  // Deep-link : ?c=<conversationId> ouvre directement la conversation.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c')
    // Logique d'origine conservée (lecture de l'URL au montage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (c) { setActiveConvId(c); setShowList(false); setOpenedAt(nowMs()) }
  }, [])

  const activeConv = conversations.find((c) => c.id === activeConvId)
  const otherUser = (conv: typeof conversations[0]) =>
    conv.candidate_id === profile?.id ? conv.recruiter : conv.candidate

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendMessage(input)
    setInput('')
  }

  const openConv = (id: string) => {
    setActiveConvId(id)
    setShowList(false)  // sur mobile, masquer la liste
    setOpenedAt(nowMs())
  }

  const q = query.trim().toLowerCase()
  const listed = q
    ? conversations.filter((c) => (otherUser(c)?.full_name ?? '').toLowerCase().includes(q) || (c.job?.title ?? '').toLowerCase().includes(q))
    : conversations
  const other = activeConv ? otherUser(activeConv) : undefined
  const lastMine = [...messages].reverse().find((m) => m.sender_id === profile?.id)
  const ready = input.trim().length > 0

  return (
    <div className="max-w-[1100px] mx-auto flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-140px)]">
      <div className="os-glass flex-1 flex rounded-[28px] overflow-hidden min-h-0 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
        {/* ── Liste des conversations ── */}
        <aside className={cn('w-full md:w-[320px] md:border-r border-[var(--kz-line)] flex-col min-h-0 shrink-0', activeConvId && !showList ? 'hidden md:flex' : 'flex')}>
          <div className="px-4 pt-5 pb-3">
            <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-[var(--kz-ink)] leading-none">Messages</h1>
            <label className="mt-4 flex items-center gap-2 h-9 px-3 rounded-[11px] bg-[var(--osc-surface-hi)] focus-within:ring-2 focus-within:ring-[color-mix(in_srgb,var(--kz-blue)_50%,transparent)]">
              <Search size={15} className="text-[var(--kz-mute)] shrink-0" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" aria-label="Rechercher une conversation"
                className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[var(--kz-ink)] placeholder:text-[var(--kz-mute)]" />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className="w-4 h-4 rounded-full bg-[var(--kz-mute)] text-[var(--kz-inverse)] flex items-center justify-center">
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </label>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {loading ? (
              <div className="flex flex-col gap-1 px-2">
                {[0, 1, 2, 3].map((i) => <div key={i} className="osc-skeleton h-[68px] rounded-2xl" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center text-center px-6 py-16">
                <span className="w-14 h-14 rounded-[18px] flex items-center justify-center text-white mb-4" style={{ background: 'var(--os-aurora)' }}><MessageCircle size={24} /></span>
                <p className="text-[16px] font-semibold text-[var(--kz-ink)]">Aucune conversation</p>
                <p className="text-[13px] text-[var(--kz-mute)] mt-1 leading-relaxed">Quand un recruteur t’écrira, la discussion apparaîtra ici.</p>
              </div>
            ) : listed.length === 0 ? (
              <p className="px-4 py-10 text-center text-[14px] text-[var(--kz-mute)]">Aucun résultat pour « {query} »</p>
            ) : (
              <ul className="flex flex-col">
                {listed.map((conv) => {
                  const o = otherUser(conv)
                  const selected = conv.id === activeConvId
                  const unread = conv.last_message && !conv.last_message.is_read && conv.last_message.sender_id !== profile?.id
                  return (
                    <li key={conv.id}>
                      <button onClick={() => openConv(conv.id)} aria-current={selected ? 'true' : undefined}
                        className={cn('osc-press w-full flex items-center gap-3 px-3 py-3 rounded-[16px] text-left transition-colors',
                          selected ? 'bg-[var(--kz-blue)]' : 'hover:bg-[var(--osc-surface)]')}>
                        <span className="relative shrink-0">
                          {unread && !selected && <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--kz-blue)]" aria-label="Non lu" />}
                          <Avatar name={o?.full_name ?? 'KZ'} src={o?.avatar_url} avatarConfig={o?.avatar_config} size={46} color="color-mix(in srgb, var(--kz-ink) 12%, transparent)" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className={cn('text-[15px] font-semibold truncate', selected ? 'text-white' : 'text-[var(--kz-ink)]')}>{o?.full_name}</span>
                            <span className={cn('text-[12px] shrink-0 capitalize', selected ? 'text-white/80' : 'text-[var(--kz-mute)]')}>{listTime(conv.last_message?.created_at ?? conv.last_message_at)}</span>
                          </span>
                          {conv.job && (
                            <span className={cn('flex items-center gap-1 text-[12px] truncate', selected ? 'text-white/85' : 'text-[var(--kz-text)]')}>
                              <Briefcase size={11} className="shrink-0" /><span className="truncate">{conv.job.title}</span>
                            </span>
                          )}
                          {conv.last_message?.content && (
                            <span className={cn('block text-[13px] truncate mt-0.5', selected ? 'text-white/75' : unread ? 'text-[var(--kz-ink)]' : 'text-[var(--kz-mute)]')}>{conv.last_message.content}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Fil de discussion ── */}
        <div className={cn('flex-1 flex-col min-w-0 min-h-0', !activeConvId || showList ? 'hidden md:flex' : 'flex')}>
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <span className="w-16 h-16 rounded-[20px] flex items-center justify-center bg-[var(--kz-line)] text-[var(--kz-mute)] mb-4"><MessageCircle size={28} /></span>
              <p className="text-[18px] font-semibold text-[var(--kz-ink)]">Sélectionne une conversation</p>
              <p className="text-[13px] text-[var(--kz-mute)] mt-1">Tes échanges avec les recruteurs s’affichent ici.</p>
            </div>
          ) : (
            <>
              {/* En-tête façon iMessage : avatar centré */}
              <div className="relative flex flex-col items-center justify-center gap-1 px-14 pt-3 pb-2.5 border-b border-[var(--kz-line)] bg-[color-mix(in_srgb,var(--kz-cream)_35%,transparent)] shrink-0">
                <button onClick={() => setShowList(true)} aria-label="Retour aux conversations"
                  className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 h-10 pl-1 pr-2 rounded-full inline-flex items-center text-[var(--kz-blue)] text-[15px]">
                  <ChevronLeft size={24} />
                </button>
                {activeConv && (
                  <>
                    <Avatar name={other?.full_name ?? 'KZ'} src={other?.avatar_url} avatarConfig={other?.avatar_config} size={40} color="color-mix(in srgb, var(--kz-ink) 12%, transparent)" />
                    <div className="text-[12px] font-medium text-[var(--kz-ink)] max-w-full truncate">{other?.full_name}</div>
                    {activeConv.job && <div className="text-[11px] text-[var(--kz-mute)] max-w-full truncate -mt-1">{activeConv.job.title}</div>}
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 flex flex-col" aria-live="polite">
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === profile?.id
                  const prev = messages[i - 1]
                  const next = messages[i + 1]
                  const showSep = !prev || gapMin(prev, msg) > 60
                  const first = showSep || prev.sender_id !== msg.sender_id || gapMin(prev, msg) > 5
                  const last = !next || next.sender_id !== msg.sender_id || gapMin(msg, next) > 5
                  const fresh = openedAt > 0 && new Date(msg.created_at).getTime() > openedAt
                  return (
                    <Fragment key={msg.id}>
                      {showSep && (
                        <div className="text-center text-[11px] font-medium text-[var(--kz-mute)] my-3 first:mt-0">{separatorLabel(msg.created_at)}</div>
                      )}
                      <div className={cn('flex', isMe ? 'justify-end' : 'justify-start', first ? 'mt-2' : 'mt-[3px]')}>
                        <div
                          data-tail={last ? (isMe ? 'me' : 'them') : undefined}
                          title={hhmm(new Date(msg.created_at))}
                          className={cn(
                            'osc-bubble max-w-[78%] sm:max-w-[65%] px-3.5 py-2 text-[15px] leading-[1.35] rounded-[20px]',
                            isMe ? 'text-white bg-[var(--kz-blue)]' : 'text-[var(--kz-ink)] bg-[color-mix(in_srgb,var(--kz-ink)_13%,var(--kz-cream))]',
                            fresh && (isMe ? 'osc-bubble-in-me' : 'osc-bubble-in-them'),
                          )}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                      {isMe && lastMine?.id === msg.id && !next && (
                        <div className="text-right text-[11px] font-medium text-[var(--kz-mute)] mt-1 pr-1 osc-fade">
                          {msg.is_read ? 'Lu' : 'Distribué'}
                        </div>
                      )}
                    </Fragment>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Saisie : la flèche d'envoi « s'allume » quand il y a du texte */}
              <form onSubmit={handleSend} className="flex items-end gap-2 px-3 sm:px-4 py-3 border-t border-[var(--kz-line)] shrink-0">
                <div className="flex-1 flex items-center min-h-[38px] pl-4 pr-1 rounded-[20px] border border-[var(--kz-edge)] bg-[var(--osc-surface)] focus-within:border-[color-mix(in_srgb,var(--kz-blue)_60%,transparent)] transition-colors">
                  <input value={input} onChange={(e) => setInput(e.target.value)}
                    aria-label="Écrire un message"
                    className="flex-1 min-w-0 h-9 bg-transparent text-[15px] text-[var(--kz-ink)] outline-none placeholder:text-[var(--kz-mute)]"
                    placeholder="Message" />
                  <button type="submit" aria-label="Envoyer" data-ready={ready} disabled={!ready}
                    className="osc-send w-[30px] h-[30px] my-1 rounded-full flex items-center justify-center bg-[var(--kz-blue)] text-white shrink-0 disabled:cursor-default">
                    <ArrowUp size={17} strokeWidth={2.75} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
