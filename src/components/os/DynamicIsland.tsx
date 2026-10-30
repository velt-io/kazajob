'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Heart, Info, TriangleAlert } from 'lucide-react'
import { ISLAND_EVENT, type IslandMessage } from '@/lib/island'

const TONES = {
  success: { color: '#30D158', Icon: Check },
  love:    { color: '#FF375F', Icon: Heart },
  info:    { color: '#0A84FF', Icon: Info },
  warning: { color: '#FF9F0A', Icon: TriangleAlert },
} as const

/**
 * Pilule noire en haut de l'écran qui s'ouvre comme la Dynamic Island de l'iPhone,
 * affiche le message, puis se referme. Annoncée aux lecteurs d'écran (aria-live).
 */
export function DynamicIsland() {
  const [msg, setMsg] = useState<IslandMessage | null>(null)
  const [phase, setPhase] = useState<'idle' | 'open' | 'closing'>('idle')
  const timers = useRef<number[]>([])

  useEffect(() => {
    const onIsland = (e: Event) => {
      timers.current.forEach(clearTimeout)
      setMsg((e as CustomEvent<IslandMessage>).detail)
      setPhase('open')
      timers.current = [
        window.setTimeout(() => setPhase('closing'), 2600),
        window.setTimeout(() => setPhase('idle'), 3100),
      ]
    }
    window.addEventListener(ISLAND_EVENT, onIsland)
    return () => { window.removeEventListener(ISLAND_EVENT, onIsland); timers.current.forEach(clearTimeout) }
  }, [])

  const tone = TONES[msg?.tone ?? 'success']
  const open = phase === 'open'

  return (
    <div aria-live="polite" className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      {phase !== 'idle' && msg && (
        <div
          className="flex items-center gap-3 bg-black text-white rounded-[28px] border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] overflow-hidden"
          style={{
            height: open ? 56 : 36,
            width: open ? 'min(380px, calc(100vw - 24px))' : 126,
            padding: open ? '0 18px 0 10px' : '0 12px',
            opacity: phase === 'closing' ? 0 : 1,
            transition: 'width 0.55s cubic-bezier(0.34,1.56,0.64,1), height 0.55s cubic-bezier(0.34,1.56,0.64,1), padding 0.4s, opacity 0.45s',
          }}
        >
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500"
            style={{ background: tone.color, transform: open ? 'scale(1)' : 'scale(0.4)' }}>
            <tone.Icon size={18} strokeWidth={2.6} />
          </span>
          <div className="min-w-0 transition-opacity duration-300" style={{ opacity: open ? 1 : 0, transitionDelay: open ? '0.18s' : '0s' }}>
            <div className="text-[14px] font-semibold truncate">{msg.title}</div>
            {msg.subtitle && <div className="text-[12px] text-white/60 truncate">{msg.subtitle}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
