'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, RefreshCw, Compass, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { QUIZ, ARCHETYPES, type ArchetypeKey } from '@/lib/quiz'
import { spellLink } from '@/components/quest/candidat/QuestKit'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function CandidateQuizPage() {
  const { profile, refetch } = useAuth()
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [archetype, setArchetype] = useState<ArchetypeKey | null>(
    (profile?.quiz_result?.archetype as ArchetypeKey) ?? null
  )
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)

  const total = QUIZ.length

  const pick = async (optionIndex: number) => {
    const next = [...answers]
    next[step] = optionIndex
    setAnswers(next)

    if (step < total - 1) {
      setStep(step + 1)
      return
    }
    // Dernière question → envoi au serveur (scoring anti-triche)
    setSaving(true)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: next }),
      })
      if (res.ok) {
        const data = await res.json()
        setArchetype(data.archetype as ArchetypeKey)
        setDone(true)
        await refetch?.()
      }
    } catch { /* noop */ }
    setSaving(false)
  }

  const restart = () => { setStep(0); setAnswers([]); setDone(false); setArchetype(null) }

  if (done && archetype) {
    const a = ARCHETYPES[archetype]
    return (
      <div className="max-w-[580px] mx-auto py-6">
        <div className="qxc-card qxc-legend p-7 sm:p-9 text-center qx-rise" style={{ ['--r' as string]: a.color }}>
          <span className="qxc-corners" aria-hidden />
          <span className="qxc-crest w-24 h-24 mx-auto mb-5 qxc-stamp" style={{ ['--r' as string]: a.color }} aria-hidden>
            <span className="qxc-crest-frame" /><span style={{ color: `color-mix(in srgb, ${a.color} 60%, white)` }}><Sparkles size={34} /></span>
          </span>
          <p className="kz-eyebrow mb-2" style={{ color: `color-mix(in srgb, ${a.color} 65%, white)` }}>Ta classe de héros</p>
          <h1 className="text-[30px] sm:text-[36px] font-bold text-white mb-3">{a.label}</h1>
          <p className="text-sm text-[var(--kz-text)] leading-relaxed mb-6 max-w-[400px] mx-auto">{a.tagline}</p>
          <div className="p-3 rounded-xl border border-[#C084FC]/25 bg-[rgba(12,5,24,0.5)] text-xs text-[var(--kz-text)] mb-6 flex items-center justify-center gap-2">
            <Eye size={13} className="text-[var(--qx-cyan)] shrink-0" aria-hidden />
            <span><strong className="text-white">Visible par les recruteurs</strong> — ça leur donne un aperçu de ta façon de travailler.</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link href="/candidat/profil" className={`${spellLink('md')} flex-1 h-12`}>
              Voir mon profil <ArrowRight size={15} aria-hidden />
            </Link>
            <Button kind="soft" size="lg" icon={<RefreshCw size={14} />} onClick={restart}>Refaire</Button>
          </div>
        </div>
      </div>
    )
  }

  const question = QUIZ[step]
  const pct = ((step + 1) / total) * 100
  return (
    <div className="max-w-[600px] mx-auto py-6">
      <div className="mb-5 qx-rise">
        <div className="flex items-center justify-between mb-2">
          <p className="kz-eyebrow flex items-center gap-1.5 text-[var(--qx-neon)]">
            <Compass size={13} aria-hidden /> Épreuve de la classe
          </p>
          <span className="text-xs font-bold text-[var(--qx-gold)] tabular-nums">{step + 1} / {total}</span>
        </div>
        <div className="qx-xp" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={total} aria-label="Progression du quiz"><span style={{ width: `${pct}%`, transition: 'width 0.5s cubic-bezier(0.2,0.8,0.2,1)' }} /></div>
      </div>

      <div key={step} className="qx-panel p-5 sm:p-7 qx-rise">
        <h1 className="text-[20px] sm:text-[24px] font-bold text-white mb-5 leading-snug">{question.q}</h1>
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled={saving}
              onClick={() => pick(i)}
              className="group flex items-center gap-3 text-left p-3.5 rounded-xl border border-[#C084FC]/25 bg-[rgba(12,5,24,0.55)] text-sm font-semibold text-[var(--kz-ink)] transition-all hover:-translate-y-0.5 hover:border-[#E879F9]/70 hover:shadow-[0_0_24px_-8px_rgba(232,121,249,0.9)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/40 disabled:opacity-50"
            >
              <span aria-hidden className="w-7 h-7 rounded-md rotate-45 grid place-items-center shrink-0 border border-[#FACC15]/45 bg-[rgba(250,204,21,0.08)] text-[var(--qx-gold)] group-hover:bg-[#FACC15] group-hover:text-[#1A0B2E] transition-colors">
                <span className="-rotate-45 text-[11px] font-bold">{LETTERS[i] ?? i + 1}</span>
              </span>
              <span className="min-w-0">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-[var(--kz-mute)] mt-4">
        Réponds spontanément — il n’y a pas de mauvaise réponse.
      </p>
    </div>
  )
}
