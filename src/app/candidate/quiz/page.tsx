'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, RefreshCw, Eye, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { QUIZ, ARCHETYPES, type ArchetypeKey } from '@/lib/quiz'
import { cn } from '@/lib/utils'

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
      <div className="max-w-[560px] mx-auto py-6">
        <div className="osc-in relative overflow-hidden rounded-[32px] border border-[var(--kz-edge)] p-8 sm:p-10 text-center shadow-[var(--os-elevation)]"
          style={{ background: `radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, ${a.color} 38%, transparent), transparent 65%), var(--osc-surface)` }}>
          <span className="osc-step-dot mx-auto w-20 h-20 rounded-[24px] flex items-center justify-center text-white text-[34px] font-semibold"
            style={{ background: `linear-gradient(145deg, ${a.color}, color-mix(in srgb, ${a.color} 55%, var(--kz-violet)))`, boxShadow: `0 20px 50px -18px ${a.color}`, ['--d' as string]: '150ms' }}>
            {a.label.replace(/^(Le|La|L’|L')\s*/i, '').charAt(0)}
          </span>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] mt-6" style={{ color: a.color }}>Ton style de travail</p>
          <h1 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.05em] text-[var(--kz-ink)] leading-none mt-2">{a.label}</h1>
          <p className="text-[15px] text-[var(--kz-text)] leading-relaxed mt-4 max-w-[400px] mx-auto">{a.tagline}</p>
          <div className="flex items-center justify-center gap-2 mt-6 text-[13px] text-[var(--kz-mute)]">
            <Eye size={14} /> Visible par les recruteurs : un aperçu de ta façon de travailler.
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-8">
            <Link href="/candidate/profile" className="flex-1">
              <Button kind="primary" size="lg" full iconRight={<ArrowRight size={15} />}>Voir mon profil</Button>
            </Link>
            <Button kind="soft" size="lg" icon={<RefreshCw size={14} />} onClick={restart}>Refaire</Button>
          </div>
        </div>
      </div>
    )
  }

  const question = QUIZ[step]
  return (
    <div className="max-w-[600px] mx-auto py-4">
      {/* Progression segmentée */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--kz-mute)] flex items-center gap-1.5">
            <Sparkles size={13} className="text-[var(--kz-violet)]" /> Quiz profil
          </p>
          <span className="text-[13px] font-semibold text-[var(--kz-mute)] tabular-nums">{step + 1} sur {total}</span>
        </div>
        <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label="Progression du quiz">
          {QUIZ.map((_, i) => (
            <span key={i} className="h-1 flex-1 rounded-full bg-[var(--kz-line)] overflow-hidden">
              <span className={cn('block h-full rounded-full transition-[width] duration-700', i <= step ? 'w-full' : 'w-0')}
                style={{ background: 'var(--os-aurora)', transitionTimingFunction: 'var(--osc-spring)' }} />
            </span>
          ))}
        </div>
      </div>

      <div key={step} className="osc-in">
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.04em] text-[var(--kz-ink)] mb-7 leading-[1.1]">{question.q}</h1>
        <div className="osc-card !rounded-[22px] divide-y divide-[var(--osc-hairline)] overflow-hidden">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled={saving}
              onClick={() => pick(i)}
              className="osc-press group w-full flex items-center gap-4 px-4 sm:px-5 py-4 text-left transition-colors hover:bg-[var(--osc-surface-hi)] focus-visible:outline-none focus-visible:bg-[var(--kz-blue-soft)] disabled:opacity-50"
            >
              <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold text-[var(--kz-mute)] border border-[var(--kz-edge)] transition-colors group-hover:bg-[var(--kz-violet)] group-hover:text-white group-hover:border-transparent">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-[15px] font-medium text-[var(--kz-ink)] leading-snug">{opt.label}</span>
              <ChevronRight size={17} className="text-[var(--kz-mute)] opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-[13px] text-[var(--kz-mute)] mt-6">
        Réponds spontanément : il n’y a pas de mauvaise réponse.
      </p>
    </div>
  )
}
