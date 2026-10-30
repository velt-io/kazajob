'use client'
/**
 * Carte des quêtes : charge la scène 3D côté client uniquement et bascule sur
 * une carte 2D si WebGL est indisponible ou si l'utilisateur limite les animations.
 */
import { Component, type ReactNode, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import type { Chapter } from '@/lib/quest-journey'
import { ROMAN } from '@/lib/quest-journey'

const QuestMap3D = dynamic(() => import('./QuestMap3D'), {
  ssr: false,
  loading: () => <MapLoading />,
})

function MapLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--kz-mute)] animate-pulse">Ouverture de la carte…</div>
    </div>
  )
}

class WebGLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

const subscribeMotion = (cb: () => void) => {
  const m = window.matchMedia('(prefers-reduced-motion: reduce)')
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const hasWebGL = () => {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}

/** Carte 2D de secours : même parcours, en sentier SVG. */
function QuestMap2D({ chapters, selectedId, onSelect }: { chapters: Chapter[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const pts = chapters.map((_, i) => {
    const t = i / (chapters.length - 1)
    return { x: 40 + t * 520 + Math.sin(t * Math.PI * 3) * 30, y: 260 - t * 210 + Math.cos(t * Math.PI * 4) * 18 }
  })
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
  return (
    <svg viewBox="0 0 600 300" className="absolute inset-0 w-full h-full" role="img" aria-label="Carte du parcours">
      <path d={d} fill="none" stroke="#A855F7" strokeWidth="3" strokeDasharray="8 6" opacity="0.6" />
      {chapters.map((c, i) => (
        <g key={c.id} transform={`translate(${pts[i].x},${pts[i].y})`} onClick={() => onSelect(c.id)} className="cursor-pointer">
          <circle r={selectedId === c.id ? 16 : 12} fill={c.status === 'done' ? '#FACC15' : c.status === 'current' ? '#E879F9' : '#4C1D95'} stroke="#F5EEFF" strokeWidth="1.5" />
          <text y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill={c.status === 'open' ? '#F5EEFF' : '#1A0B2E'}>{ROMAN[i]}</text>
        </g>
      ))}
    </svg>
  )
}

export function QuestMap({ chapters, selectedId, onSelect, interactive = true, className = '' }: {
  chapters: Chapter[]
  selectedId: string | null
  onSelect: (id: string) => void
  interactive?: boolean
  className?: string
}) {
  const canRender3D = useSyncExternalStore(subscribeMotion, () => !reducedMotion() && hasWebGL(), () => false)
  const fallback = <QuestMap2D chapters={chapters} selectedId={selectedId} onSelect={onSelect} />

  return (
    <div className={`relative ${className}`}>
      {canRender3D ? (
        <WebGLBoundary fallback={fallback}>
          <QuestMap3D chapters={chapters} selectedId={selectedId} onSelect={onSelect} interactive={interactive} />
        </WebGLBoundary>
      ) : fallback}
    </div>
  )
}
