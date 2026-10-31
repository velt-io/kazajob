import { Check, Crown, Swords, X } from 'lucide-react'
import { QUEST_STAGES, applicationQuest } from './quest-ui'

/**
 * Piste de progression d'une candidature : 5 gemmes (Envoyée → Trésor).
 * Les gemmes s'allument en cascade, l'étape en cours pulse.
 */
export function StageTrack({ status }: { status: string }) {
  const q = applicationQuest(status)
  const ended = q.state === 'lost' || q.state === 'abandoned'
  const current = QUEST_STAGES[Math.max(q.step, 0)]

  return (
    <div role="group" aria-label={ended ? (q.state === 'lost' ? 'Quête échouée' : 'Quête abandonnée') : `Étape ${q.step + 1} sur 5 : ${current.label}`}>
      <div className={`qxc-track ${ended ? 'opacity-45 grayscale' : ''}`}>
        {!ended && q.step > 0 && <span aria-hidden className="qxc-track-fill" style={{ width: `${q.progress * 0.8}%` }} />}
        {QUEST_STAGES.map((s, i) => {
          const state = ended ? 'open' : q.state === 'won' && i === 4 ? 'won' : i < q.step ? 'done' : i === q.step ? 'current' : 'open'
          return (
            <div key={s.key} className="flex flex-col items-center gap-1.5 min-w-0">
              <span aria-hidden className="qxc-node" data-state={state} style={{ animationDelay: `${0.1 + i * 0.09}s` }}>
                <span className="inline-flex">
                  {state === 'won' ? <Crown size={13} strokeWidth={2.5} />
                    : state === 'done' ? <Check size={13} strokeWidth={3} />
                    : state === 'current' ? <Swords size={12} />
                    : <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
                </span>
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-[0.08em] truncate max-w-full ${state === 'current' || state === 'won' ? 'text-white' : state === 'done' ? 'text-[var(--qx-gold)]' : 'text-[var(--kz-mute)]'} ${state === 'current' || state === 'won' ? '' : 'hidden sm:block'}`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
      {ended && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#FCA5A5]">
          <X size={12} aria-hidden />{q.state === 'lost' ? 'Quête échouée — d’autres primes t’attendent' : 'Quête abandonnée'}
        </p>
      )}
    </div>
  )
}
