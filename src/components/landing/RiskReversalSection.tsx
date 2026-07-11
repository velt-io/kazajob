import { CreditCard, MousePointerClick, DatabaseBackup } from 'lucide-react'
import { KZ } from '@/lib/constants'
import { Soleil, Sparkle } from '@/components/illustrations/Tropical'

interface RiskReversalSectionProps {
  launchDays?: number | null
}

export function RiskReversalSection({ launchDays }: RiskReversalSectionProps) {
  const ITEMS = [
    {
      icon: <CreditCard size={24} />,
      color: KZ.orangeSoft,
      title: launchDays ? 'Sans carte bancaire' : 'Carte requise, débit différé',
      desc: launchDays
        ? `Aucune carte à enregistrer pendant la phase de lancement (${launchDays} jours restants).`
        : "Votre carte n'est débitée qu'après vos 30 jours d'essai gratuit.",
    },
    {
      icon: <MousePointerClick size={24} />,
      color: KZ.violetSoft,
      title: 'Résiliation en 1 clic',
      desc: 'Annulez à tout moment depuis votre espace recruteur. Aucun frais, aucun engagement de durée.',
    },
    {
      icon: <DatabaseBackup size={24} />,
      color: KZ.greenSoft,
      title: 'Vos données restent à vous',
      desc: "Historique de candidatures et offres publiées restent accessibles même après désabonnement.",
    },
  ]

  return (
    <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-16 border-t border-[#1A1410] relative overflow-hidden" style={{ background: KZ.violetSoft }}>
      <div className="absolute top-[-16px] left-8 opacity-40 hidden lg:block"><Sparkle size={30} color={KZ.violet} /></div>
      <div className="absolute bottom-[-14px] right-10 opacity-40 hidden lg:block"><Soleil size={60} color={KZ.orange} /></div>
      <div className="max-w-[1280px] mx-auto relative z-10">
        <div className="text-center mb-9">
          <h2 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">
            Essayez sans risque.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {ITEMS.map((item) => (
            <div key={item.title} className="kz-card p-5 bg-white flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl border border-[#1A1410] flex items-center justify-center shrink-0 text-[#1A1410]"
                style={{ background: item.color }}
              >
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1410] mb-1">{item.title}</h3>
                <p className="text-xs text-[#6B5A4A] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
