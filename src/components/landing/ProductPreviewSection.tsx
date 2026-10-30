import Link from 'next/link'
import { Sparkles, MessageCircle, CalendarDays, ArrowRight, Briefcase, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { KZ } from '@/lib/constants'
import type { AvatarConfig } from '@/lib/avatar'

type Card = { name: string; city: string; score: number; config: AvatarConfig }

const base: Omit<AvatarConfig, 'skinColor' | 'top' | 'clothes' | 'clothesColor'> = {
  hairColor: '2c1b18', eyes: 'happy', eyebrow: 'defaultNatural', mouth: 'smile', accessories: 'blank', facialHair: 'blank',
}

// Exemple illustratif de l'interface recruteur (mêmes statuts et recommandations que le produit)
const COLUMNS: { title: string; color: string; cards: Card[] }[] = [
  {
    title: 'Nouvelles', color: KZ.cream2,
    cards: [
      { name: 'Maëva L.', city: 'Saint-Paul',   score: 92, config: { ...base, skinColor: 'd08b5b', top: 'curvy',      clothes: 'blazerAndShirt',   clothesColor: 'ff488e' } },
      { name: 'Kévin R.', city: 'Le Port',      score: 74, config: { ...base, skinColor: '614335', top: 'shortCurly', clothes: 'hoodie',           clothesColor: '3c4f5c' } },
    ],
  },
  {
    title: 'Consultés', color: KZ.yellowSoft,
    cards: [
      { name: 'Anaïs T.', city: 'Saint-Denis',  score: 85, config: { ...base, skinColor: 'f8d25c', top: 'bob',        clothes: 'collarAndSweater', clothesColor: 'ffffff' } },
    ],
  },
  {
    title: 'Entretien', color: KZ.greenSoft,
    cards: [
      { name: 'Yanis P.', city: 'Saint-Pierre', score: 88, config: { ...base, skinColor: 'ae5d29', top: 'theCaesar',  clothes: 'shirtVNeck',       clothesColor: '5199e4' } },
    ],
  },
]

function reco(score: number) {
  if (score >= 80) return { label: 'À contacter', bg: KZ.greenSoft, color: KZ.green }
  return { label: 'Profil intéressant', bg: KZ.violetSoft, color: KZ.violet }
}

const FEATURES = [
  { icon: Sparkles,      color: KZ.violetSoft, title: 'Tri intelligent',     desc: 'Chaque candidature reçoit un score et une recommandation claire.' },
  { icon: MessageCircle, color: KZ.orangeSoft, title: 'Messagerie intégrée', desc: 'Échangez avec les candidats sans quitter Kazajob.' },
  { icon: CalendarDays,  color: KZ.greenSoft,  title: 'Agenda d’entretiens', desc: 'Planifiez un entretien : il apparaît aussitôt dans l’agenda du candidat.' },
]

export function ProductPreviewSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-20 border-t border-[var(--kz-edge)] relative overflow-hidden" style={{ background: KZ.cream2 }}>
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-center">
        <div>
          <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Votre espace recruteur</p>
          <h2 className="text-2xl lg:text-[38px] font-extrabold tracking-tight leading-tight text-[var(--kz-ink)] mb-4">
            Toutes vos candidatures,<br />
            <span style={{ color: KZ.violet }}>enfin au même endroit.</span>
          </h2>
          <p className="text-sm lg:text-base leading-relaxed text-[var(--kz-text)] mb-7 max-w-[480px]">
            Publiez une offre en quelques minutes et suivez chaque candidat, de la réception du CV jusqu’à l’embauche.
          </p>
          <div className="flex flex-col gap-4 mb-8">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex gap-3 items-start">
                <span className="w-10 h-10 rounded-xl border border-[var(--kz-edge)] flex items-center justify-center shrink-0 text-[var(--kz-ink)]" style={{ background: color }}>
                  <Icon size={18} />
                </span>
                <div>
                  <div className="text-sm font-bold text-[var(--kz-ink)]">{title}</div>
                  <div className="text-sm text-[var(--kz-mute)]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/auth/register?role=recruiter">
            <Button kind="primary" size="lg" iconRight={<ArrowRight size={15} />}>Publier ma première offre</Button>
          </Link>
        </div>

        {/* Maquette de l'interface */}
        <div className="relative">
          <div className="rounded-2xl border-[1.5px] border-[var(--kz-edge)] bg-[var(--kz-paper)] overflow-hidden" style={{ boxShadow: '8px 8px 0 var(--kz-shadow)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--kz-edge)]" style={{ background: KZ.ink }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: KZ.orange }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: KZ.yellow }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: KZ.green }} />
              <span className="ml-3 text-[11px] font-bold text-white/70 flex items-center gap-1.5 truncate">
                <Briefcase size={12} /> Réceptionniste H/F · Saint-Gilles
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 p-3 sm:p-4" style={{ background: KZ.cream }}>
              {COLUMNS.map((col) => (
                <div key={col.title} className="rounded-xl p-2 min-w-0" style={{ background: col.color }}>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-[var(--kz-ink)] uppercase tracking-wide truncate">{col.title}</span>
                    <span className="text-[10px] font-bold text-[var(--kz-mute)]">{col.cards.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {col.cards.map((c) => {
                      const r = reco(c.score)
                      return (
                        <div key={c.name} className="rounded-lg border border-[var(--kz-edge)] bg-[var(--kz-paper)] p-2" style={{ boxShadow: '2px 2px 0 var(--kz-shadow)' }}>
                          {/* Mobile : carte verticale (colonnes étroites) · ≥ sm : carte horizontale */}
                          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-w-0 text-center sm:text-left">
                            <Avatar name={c.name} avatarConfig={c.config} size={30} color={KZ.cream2} />
                            <div className="min-w-0 max-w-full">
                              <div className="text-[11px] font-bold text-[var(--kz-ink)] truncate">{c.name}</div>
                              <div className="hidden sm:flex text-[9px] text-[var(--kz-mute)] items-center gap-0.5 truncate"><MapPin size={8} />{c.city}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center sm:justify-between gap-1 mt-1.5 sm:mt-2">
                            <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded-full truncate" style={{ background: r.bg, color: r.color }}>{r.label}</span>
                            <span className="text-[11px] font-extrabold" style={{ color: KZ.violet }}>{c.score}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -top-4 -right-1 sm:-right-4 px-3 py-2 rounded-xl border-[1.5px] border-[var(--kz-edge)] text-xs font-extrabold flex items-center gap-1.5 rotate-[4deg]"
            style={{ background: KZ.yellow, boxShadow: '3px 3px 0 var(--kz-shadow)', color: KZ.ink }}>
            <Sparkles size={13} /> Tri par KazaIA
          </div>
          <p className="text-[10px] text-[var(--kz-mute)] mt-4 text-center italic">Exemple d’interface — données fictives</p>
        </div>
      </div>
    </section>
  )
}
