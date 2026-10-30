import { X, Check } from 'lucide-react'
import { KZ, SUBSCRIPTION_PLANS } from '@/lib/constants'

const MIN_PRICE = Math.min(...SUBSCRIPTION_PLANS.map((p) => p.priceCts)) / 100

const PAINS = [
  {
    pain: 'Des dizaines de CV hors sujet à trier à la main.',
    fix: 'KazaIA analyse chaque candidature et vous dit qui contacter en premier.',
  },
  {
    pain: 'Des sites nationaux où les candidats locaux se perdent.',
    fix: '100 % La Réunion : une plateforme dédiée aux talents de l’île, et à eux seuls.',
  },
  {
    pain: 'Des annonces chères, puis un suivi sur Excel et par SMS.',
    fix: `Pipeline, messagerie et agenda d’entretiens réunis, dès ${MIN_PRICE} €/mois.`,
  },
  {
    pain: 'Des candidats qui ne répondent plus après l’entretien.',
    fix: 'Statut de candidature visible par le candidat et messagerie directe : le lien ne se rompt pas.',
  },
]

export function RecruiterPainSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-20 border-t border-[var(--kz-edge)]" style={{ background: KZ.cream }}>
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10 lg:mb-12">
          <p className="kz-eyebrow mb-2" style={{ color: KZ.orange }}>Recruter au 974</p>
          <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[var(--kz-ink)] max-w-[760px] mx-auto">
            Recruter à La Réunion ne devrait pas être un parcours du combattant.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          {PAINS.map((p) => (
            <div key={p.pain} className="kz-card bg-[var(--kz-paper)] overflow-hidden">
              <div className="flex gap-3 items-start p-4 border-b border-dashed border-[var(--kz-line)]">
                <span className="w-7 h-7 rounded-full border border-[var(--kz-edge)] flex items-center justify-center shrink-0" style={{ background: KZ.orangeSoft }}>
                  <X size={14} color={KZ.orangeDeep} strokeWidth={3} />
                </span>
                <p className="text-sm text-[var(--kz-mute)] line-through decoration-[var(--kz-orange-deep)]/40">{p.pain}</p>
              </div>
              <div className="flex gap-3 items-start p-4" style={{ background: '#FBFFFC' }}>
                <span className="w-7 h-7 rounded-full border border-[var(--kz-edge)] flex items-center justify-center shrink-0" style={{ background: KZ.greenSoft }}>
                  <Check size={14} color={KZ.green} strokeWidth={3} />
                </span>
                <p className="text-sm font-semibold text-[var(--kz-ink)]">{p.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
