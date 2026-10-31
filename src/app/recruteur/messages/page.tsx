'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Feather, Send, ScrollText } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useConversations, useMessages } from '@/features/messages/useMessages'
import { useAuth } from '@/features/auth/useAuth'
import { timeAgo } from '@/lib/utils'
import { KZ } from '@/lib/constants'
import { QuestHeader } from '@/components/quest/recruteur/QuestChrome'

export default function RecruiterMessagesPage() {
  const { profile } = useAuth()
  const { conversations, loading } = useConversations(profile?.id)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const { messages, sendMessage, bottomRef } = useMessages(activeConvId ?? undefined, profile?.id)
  const [input, setInput] = useState('')

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

  const other = activeConv ? otherUser(activeConv) : undefined

  return (
    <div className="max-w-[1100px] mx-auto h-[calc(100vh-160px)] min-h-[460px] flex flex-col">
      <QuestHeader
        eyebrow="Messages"
        icon={<Feather size={18} />}
        tone="var(--qx-magenta)"
        title={<>Les <span className="qx-text-arcane">missives</span></>}
        subtitle="Échangez avec les héros qui ont répondu à vos quêtes."
        className="mb-4"
      />
      <div className="qx-panel flex-1 min-h-0 flex overflow-hidden">
        {/* Registre des correspondances */}
        <aside aria-label="Conversations"
          className={`${activeConvId ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-col border-r border-[#C084FC]/20 bg-[rgba(12,5,24,0.35)] shrink-0 min-h-0`}>
          <div className="px-4 py-3 border-b border-[#C084FC]/15 flex items-center gap-2">
            <ScrollText size={14} className="text-[var(--qx-gold)]" aria-hidden />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--kz-mute)]">Correspondances</span>
            <span className="ml-auto text-[11px] font-bold text-[var(--qx-gold)] tabular-nums">{conversations.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 qxr-skeleton" />)}</div>
            ) : conversations.length === 0 ? <EmptyState title="Aucune conversation" icon={<Feather size={24} />} /> :
              <ul>
                {conversations.map((conv) => {
                  const o = otherUser(conv)
                  const active = conv.id === activeConvId
                  return (
                    <li key={conv.id}>
                      <button
                        onClick={() => setActiveConvId(conv.id)}
                        aria-current={active ? 'true' : undefined}
                        className={`relative w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[#C084FC]/10 transition-colors focus-visible:outline-none focus-visible:bg-[rgba(168,85,247,0.16)] ${active ? 'bg-[linear-gradient(90deg,rgba(168,85,247,0.22),rgba(232,121,249,0.06))]' : 'hover:bg-[rgba(168,85,247,0.1)]'}`}
                      >
                        {active && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[var(--qx-magenta)] shadow-[0_0_12px_var(--qx-magenta)]" />}
                        <Avatar name={o?.full_name ?? 'KZ'} src={o?.avatar_url} avatarConfig={o?.avatar_config} size={38} color={KZ.violetSoft} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate flex-1">{o?.full_name}</span>
                            {conv.last_message_at && <span className="text-[10px] text-[var(--kz-mute)] shrink-0">{timeAgo(conv.last_message_at)}</span>}
                          </div>
                          {conv.job && <div className="text-xs text-[var(--kz-mute)] truncate">{conv.job.title}</div>}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>}
          </div>
        </aside>

        {/* Fil de la missive */}
        <section aria-label="Conversation" className={`${activeConvId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col`}>
          {!activeConvId ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Selectionne une conversation" description="Choisissez une correspondance pour lire et répondre aux missives." icon={<Feather size={28} />} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-[#C084FC]/20 bg-[rgba(12,5,24,0.35)]">
                <button type="button" onClick={() => setActiveConvId(null)} className="qxr-icon-btn md:hidden" aria-label="Retour aux conversations">
                  <ArrowLeft size={16} />
                </button>
                {activeConv && (
                  <>
                    <Avatar name={other?.full_name ?? 'KZ'} src={other?.avatar_url} avatarConfig={other?.avatar_config} size={36} color={KZ.violetSoft} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{other?.full_name}</div>
                      {activeConv.job && <div className="text-[11px] text-[var(--kz-mute)] truncate">À propos de : {activeConv.job.title}</div>}
                    </div>
                  </>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col gap-3" aria-live="polite">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === profile?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'qxr-missive-me rounded-br-md' : 'qxr-missive-them rounded-bl-md'}`}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 flex items-center gap-1.5 ${isMe ? 'justify-end text-white/70' : 'text-[var(--kz-mute)]'}`}>
                          {isMe && <span aria-hidden className="qxr-seal w-1.5 h-1.5" />}
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 p-3 sm:p-4 border-t border-[#C084FC]/20 bg-[rgba(12,5,24,0.35)]">
                <label htmlFor="missive" className="sr-only">Écrire un message</label>
                <input id="missive" value={input} onChange={(e) => setInput(e.target.value)}
                  className="flex-1 min-w-0 h-11 px-4 bg-[rgba(12,5,24,0.7)] border border-[#C084FC]/30 rounded-xl text-sm text-[var(--kz-ink)] outline-none transition-all focus:border-[#E879F9] focus:shadow-[0_0_0_4px_rgba(232,121,249,0.18)]"
                  placeholder="Ecrire un message..." />
                <Button type="submit" kind="primary" size="md" icon={<Send size={16} />} aria-label="Envoyer">
                  <span className="hidden sm:inline">Envoyer</span>
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
