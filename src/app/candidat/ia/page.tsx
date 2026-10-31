'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Square, Trash2, Sparkles, FileText, Mic, Brain } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { useKazaChat, type ChatMessage } from '@/features/ai/useKazaIA'

const SUGGESTED_PROMPTS = [
  { icon: <FileText size={14} />, text: 'Comment optimiser mon profil Kazajob ?' },
  { icon: <Brain size={14} />,    text: 'Quels salaires pour un dev React à La Réunion ?' },
  { icon: <Mic size={14} />,      text: 'Comment me préparer à un entretien ?' },
  { icon: <Sparkles size={14} />, text: 'Quels secteurs recrutent le plus en 974 ?' },
]

function Oracle({ size = 32 }: { size?: number }) {
  return (
    <span className="qxc-crest text-white shrink-0" style={{ width: size, height: size, ['--r' as string]: 'var(--qx-magenta)' }} aria-hidden>
      <span className="qxc-crest-frame" />
      <span><Sparkles size={Math.round(size * 0.42)} /></span>
    </span>
  )
}

function MessageBubble({ msg, userName, userAvatarConfig }: { msg: ChatMessage; userName: string; userAvatarConfig?: Record<string, unknown> | null }) {
  const isAssistant = msg.role === 'assistant'

  return (
    <div className={`flex gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && <div className="mt-0.5"><Oracle size={34} /></div>}

      <div className={`qxc-missive max-w-[82%] sm:max-w-[72%] ${isAssistant ? 'qxc-missive-them' : 'qxc-missive-me'}`}>
        {msg.loading ? (
          <div className="flex items-center gap-1.5" role="status">
            <span className="text-xs text-[#FDE68A]/80">KazaIA réfléchit</span>
            <span className="flex gap-1" aria-hidden>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rotate-45 bg-[var(--qx-gold)] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        )}
      </div>

      {!isAssistant && (
        <Avatar name={userName} avatarConfig={userAvatarConfig} size={32} color="var(--kz-violet-soft)" className="shrink-0 mt-0.5" />
      )}
    </div>
  )
}

export default function KazaIAPage() {
  const { profile } = useAuth()
  const { messages, streaming, sendMessage, stopStream, clearChat } = useKazaChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || streaming) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleSuggestion = (text: string) => {
    sendMessage(text)
  }

  return (
    <div className="max-w-[860px] mx-auto flex flex-col h-[calc(100vh-96px)]">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0 qx-rise">
        <div className="flex items-center gap-3 min-w-0">
          <Oracle size={46} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[24px] sm:text-[28px] font-bold text-white leading-none">KazaIA</h1>
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-md text-[#D8B4FE] border border-[#A855F7]/45 bg-[rgba(168,85,247,0.16)]">Beta</span>
              <span className="text-[10px] text-[var(--kz-mute)] font-semibold hidden sm:inline">
                propulsé par Groq · GPT-OSS
              </span>
            </div>
            <p className="text-xs text-[var(--kz-mute)] mt-1">L&apos;oracle de la guilde · ton assistant emploi pour le 974</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button kind="soft" size="sm" icon={<Trash2 size={14} />} onClick={clearChat} aria-label="Effacer la conversation">
            <span className="hidden sm:inline">Effacer</span>
          </Button>
        )}
      </div>

      {/* Zone de dialogue */}
      <div className="qx-panel flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 qxc-letters rounded-t-[18px]" aria-live="polite">
          {messages.length === 0 ? (
            /* Accueil */
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-8">
              <div className="qxc-portrait w-24 h-24">
                <Oracle size={88} />
              </div>
              <div>
                <h2 className="text-[22px] sm:text-[26px] font-bold text-white mb-2">
                  Bonzour ! Moi c&apos;est <span className="qx-text-arcane">KazaIA</span>.
                </h2>
                <p className="text-sm text-[var(--kz-mute)] max-w-[440px] leading-relaxed">
                  Ton assistant emploi pour La Réunion. Je peux t&apos;aider à rédiger une lettre de motivation,
                  préparer un entretien, comprendre le marché de l&apos;emploi en 974 et bien plus.
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[520px]">
                {SUGGESTED_PROMPTS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestion(s.text)}
                    className="flex items-center gap-2.5 p-3 text-left text-sm font-semibold rounded-xl border border-[#C084FC]/25 bg-[rgba(24,12,44,0.85)] transition-all hover:-translate-y-0.5 hover:border-[#E879F9]/70 hover:shadow-[0_0_22px_-8px_rgba(232,121,249,0.9)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/40"
                  >
                    <span className="text-[var(--qx-gold)] shrink-0" aria-hidden>{s.icon}</span>
                    <span className="text-[var(--kz-ink)]">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} userName={profile?.full_name ?? 'Toi'} userAvatarConfig={profile?.avatar_config} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Saisie */}
        <div className="border-t border-[#C084FC]/20 bg-[rgba(24,12,44,0.9)] p-3 rounded-b-[18px]">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <label htmlFor="kazaia-input" className="sr-only">Pose ta question à KazaIA</label>
            <textarea
              id="kazaia-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose ta question à KazaIA... (Entrée pour envoyer)"
              rows={1}
              className="flex-1 min-w-0 resize-none bg-[rgba(12,5,24,0.7)] border border-[#C084FC]/30 rounded-xl px-4 py-2.5 text-sm text-[var(--kz-ink)] placeholder:text-[var(--kz-mute)] outline-none focus:border-[#E879F9] focus:shadow-[0_0_0_4px_rgba(232,121,249,0.18)] transition-all"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 120) + 'px'
              }}
            />
            {streaming ? (
              <Button type="button" kind="danger" size="md" className="h-11" icon={<Square size={15} />} onClick={stopStream}>
                Stop
              </Button>
            ) : (
              <Button
                type="submit"
                kind="primary"
                size="md"
                className="h-11"
                icon={<Send size={15} />}
                disabled={!input.trim()}
                aria-label="Envoyer"
              >
                <span className="hidden sm:inline">Envoyer</span>
              </Button>
            )}
          </form>
          <p className="text-[10px] text-[var(--kz-mute)] text-center mt-2">
            KazaIA peut faire des erreurs. Vérifie les informations importantes.
            Propulsé par <span className="font-semibold">Groq</span> · Passera sur <span className="font-semibold">Claude</span> bientôt.
          </p>
        </div>
      </div>
    </div>
  )
}
