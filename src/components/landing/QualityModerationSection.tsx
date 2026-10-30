import { ShieldCheck, Flag, UserCheck, Eye } from 'lucide-react'
import { KZ } from '@/lib/constants'

const ITEMS = [
  {
    icon: <UserCheck size={22} />,
    color: KZ.violetSoft,
    title: 'Entreprises vérifiées',
    desc: 'Chaque compte recruteur est contrôlé avant publication. Pas de faux profils, pas d\'annonces anonymes non déclarées.',
  },
  {
    icon: <Eye size={22} />,
    color: KZ.orangeSoft,
    title: 'Offres modérées',
    desc: 'Toute offre est vérifiée avant diffusion : mention H/F, contenu conforme au Code du Travail, informations complètes.',
  },
  {
    icon: <Flag size={22} />,
    color: KZ.greenSoft,
    title: 'Signalement actif',
    desc: 'Candidats comme recruteurs peuvent signaler un contenu suspect directement depuis la plateforme. Traitement sous 24h.',
  },
  {
    icon: <ShieldCheck size={22} />,
    color: KZ.yellowSoft,
    title: 'Zéro bot, zéro spam',
    desc: 'Inscription par email vérifié uniquement. Chaque candidature reçue vient d\'une vraie personne, pas d\'un robot d\'envoi massif.',
  },
]

export function QualityModerationSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-20 border-t border-[#1A1410] relative overflow-hidden" style={{ background: KZ.cream }}>
      <div className="max-w-[1280px] mx-auto relative z-10">
        <div className="text-center mb-12">
          <p className="kz-eyebrow mb-2" style={{ color: KZ.green }}>Qualité garantie</p>
          <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[#1A1410] max-w-[720px] mx-auto">
            Une plateforme modérée, pas un mur d&apos;annonces anonymes.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ITEMS.map((item) => (
            <div key={item.title} className="kz-card p-6 bg-white">
              <div
                className="w-12 h-12 rounded-xl border border-[#1A1410] flex items-center justify-center mb-4 text-[#1A1410]"
                style={{ background: item.color }}
              >
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-[#1A1410] mb-2">{item.title}</h3>
              <p className="text-sm text-[#6B5A4A] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
