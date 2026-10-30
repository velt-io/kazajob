import Link from 'next/link'
import { ArrowRight, Laptop, ShoppingBag, HardHat, TreePalm, Stethoscope, GraduationCap, Calculator, Megaphone, Sprout, Truck, Building2 } from 'lucide-react'

// Libellés = valeurs exactes de JOB_SECTORS (filtre ?sector= de la recherche d'offres).
// Thème « OS 2027 » : chaque secteur devient une icône d'application (squircle dégradé).
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
        {/* « Écran d'accueil » des secteurs */}
        <div className="order-2 lg:order-1 relative">
          <div aria-hidden className="absolute -inset-6 bg-[radial-gradient(closest-side,rgba(10,132,255,0.22),transparent)] blur-2xl" />
          <div data-tilt className="relative rounded-[40px] os-glass p-6 sm:p-8 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)]">
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-x-3 gap-y-5 sm:gap-x-6 sm:gap-y-7">
              {SECTORS.map(({ sector, short, icon: Icon, g }) => {
                const icon = (
                  <span className="group flex flex-col items-center gap-1.5">
                    <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[18px] flex items-center justify-center text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.25)] transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                      style={{ background: `linear-gradient(145deg, ${g[0]}, ${g[1]})` }}>
                      <Icon size={26} strokeWidth={2} />
                    </span>
                    <span className="text-[11px] font-medium text-[var(--kz-text)] text-center leading-tight truncate max-w-full">{short}</span>
                  </span>
                )
                return variant === 'candidat'
                  ? <Link key={sector} href={`/candidate/jobs?sector=${encodeURIComponent(sector)}`} aria-label={`Offres ${sector}`}>{icon}</Link>
                  : <span key={sector}>{icon}</span>
              })}
              {/* Dossier « + » */}
              <span className="flex flex-col items-center gap-1.5">
                <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-[16px] sm:rounded-[18px] grid grid-cols-2 gap-1 p-2.5 bg-white/[0.1] border border-white/10">
                  {[0, 1, 2, 3].map((i) => <span key={i} className="rounded-[5px] bg-white/25" />)}
                </span>
                <span className="text-[11px] font-medium text-[var(--kz-mute)]">24 communes</span>
              </span>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="kz-eyebrow mb-3 text-[var(--kz-mute)]">{c.eyebrow}</p>
          <h2 className="text-[32px] lg:text-[48px] font-semibold tracking-[-0.045em] leading-[1.04] text-white mb-5">{c.title}</h2>
          <p className="text-[15px] lg:text-[17px] leading-relaxed text-[var(--kz-mute)] mb-8 max-w-[520px]">{c.text}</p>
          <Link href={c.cta.href}
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0A84FF] hover:brightness-125 transition">
            {c.cta.label} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
