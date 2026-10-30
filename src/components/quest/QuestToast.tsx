'use client'

import { useEffect, useRef, useState } from 'react'
import { Crown, Heart, ScrollText, Sparkles } from 'lucide-react'
import { ISLAND_EVENT, type IslandMessage } from '@/lib/island'

const TONES = {
  success: { color: '#FACC15', Icon: Crown },
  love:    { color: '#F472B6', Icon: Heart },
  info:    { color: '#22D3EE', Icon: ScrollText },
  warning: { color: '#FB923C', Icon: Sparkles },
} as const

/**
 * Bannière de récompense façon MMORPG (thème Quest) : un parchemin néon descend
 * en haut de l'écran avec un éclat lumineux, puis disparaît. Même événement que
 * la Dynamic Island du thème OS (cf. lib/island.ts).
 */
export function QuestToast() {
  const [msg, setMsg] = useState<IslandMessage | null>(null)
  const [phase, setPhase] = useState<'idle' | 'in' | 'out'>('idle')
  const timers = useRef<number[]>([])

  useEffect(() => {
    const on = (e: Event) => {
      timers.current.forEach(clearTimeout)
      setMsg((e as CustomEvent<IslandMessage>).detail)
      setPhase('in')
      timers.current = [window.setTimeout(() => setPhase('out'), 2800), window.setTimeout(() => setPhase('idle'), 3300)]
    }
    window.addEventListener(ISLAND_EVENT, on)
    return () => { window.removeEventListener(ISLAND_EVENT, on); timers.current.forEach(clearTimeout) }
  }, [])

  if (phase === 'idle' || !msg) return <div aria-live="polite" className="sr-only" />
  const t = TONES[msg.tone ?? 'success']

  return (
    <div aria-live="polite" className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div
        className="relative flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-xl border-2 bg-[linear-gradient(180deg,rgba(46,16,101,0.97),rgba(18,8,34,0.97))] overflow-hidden"
        style={{
          borderColor: t.color,
          boxShadow: `0 0 40px -6px ${t.color}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          animation: phase === 'in' ? 'qx-toast-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both' : 'qx-toast-out 0.45s ease-in both',
        }}
      >
        {/* Reflet qui balaie la bannière */}
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.25)_50%,transparent_70%)] bg-[length:250%_100%] animate-[qx-shine_1.4s_ease-out_0.2s_both]" />
        <span className="relative w-9 h-9 rounded-md rotate-45 flex items-center justify-center shrink-0" style={{ background: t.color, boxShadow: `0 0 18px ${t.color}` }}>
          <t.Icon size={17} className="-rotate-45 text-[#1A0B2E]" strokeWidth={2.5} />
        </span>
        <div className="relative min-w-0">
          <div className="text-[14px] font-bold text-white tracking-wide font-[family-name:var(--font-epic)]">{msg.title}</div>
          {msg.subtitle && <div className="text-[12px] font-semibold" style={{ color: t.color }}>{msg.subtitle}</div>}
        </div>
      </div>
    </div>
  )
}
