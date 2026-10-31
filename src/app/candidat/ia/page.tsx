'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUp, Square, Trash2, Sparkles, FileText, Mic, Brain, TrendingUp } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { useKazaChat, type ChatMessage } from '@/features/ai/useKazaIA'
import { cn } from '@/lib/utils'

const SUGGESTED_PROMPTS = [
  { icon: <FileText size={15} />, color: 'var(--kz-blue)',   text: 'Comment optimiser mon profil Kazajob ?' },
  { icon: <Brain size={15} />,    color: 'var(--kz-violet)', text: 'Quels salaires pour un dev React à La Réunion ?' },
  { icon: <Mic size={15} />,      color: 'var(--kz-green)',  text: 'Comment me préparer à un entretien ?' },
  { icon: <TrendingUp size={15} />, color: 'var(--kz-orange)', text: 'Quels secteurs recrutent le plus en 974 ?' },
]

function MessageBubble({ msg, userName, userAvatarConfig }: { msg: ChatMessage; userName: string; userAvatarConfig?: Record<string, unknown> | null }) {
  const isAssistant = msg.role === 'assistant'

  return (
    <div className={cn('flex gap-2.5 items-end', isAssistant ? 'justify-start' : 'justify-end')}>
      {isAssistant && (
        <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: 'var(--os-aurora)' }}>
          <Sparkles size={14} />
        </span>
      )}

      <div
        className={cn(
          'osc-bubble max-w-[82%] sm:max-w-[72%] px-4 py-2.5 rounded-[20px] text-[15px] leading-[1.45]',
          isAssistant
            ? 'text-[var(--kz-ink)] bg-[color-mix(in_srgb,var(--kz-ink)_11%,var(--kz-cream))] osc-bubble-in-them'
            : 'text-white bg-[var(--kz-blue)] osc-bubble-in-me',
        )}
        data-tail={isAssistant ? 'them' : 'me'}
      >
        {msg.loading ? (
          <span className="flex items-center gap-1 py-1" aria-label="KazaIA réfléchit">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-[var(--kz-mute)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        ) : (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        )}
      </div>

      {!isAssistant && (
        <Avatar name={userName} avatarConfig={userAvatarConfig} size={28} color="color-mix(in srgb, var(--kz-ink) 12%, transparent)" className="shrink-0" />
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

  const ready = !!input.trim()

  return (
    <div className="max-w-[860px] mx-auto flex flex-col h-[calc(100dvh-110px)] md:h-[calc(100dvh-130px)]">
      <div className="os-glass flex-1 rounded-[28px] overflow-hidden flex flex-col min-h-0 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
        {/* En-tête */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-[var(--kz-line)] shrink-0">
          <span className="w-10 h-10 rounded-[13px] flex items-center justify-center text-white shrink-0" style={{ background: 'var(--os-aurora)' }}>
            <Sparkles size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)]">KazaIA</h1>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full text-[var(--kz-violet)] bg-[var(--kz-violet-soft)]">Bêta</span>
            </div>
            <p className="text-[12px] text-[var(--kz-mute)] truncate">Ton assistant emploi pour le 974 · Groq · GPT-OSS</p>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={clearChat} aria-label="Effacer la conversation"
              className="osc-press osc-fade w-9 h-9 rounded-full flex items-center justify-center text-[var(--kz-mute)] hover:text-[var(--kz-ink)] hover:bg-[var(--kz-line)]">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-5 flex flex-col gap-3" aria-live="polite">
          {messages.length === 0 ? (
            /* Écran d'accueil */
            <div className="flex flex-col items-center justify-center flex-1 gap-7 text-center py-6">
              <span className="osc-in w-20 h-20 rounded-[26px] flex items-center justify-center text-white"
                style={{ background: 'var(--os-aurora)', boxShadow: '0 24px 60px -20px color-mix(in srgb, var(--kz-violet) 80%, transparent)' }}>
                <Sparkles size={34} />
              </span>
              <div className="osc-in" style={{ ['--i' as string]: 1 }}>
                <h2 className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.045em] text-[var(--kz-ink)] leading-tight">
                  Bonzour, moi c&apos;est <span className="os-text-aurora">KazaIA</span>.
                </h2>
                <p className="text-[15px] text-[var(--kz-mute)] max-w-[440px] leading-relaxed mt-2 mx-auto">
                  Lettre de motivation, préparation d&apos;entretien, marché de l&apos;emploi en 974 : demande-moi ce que tu veux.
                </p>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[560px]">
                {SUGGESTED_PROMPTS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s.text)}
                    className="osc-press osc-in osc-lift flex items-center gap-3 p-3.5 text-left rounded-[18px] border border-[var(--kz-edge)] bg-[var(--osc-surface)]"
                    style={{ ['--i' as string]: i + 2 }}
                  >
                    <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 16%, transparent)` }}>{s.icon}</span>
                    <span className="text-[14px] font-medium text-[var(--kz-ink)] leading-snug">{s.text}</span>
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
        <div className="border-t border-[var(--kz-line)] px-3 sm:px-4 pt-3 pb-2.5 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 pl-4 pr-1.5 py-1.5 rounded-[22px] border border-[var(--kz-edge)] bg-[var(--osc-surface)] focus-within:border-[color-mix(in_srgb,var(--kz-violet)_60%,transparent)] transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Message à KazaIA"
              placeholder="Pose ta question à KazaIA…"
              rows={1}
              className="flex-1 resize-none bg-transparent py-1.5 text-[15px] text-[var(--kz-ink)] placeholder:text-[var(--kz-mute)] outline-none"
              style={{ minHeight: '34px', maxHeight: '120px' }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 120) + 'px'
              }}
            />
            {streaming ? (
              <button type="button" onClick={stopStream} aria-label="Arrêter la réponse"
                className="osc-press w-8 h-8 rounded-full flex items-center justify-center bg-[var(--kz-ink)] text-[var(--kz-inverse)] shrink-0">
                <Square size={12} fill="currentColor" />
              </button>
            ) : (
              <button type="submit" aria-label="Envoyer" disabled={!ready} data-ready={ready}
                className="osc-send w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: 'var(--os-aurora)' }}>
                <ArrowUp size={17} strokeWidth={2.75} />
              </button>
            )}
          </form>
          <p className="text-[11px] text-[var(--kz-mute)] text-center mt-2">
            KazaIA peut faire des erreurs. Vérifie les informations importantes. Propulsé par Groq · Passera sur Claude bientôt.
          </p>
        </div>
      </div>
    </div>
  )
}
