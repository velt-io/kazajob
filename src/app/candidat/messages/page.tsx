'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, ArrowLeft, Feather, Mail, ScrollText } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useConversations, useMessages } from '@/features/messages/useMessages'
import { useAuth } from '@/features/auth/useAuth'
import { timeAgo } from '@/lib/utils'

export default function CandidateMessagesPage() {
  const { profile } = useAuth()
  const { conversations, loading } = useConversations(profile?.id)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const { messages, sendMessage, bottomRef } = useMessages(activeConvId ?? undefined, profile?.id)
  const [input, setInput] = useState('')
  const [showList, setShowList] = useState(true)

  // Deep-link : ?c=<conversationId> ouvre directement la conversation.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('c')
    if (c) { setActiveConvId(c); setShowList(false) }
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
  }

  return (
    <div className="max-w-[1080px] mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <header className="flex items-end justify-between gap-3 mb-4 shrink-0 qx-rise">
        <div className="min-w-0">
          <p className="kz-eyebrow text-[var(--qx-neon)] mb-1.5 flex items-center gap-2"><Mail size={12} className="text-[var(--qx-gold)]" aria-hidden />Courrier de la guilde</p>
          <h1 className="text-[26px] sm:text-[34px] font-bold text-white leading-none">Missives</h1>
        </div>
        {conversations.length > 0 && (
          <span className="text-[12px] text-[var(--kz-mute)] shrink-0">{conversations.length} correspondance{conversations.length > 1 ? 's' : ''}</span>
        )}
      </header>

      <div className="qx-panel flex-1 flex overflow-hidden min-h-0">
        {/* Liste des correspondances */}
        <nav aria-label="Correspondances" className={`w-full md:w-72 border-r border-[#C084FC]/20 bg-[rgba(12,5,24,0.45)] overflow-y-auto shrink-0 rounded-l-[18px] ${activeConvId && !showList ? 'hidden md:block' : 'block'}`}>
          {loading ? (
            <div className="p-4 flex flex-col gap-2" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-[rgba(168,85,247,0.08)] animate-pulse" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-12">
              <span className="qxc-crest w-16 h-16 mb-4 text-[var(--qx-gold)]" aria-hidden><span className="qxc-crest-frame" /><span><MessageCircle size={22} /></span></span>
              <h2 className="text-[16px] font-bold text-white font-[family-name:var(--font-epic)] mb-1">Aucune missive</h2>
              <p className="text-[13px] text-[var(--kz-mute)]">Les recruteurs t&apos;écriront ici après ta candidature.</p>
            </div>
          ) : (
            <ul className="p-2 flex flex-col gap-1">
              {conversations.map((conv) => {
                const other = otherUser(conv)
                const selected = conv.id === activeConvId
                const unread = !!conv.last_message && !conv.last_message.is_read && conv.last_message.sender_id !== profile?.id
                return (
                  <li key={conv.id}>
                    <button onClick={() => openConv(conv.id)}
                      aria-current={selected ? 'true' : undefined}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${selected
                        ? 'border-[#FACC15]/50 bg-[linear-gradient(120deg,rgba(250,204,21,0.12),rgba(168,85,247,0.12))] shadow-[0_0_20px_-10px_rgba(250,204,21,0.9)]'
                        : 'border-transparent hover:bg-[rgba(168,85,247,0.1)] hover:border-[#C084FC]/25'}`}>
                      <span className="relative shrink-0">
                        <Avatar name={other?.full_name ?? 'KZ'} src={other?.avatar_url} avatarConfig={other?.avatar_config} size={40} color="var(--kz-violet-soft)" />
                        {unread && <span className="qxc-seal absolute -bottom-1 -right-1 w-4 h-4" aria-label="Nouvelle missive" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${unread ? 'font-bold text-white' : 'font-semibold text-[var(--kz-ink)]'}`}>{other?.full_name}</div>
                        {conv.job && <div className="text-xs text-[var(--kz-mute)] truncate flex items-center gap-1"><ScrollText size={10} className="shrink-0" aria-hidden />{conv.job.title}</div>}
                      </div>
                      {conv.last_message_at && <span className="text-[10px] text-[var(--kz-mute)] shrink-0 self-start mt-0.5">{timeAgo(conv.last_message_at)}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        {/* Parchemin de la correspondance */}
        <div className={`flex-1 flex flex-col min-w-0 qxc-letters rounded-r-[18px] ${!activeConvId || showList ? 'hidden md:flex' : 'flex'}`}>
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <span className="qxc-seal w-16 h-16 mb-4" aria-hidden><Feather size={24} /></span>
              <h2 className="text-[18px] font-bold text-white font-[family-name:var(--font-epic)] mb-1">Choisis une missive</h2>
              <p className="text-[13px] text-[var(--kz-mute)] max-w-[280px]">Brise le sceau d&apos;une correspondance pour la lire.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-3.5 py-3 border-b border-[#C084FC]/20 bg-[rgba(24,12,44,0.85)] shrink-0">
                <button onClick={() => setShowList(true)} aria-label="Retour aux correspondances" className="md:hidden w-8 h-8 grid place-items-center rounded-lg text-[var(--kz-mute)] hover:text-white hover:bg-[rgba(168,85,247,0.15)]">
                  <ArrowLeft size={16} />
                </button>
                {activeConv && (
                  <>
                    <Avatar name={otherUser(activeConv)?.full_name ?? 'KZ'} src={otherUser(activeConv)?.avatar_url} avatarConfig={otherUser(activeConv)?.avatar_config} size={36} color="var(--kz-violet-soft)" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{otherUser(activeConv)?.full_name}</div>
                      {activeConv.job && <div className="text-[11px] text-[var(--qx-gold)] truncate">Au sujet de : {activeConv.job.title}</div>}
                    </div>
                  </>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3" aria-live="polite">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === profile?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`qxc-missive max-w-[85%] sm:max-w-[70%] ${isMe ? 'qxc-missive-me' : 'qxc-missive-them'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70 text-right' : 'text-[#FDE68A]/70'}`}>{timeAgo(msg.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-[#C084FC]/20 bg-[rgba(24,12,44,0.85)] shrink-0">
                <label className="flex-1 flex items-center gap-2 h-11 px-3 rounded-xl border border-[#C084FC]/30 bg-[rgba(12,5,24,0.7)] focus-within:border-[#E879F9] focus-within:shadow-[0_0_0_4px_rgba(232,121,249,0.18)] transition-all min-w-0">
                  <Feather size={15} className="text-[var(--qx-gold)] shrink-0" aria-hidden />
                  <span className="sr-only">Écrire une missive</span>
                  <input value={input} onChange={(e) => setInput(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-sm text-[var(--kz-text)] placeholder:text-[var(--kz-mute)] outline-none"
                    placeholder="Écrire une missive..." />
                </label>
                <Button type="submit" kind="primary" size="md" className="h-11" icon={<Send size={15} />} aria-label="Envoyer la missive">
                  <span className="hidden sm:inline">Envoyer</span>
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
