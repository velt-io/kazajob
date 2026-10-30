import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Laptop, ShoppingBag, HardHat, TreePalm, Stethoscope, GraduationCap, Calculator, Megaphone, Sprout, Truck, Building2 } from 'lucide-react'
import { KZ } from '@/lib/constants'

// Libellés = valeurs exactes de JOB_SECTORS (filtre ?sector= de la recherche d'offres)
const SECTORS = [
  { sector: 'Tourisme & Hôtellerie',          icon: TreePalm,      color: KZ.orangeSoft },
  { sector: 'BTP & Construction',             icon: HardHat,       color: KZ.yellowSoft },
  { sector: 'Commerce & Vente',               icon: ShoppingBag,   color: KZ.violetSoft },
  { sector: 'Santé & Social',                 icon: Stethoscope,   color: KZ.greenSoft  },
  { sector: 'Transport & Logistique',         icon: Truck,         color: KZ.blueSoft   },
  { sector: 'Informatique & Tech',            icon: Laptop,        color: KZ.violetSoft },
  { sector: 'Agriculture & Agroalimentaire',  icon: Sprout,        color: KZ.greenSoft  },
  { sector: 'Éducation & Formation',          icon: GraduationCap, color: KZ.yellowSoft },
  { sector: 'Finance & Comptabilité',         icon: Calculator,    color: KZ.blueSoft   },
  { sector: 'Marketing & Communication',      icon: Megaphone,     color: KZ.orangeSoft },
  { sector: 'Administration & Juridique',     icon: Building2,     color: KZ.cream2     },
]

const COPY = {
  candidat: {
    eyebrow: 'Tous les métiers du 974',
    title: <>Du chantier à l&apos;hôtel,<br />ton prochain job est ici.</>,
    text: 'Hôtellerie, BTP, commerce, santé, logistique… Kazajob rassemble les offres de toute l’île, de Saint-Denis à Saint-Pierre. Choisis ton secteur et découvre qui recrute.',
    image: '/assets/img/scenes/metiers-btp-commerce.webp',
    alt: 'Un ouvrier du BTP et une commerçante réunionnais au bord du lagon',
    cta: { href: '/candidate/jobs', label: 'Voir toutes les offres' },
  },
  entreprise: {
    eyebrow: 'Tous secteurs, toute l’île',
    title: <>Les talents qu&apos;il vous faut,<br />quel que soit votre métier.</>,
    text: 'Hôtel à Saint-Gilles, chantier au Port, commerce à Saint-Pierre : Kazajob réunit des candidats locaux, disponibles et motivés, dans tous les secteurs qui font vivre La Réunion.',
    image: '/assets/img/scenes/metiers-hotellerie-livraison.webp',
    alt: 'Une hôtesse et un livreur réunionnais dans une rue créole',
    cta: { href: '/auth/register?role=recruiter', label: 'Publier une offre' },
  },
} as const

export function SectorsSection({ variant }: { variant: 'candidat' | 'entreprise' }) {
  const c = COPY[variant]
  const accent = variant === 'candidat' ? KZ.orange : KZ.violet

  return (
    <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-20 border-t border-[#1A1410]" style={{ background: KZ.cream }}>
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div className="relative order-2 lg:order-1">
          <div className="relative rounded-2xl border-[1.5px] border-[#1A1410] overflow-hidden aspect-[16/10]"
            style={{ boxShadow: '6px 6px 0 #1A1410' }}>
            <Image src={c.image} alt={c.alt} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-4 -right-2 sm:right-6 px-4 py-2.5 rounded-xl border-[1.5px] border-[#1A1410] text-sm font-extrabold rotate-[-3deg]"
            style={{ background: KZ.yellow, boxShadow: '3px 3px 0 #1A1410', color: KZ.ink }}>
            {SECTORS.length} secteurs · 24 communes
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="kz-eyebrow mb-2" style={{ color: accent }}>{c.eyebrow}</p>
          <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight leading-tight text-[#1A1410] mb-4">{c.title}</h2>
          <p className="text-sm lg:text-base leading-relaxed text-[#2A2018] mb-6 max-w-[540px]">{c.text}</p>

          <div className="flex flex-wrap gap-2 mb-7">
            {SECTORS.map(({ sector, icon: Icon, color }) => {
              const chip = (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1A1410] text-xs font-bold text-[#1A1410] transition-transform hover:-translate-y-0.5"
                  style={{ background: color }}>
                  <Icon size={13} /> {sector}
                </span>
              )
              return variant === 'candidat'
                ? <Link key={sector} href={`/candidate/jobs?sector=${encodeURIComponent(sector)}`}>{chip}</Link>
                : <span key={sector}>{chip}</span>
            })}
          </div>

          <Link href={c.cta.href}
            className="inline-flex items-center gap-2 text-sm font-extrabold border-b-2 pb-0.5 transition-colors hover:opacity-80"
            style={{ color: KZ.ink, borderColor: accent }}>
            {c.cta.label} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}
