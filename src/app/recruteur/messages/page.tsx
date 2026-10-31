'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, ArrowUp, ChevronLeft, Briefcase, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/radix'
import { useConversations, useMessages } from '@/features/messages/useMessages'
import { useAuth } from '@/features/auth/useAuth'
import { timeAgo } from '@/lib/utils'
import { ACCENT, EmptyPanel, SearchField, SkeletonList, WindowBar, tint } from '@/components/os/recruiter/primitives'

/** Libellé de jour pour les séparateurs du fil. */
function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Aujourd’hui'
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export default function RecruiterMessagesPage() {
  const { profile } = useAuth()
  const { conversations, loading } = useConversations(profile?.id)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const { messages, sendMessage, bottomRef } = useMessages(activeConvId ?? undefined, profile?.id)
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')

  // Deep-link : ?c=<conversationId> ouvre directement la conversation.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c')
    if (c) setActiveConvId(c)
  }, [])

  const activeConv = conversations.find((c) => c.id === activeConvId)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendMessage(input)
    setInput('')
  }

  const otherUser = (conv: typeof conversations[0]) =>
    conv.recruiter_id === profile?.id ? conv.candidate : conv.recruiter

  const q = query.trim().toLowerCase()
  const shown = q
    ? conversations.filter((c) => `${otherUser(c)?.full_name ?? ''} ${c.job?.title ?? ''}`.toLowerCase().includes(q))
    : conversations
  const other = activeConv ? otherUser(activeConv) : undefined

  return (
    <div className="max-w-[1180px] mx-auto h-[calc(100dvh-150px)] min-h-[480px] flex flex-col">
      <div className="flex items-end justify-between gap-3 mb-5">
        <div>
          <p className="osr-eyebrow mb-2">Messagerie</p>
          <h1 className="osr-title">Messages</h1>
        </div>
        {conversations.length > 0 && <span className="text-[13px] text-[var(--kz-mute)] tabular-nums pb-1">{conversations.length} conversation(s)</span>}
      </div>

      <div className="flex-1 min-h-0 flex flex-col rounded-[24px] os-glass overflow-hidden shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
        <WindowBar title={other?.full_name ? `${other.full_name}${activeConv?.job ? ` — ${activeConv.job.title}` : ''}` : 'Messages'} className="hidden md:flex" />

        <div className="flex-1 min-h-0 flex">
          {/* Liste des conversations */}
          <div className={`${activeConvId ? 'hidden md:flex' : 'flex'} w-full md:w-[300px] lg:w-[320px] shrink-0 flex-col border-r border-white/[0.06] bg-black/[0.12]`}>
            <div className="p-3">
              <SearchField value={query} onChange={setQuery} placeholder="Rechercher" hotkey={false} />
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {loading ? <SkeletonList rows={5} height={60} className="px-1" /> :
                conversations.length === 0 ? (
                  <EmptyPanel icon={<MessageCircle size={26} />} accent={ACCENT.blue} title="Aucune conversation"
                    description="Contactez un candidat depuis vos candidatures pour démarrer un échange." className="!py-10" />
                ) : shown.length === 0 ? (
                  <p className="text-[13px] text-[var(--kz-mute)] text-center py-8">Aucun résultat.</p>
                ) : shown.map((conv) => {
                  const o = otherUser(conv)
                  const selected = conv.id === activeConvId
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      data-selected={selected}
                      aria-current={selected ? 'true' : undefined}
                      className="osr-row w-full flex items-center gap-3 px-2.5 py-2.5 text-left"
                    >
                      <Avatar name={o?.full_name ?? 'KZ'} src={o?.avatar_url} avatarConfig={o?.avatar_config} size={42} color={tint(ACCENT.blue, 30)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[14px] font-semibold truncate">{o?.full_name}</span>
                          <span className="osr-sub text-[11px] text-[var(--kz-mute)] shrink-0">{timeAgo(conv.last_message_at)}</span>
                        </div>
                        <div className="osr-sub text-[12px] text-[var(--kz-mute)] truncate">
                          {conv.last_message?.content ?? conv.job?.title ?? 'Nouvelle conversation'}
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>

          {/* Fil */}
          <div className={`${activeConvId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col`}>
            {!activeConvId ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyPanel icon={<MessageCircle size={28} />} accent={ACCENT.blue} title="Sélectionnez une conversation" description="Vos échanges avec les candidats apparaissent ici." />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-3 md:px-5 py-3 border-b border-white/[0.06]">
                  <button onClick={() => setActiveConvId(null)} className="md:hidden inline-flex items-center text-[15px] font-medium text-[var(--kz-blue)] -ml-1" aria-label="Retour aux conversations">
                    <ChevronLeft size={22} />
                  </button>
                  {activeConv && (
                    <>
                      <Avatar name={other?.full_name ?? 'KZ'} src={other?.avatar_url} avatarConfig={other?.avatar_config} size={38} color={tint(ACCENT.blue, 30)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-white truncate">{other?.full_name}</div>
                        {activeConv.job && <div className="text-[12px] text-[var(--kz-mute)] truncate flex items-center gap-1"><Briefcase size={11} />{activeConv.job.title}</div>}
                      </div>
                      {activeConv.candidate_id && activeConv.recruiter_id === profile?.id && (
                        <Tooltip content="Voir le profil">
                          <Link href={`/recruteur/candidats/${activeConv.candidate_id}`} aria-label="Voir le profil" className="osr-icon-btn"><UserRound size={16} /></Link>
                        </Tooltip>
                      )}
                    </>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 flex flex-col gap-1">
                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === profile?.id
                    const prev = messages[i - 1]
                    const next = messages[i + 1]
                    const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(msg.created_at).toDateString()
                    const lastOfGroup = !next || next.sender_id !== msg.sender_id || new Date(next.created_at).getTime() - new Date(msg.created_at).getTime() > 5 * 60_000
                    return (
                      <div key={msg.id}>
                        {newDay && (
                          <div className="text-center text-[11px] font-medium text-[var(--kz-mute)] my-3 first-letter:uppercase">
                            {dayLabel(msg.created_at)}
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${lastOfGroup ? 'mb-2' : ''}`}>
                          <div className="osr-bubble" data-me={isMe}
                            style={lastOfGroup ? undefined : (isMe ? { borderBottomRightRadius: 20 } : { borderBottomLeftRadius: 20 })}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                        {lastOfGroup && (
                          <p className={`text-[10px] text-[var(--kz-mute)] -mt-1 mb-2 px-2 ${isMe ? 'text-right' : 'text-left'}`} title={timeAgo(msg.created_at)}>
                            {hhmm(msg.created_at)}{isMe && msg.is_read ? ' · Lu' : ''}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="flex items-end gap-2 px-3 md:px-5 py-3 border-t border-white/[0.06]">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    aria-label="Votre message"
                    className="flex-1 min-w-0 h-10 px-4 rounded-full bg-white/[0.06] border border-white/10 text-[15px] text-white placeholder:text-[var(--kz-mute)] outline-none transition focus:border-[color-mix(in_srgb,var(--kz-blue)_70%,transparent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--kz-blue)_22%,transparent)]"
                    placeholder="Écrire un message…"
                  />
                  <button type="submit" aria-label="Envoyer" disabled={!input.trim()}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 transition-all duration-300 active:scale-90 disabled:opacity-35 disabled:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--kz-blue)_40%,transparent)]"
                    style={{ background: 'var(--kz-blue)', boxShadow: input.trim() ? `0 8px 22px -8px ${ACCENT.blue}` : 'none' }}>
                    <ArrowUp size={19} strokeWidth={2.6} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
