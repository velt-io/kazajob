'use client'

import { Check } from 'lucide-react'
import { KZ } from '@/lib/constants'

export interface StepDef {
  id: string
  label: string
}

interface StepperProps {
  steps: StepDef[]
  currentIndex: number
  visitedIds: Set<string>
  onStepClick: (index: number) => void
}

export function Stepper({ steps, currentIndex, visitedIds, onStepClick }: StepperProps) {
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100)

  return (
    <div className="p-4 border-b border-[var(--kz-line)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[var(--kz-ink)] uppercase tracking-wide">
          Étape {currentIndex + 1} / {steps.length}
        </span>
        <span className="text-xs font-semibold text-[var(--kz-mute)]">{progress}%</span>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: KZ.cream2 }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: KZ.violet }} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {steps.map((step, i) => {
          const isCurrent = i === currentIndex
          const isVisited = visitedIds.has(step.id)
          const clickable = isVisited || i <= currentIndex
          return (
            <button
              key={step.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(i)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all disabled:cursor-not-allowed"
              style={isCurrent
                ? { background: KZ.violet, color: 'white', borderColor: KZ.violet }
                : isVisited
                  ? { background: KZ.violetSoft, color: KZ.violet, borderColor: KZ.violet }
                  : { background: KZ.paper, color: 'var(--kz-mute)', borderColor: 'var(--kz-line)' }}
            >
              {isVisited && !isCurrent ? <Check size={11} /> : <span>{i + 1}</span>}
              {step.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
