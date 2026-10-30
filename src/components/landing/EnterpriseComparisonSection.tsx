import { KZ } from '@/lib/constants'

const CHECK = (
  <div className="w-5 h-5 rounded-full bg-[var(--kz-green)] border border-white/20 flex items-center justify-center">
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
  </div>
)
const CHECK_PARTIAL = (
  <div className="w-5 h-5 rounded-full bg-white/20 border border-white/20 flex items-center justify-center">
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" /></svg>
  </div>
)
const CROSS = (
  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1L8 8M8 1L1 8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" /></svg>
  </div>
)

const ROWS: { feature: string; kazajob: 'yes' | 'partial' | 'no'; national: 'yes' | 'partial' | 'no'; bouche: 'yes' | 'partial' | 'no' }[] = [
  { feature: 'Tarif adapté aux PME locales', kazajob: 'yes', national: 'no', bouche: 'yes' },
  { feature: 'Recrutement 100% ciblé La Réunion', kazajob: 'yes', national: 'no', bouche: 'partial' },
  { feature: 'IA de tri des candidatures', kazajob: 'yes', national: 'partial', bouche: 'no' },
  { feature: 'Pipeline de suivi Kanban', kazajob: 'yes', national: 'partial', bouche: 'no' },
  { feature: 'Support réunionnais réactif', kazajob: 'yes', national: 'no', bouche: 'no' },
  { feature: 'Sans engagement long terme', kazajob: 'yes', national: 'no', bouche: 'yes' },
  { feature: 'Multi-recruteurs inclus', kazajob: 'yes', national: 'partial', bouche: 'no' },
  { feature: 'Mention H/F et conformité vérifiées', kazajob: 'yes', national: 'no', bouche: 'no' },
]

const ICON: Record<'yes' | 'partial' | 'no', React.ReactNode> = { yes: CHECK, partial: CHECK_PARTIAL, no: CROSS }

export function EnterpriseComparisonSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-20 border-t border-[var(--kz-edge)]" style={{ background: KZ.ink }}>
      <div className="max-w-[860px] mx-auto">
        <div className="text-center mb-10">
          <p className="kz-eyebrow mb-3" style={{ color: KZ.orange }}>Comparatif</p>
          <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-white mb-3">
            Kazajob vs les autres façons de recruter
          </h2>
          <p className="text-sm text-white/60">Le seul outil de recrutement conçu spécifiquement pour La Réunion, de A à Z.</p>
        </div>

        <div className="rounded-2xl border border-white/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 px-5 py-3 border-b border-white/10">
            <div className="text-xs font-bold text-white/50 uppercase tracking-wider">Fonctionnalité</div>
            <div className="text-center w-24 text-xs font-bold" style={{ color: KZ.orange }}>Kazajob</div>
            <div className="text-center w-24 text-xs font-bold text-white/50">Plateformes nationales</div>
            <div className="text-center w-24 text-xs font-bold text-white/50">Annonces / réseau</div>
          </div>

          {ROWS.map((row) => (
            <div
              key={row.feature}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-0 px-5 py-3.5 border-b border-white/5 hover:bg-white/5 transition-colors"
            >
              <div className="text-sm text-white/80">{row.feature}</div>
              <div className="flex justify-center w-24">{ICON[row.kazajob]}</div>
              <div className="flex justify-center w-24">{ICON[row.national]}</div>
              <div className="flex justify-center w-24">{ICON[row.bouche]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
