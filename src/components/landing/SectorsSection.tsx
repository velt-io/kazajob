import Link from 'next/link'
import { ArrowRight, Laptop, ShoppingBag, HardHat, TreePalm, Stethoscope, GraduationCap, Calculator, Megaphone, Sprout, Truck, Building2 } from 'lucide-react'

// Libellés = valeurs exactes de JOB_SECTORS (filtre ?sector= de la recherche d'offres).
// Thème Quest : chaque secteur devient une « classe » de héros (gemme néon).
const SECTORS = [
  { sector: 'Tourisme & Hôtellerie',         short: 'Tourisme',     icon: TreePalm,      g: ['#FF9F0A', '#FF375F'] },
  { sector: 'BTP & Construction',            short: 'BTP',          icon: HardHat,       g: ['#FFD60A', '#FF9F0A'] },
  { sector: 'Commerce & Vente',              short: 'Commerce',     icon: ShoppingBag,   g: ['#FF375F', '#BF5AF2'] },
  { sector: 'Santé & Social',                short: 'Santé',        icon: Stethoscope,   g: ['#30D158', '#00C7BE'] },
  { sector: 'Transport & Logistique',        short: 'Transport',    icon: Truck,         g: ['#0A84FF', '#5E5CE6'] },
  { sector: 'Informatique & Tech',           short: 'Tech',         icon: Laptop,        g: ['#5E5CE6', '#BF5AF2'] },
  { sector: 'Agriculture & Agroalimentaire', short: 'Agriculture',  icon: Sprout,        g: ['#30D158', '#A2E635'] },
  { sector: 'Éducation & Formation',         short: 'Éducation',    icon: GraduationCap, g: ['#64D2FF', '#0A84FF'] },
  { sector: 'Finance & Comptabilité',        short: 'Finance',      icon: Calculator,    g: ['#8E8E93', '#48484A'] },
  { sector: 'Marketing & Communication',     short: 'Marketing',    icon: Megaphone,     g: ['#FF6B8A', '#FF375F'] },
  { sector: 'Administration & Juridique',    short: 'Admin',        icon: Building2,     g: ['#AC8E68', '#7C6A55'] },
] as const

const COPY = {
  candidat: {
    eyebrow: 'Tous les métiers du 974',
    title: <>Du chantier à l&apos;hôtel,<br />ton prochain job est ici.</>,
    text: 'Hôtellerie, BTP, commerce, santé, logistique… Kazajob rassemble les offres de toute l’île, de Saint-Denis à Saint-Pierre. Choisis ton secteur et découvre qui recrute.',
    cta: { href: '/candidate/jobs', label: 'Voir toutes les offres' },
  },
  entreprise: {
    eyebrow: 'Tous secteurs, toute l’île',
    title: <>Les talents qu&apos;il vous faut,<br />quel que soit votre métier.</>,
    text: 'Hôtel à Saint-Gilles, chantier au Port, commerce à Saint-Pierre : Kazajob réunit des candidats locaux, disponibles et motivés, dans tous les secteurs qui font vivre La Réunion.',
    cta: { href: '/auth/register?role=recruiter', label: 'Publier une offre' },
  },
} as const

export function SectorsSection({ variant }: { variant: 'candidat' | 'entreprise' }) {
  const c = COPY[variant]

  return (
    <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-24">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        {/* Sélection de classe */}
        <div className="order-2 lg:order-1 relative">
          <div aria-hidden className="absolute -inset-6 bg-[radial-gradient(closest-side,rgba(168,85,247,0.3),transparent)] blur-2xl" />
          <div className="relative qx-panel p-6 sm:p-8">
            <div className="kz-eyebrow text-[var(--qx-gold)] text-center mb-5">Choisis ta classe</div>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-7">
              {SECTORS.map(({ sector, short, icon: Icon, g }) => {
                const icon = (
                  <span className="group flex flex-col items-center gap-1.5">
                    <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl rotate-45 flex items-center justify-center text-white border border-white/30 shadow-[0_0_20px_-6px_currentColor] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_-2px_rgba(232,121,249,0.9)] group-active:scale-95 [&>svg]:-rotate-45"
                      style={{ background: `linear-gradient(145deg, ${g[0]}, ${g[1]})` }}>
                      <Icon size={26} strokeWidth={2} />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--kz-text)] text-center leading-tight truncate max-w-full mt-2">{short}</span>
                  </span>
                )
                return variant === 'candidat'
                  ? <Link key={sector} href={`/candidate/jobs?sector=${encodeURIComponent(sector)}`} aria-label={`Offres ${sector}`}>{icon}</Link>
                  : <span key={sector}>{icon}</span>
              })}
              {/* Dossier « + » */}
              <span className="flex flex-col items-center gap-1.5">
                <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl rotate-45 grid grid-cols-2 gap-1 p-2.5 bg-[rgba(168,85,247,0.15)] border border-[#C084FC]/40">
                  {[0, 1, 2, 3].map((i) => <span key={i} className="rounded-[3px] bg-[#C084FC]/50" />)}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--kz-mute)] mt-2">24 zones</span>
              </span>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="kz-eyebrow mb-3 text-[var(--qx-neon)]">{c.eyebrow}</p>
          <h2 className="text-[30px] lg:text-[44px] font-bold leading-[1.08] text-white mb-5">{c.title}</h2>
          <p className="text-[15px] lg:text-[17px] leading-relaxed text-[var(--kz-mute)] mb-8 max-w-[520px]">{c.text}</p>
          <Link href={c.cta.href}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.1em] text-[#F0ABFC] hover:text-white transition">
            {c.cta.label} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
