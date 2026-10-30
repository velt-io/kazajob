'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sparkles, MapPin } from 'lucide-react'
import { QuestMap } from './QuestMap'
import { computeJourney, DEMO_JOURNEY_INPUT, RARITY_META, ROMAN } from '@/lib/quest-journey'

/** Vitrine du hero : carte 3D d'un parcours d'exemple, chapitre mis en avant qui défile. */
export function QuestShowcase() {
  const chapters = useMemo(() => computeJourney(DEMO_JOURNEY_INPUT), [])
  const [i, setI] = useState(chapters.findIndex((c) => c.status === 'current'))

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % chapters.length), 3800)
    return () => clearInterval(t)
  }, [chapters.length])

  const c = chapters[i]
  const r = RARITY_META[c.rarity]

  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-10 bg-[radial-gradient(closest-side,rgba(168,85,247,0.35),transparent)] blur-2xl" />
      <div className="relative qx-panel overflow-hidden">
        <QuestMap chapters={chapters} selectedId={c.id} onSelect={(id) => setI(chapters.findIndex((x) => x.id === id))} interactive={false} className="h-[380px] sm:h-[480px]" />
      </div>
      {/* Carte de chapitre flottante */}
      <div key={c.id} className="absolute left-3 right-3 sm:left-auto sm:right-[-18px] bottom-[-22px] sm:w-[300px] qx-panel p-4 qx-rise" style={{ boxShadow: `0 0 40px -10px ${r.glow}` }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--kz-mute)]">Chapitre {ROMAN[c.index - 1]}</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: r.color }}>{r.label}</span>
        </div>
        <div className="text-[18px] font-bold text-white mt-1 font-[family-name:var(--font-epic)]">{c.title}</div>
        <div className="flex items-center gap-1 text-[12px] text-[var(--qx-cyan)]"><MapPin size={11} />{c.place}</div>
        <div className="qx-xp mt-3"><span style={{ width: `${Math.max(c.progress, 4)}%` }} /></div>
        <div className="flex items-center justify-between mt-2 text-[11px]">
          <span className="text-[var(--kz-text)]">{c.objective}</span>
          <span className="flex items-center gap-1 font-bold text-[var(--qx-gold)]"><Sparkles size={11} />+{c.xp} XP</span>
        </div>
      </div>
    </div>
  )
}
