import Link from 'next/link'
import { EyeOff, Palette, BadgeCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { KZ } from '@/lib/constants'
import type { AvatarConfig } from '@/lib/avatar'

// Personnages d'exemple — diversité de La Réunion (rendus localement, aucune photo)
const CAST: { name: string; job: string; bg: string; config: AvatarConfig }[] = [
  { name: 'Aide-soignante', job: 'Santé',      bg: KZ.greenSoft,  config: { skinColor: 'ae5d29', top: 'bun',               hairColor: '2c1b18', eyes: 'happy',   eyebrow: 'defaultNatural',       mouth: 'smile',   clothes: 'shirtVNeck',       clothesColor: 'a7ffc4', accessories: 'blank',          facialHair: 'blank' } },
  { name: 'Chef de chantier', job: 'BTP',      bg: KZ.yellowSoft, config: { skinColor: 'd08b5b', top: 'shortFlat',         hairColor: '2c1b18', eyes: 'default', eyebrow: 'flatNatural',          mouth: 'smile',   clothes: 'overall',          clothesColor: 'ffffb1', accessories: 'blank',          facialHair: 'beardLight' } },
  { name: 'Développeuse',   job: 'Tech',       bg: KZ.violetSoft, config: { skinColor: 'f8d25c', top: 'straight02',        hairColor: '2c1b18', eyes: 'happy',   eyebrow: 'raisedExcitedNatural', mouth: 'twinkle', clothes: 'hoodie',           clothesColor: '3c4f5c', accessories: 'round',          facialHair: 'blank' } },
  { name: 'Réceptionniste', job: 'Hôtellerie', bg: KZ.orangeSoft, config: { skinColor: '614335', top: 'fro',               hairColor: '2c1b18', eyes: 'happy',   eyebrow: 'defaultNatural',       mouth: 'smile',   clothes: 'blazerAndShirt',   clothesColor: 'ff488e', accessories: 'blank',          facialHair: 'blank' } },
  { name: 'Comptable',      job: 'Finance',    bg: KZ.blueSoft,   config: { skinColor: 'edb98a', top: 'hijab',             hairColor: '2c1b18', eyes: 'default', eyebrow: 'defaultNatural',       mouth: 'smile',   clothes: 'blazerAndSweater', clothesColor: '5199e4', accessories: 'prescription02', facialHair: 'blank' } },
  { name: 'Livreur',        job: 'Logistique', bg: KZ.cream2,     config: { skinColor: 'fd9841', top: 'dreads01',          hairColor: '4a312c', eyes: 'wink',    eyebrow: 'defaultNatural',       mouth: 'smile',   clothes: 'shirtCrewNeck',    clothesColor: '65c9ff', accessories: 'blank',          facialHair: 'blank' } },
]

const POINTS = [
  { icon: EyeOff,     color: KZ.violetSoft, title: 'Sans photo, sans a priori', desc: 'Le recruteur découvre d’abord tes compétences, pas ton visage.' },
  { icon: Palette,    color: KZ.orangeSoft, title: 'Un perso qui te ressemble', desc: 'Peau, coiffure, tenue, lunettes… plus de 20 coiffures, des centaines de combinaisons.' },
  { icon: BadgeCheck, color: KZ.greenSoft,  title: 'Un profil qui se démarque', desc: 'Ton personnage te suit partout : profil, candidatures, messagerie.' },
]

export function AvatarShowcaseSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-20 border-t border-[var(--kz-edge)] relative overflow-hidden" style={{ background: 'radial-gradient(80% 120% at 0% 0%, rgba(168,85,247,0.35), transparent 60%), radial-gradient(70% 100% at 100% 100%, rgba(232,121,249,0.22), transparent 60%), #0E0619' }}>
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-center">
        <div>
          <p className="kz-eyebrow mb-2" style={{ color: KZ.yellow }}>Ton perso Kazajob</p>
          <h2 className="text-3xl lg:text-[44px] font-extrabold tracking-tight leading-[1.05] text-white mb-4">
            Postule avec ton talent,<br />
            <span style={{ color: KZ.yellow }}>pas avec ta photo.</span>
          </h2>
          <p className="text-sm lg:text-base leading-relaxed text-white/80 mb-7 max-w-[500px]">
            Crée ton personnage en 1 minute. Il te représente auprès des recruteurs :
            on juge ce que tu sais faire, pas ton apparence.
          </p>

          <div className="flex flex-col gap-3 mb-8">
            {POINTS.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex gap-3 items-start">
                <span className="w-9 h-9 rounded-lg border border-[var(--kz-edge)] flex items-center justify-center shrink-0 text-[var(--kz-ink)]" style={{ background: color }}>
                  <Icon size={17} />
                </span>
                <div>
                  <div className="text-sm font-bold text-white">{title}</div>
                  <div className="text-xs text-white/70 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/auth/register">
            <Button kind="primary" size="lg" iconRight={<ArrowRight size={15} />}>Créer mon perso — gratuit</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:gap-4">
          {CAST.map((p, i) => (
            <div key={p.name}
              className="kz-card p-4 flex flex-col items-center text-center bg-[var(--kz-paper)] transition-transform hover:-translate-y-1"
              style={{ transform: `rotate(${[-2, 1.5, -1, 2, -1.5, 1][i]}deg)` }}>
              <Avatar name={p.name} avatarConfig={p.config} size={88} color={p.bg} />
              <div className="text-xs font-extrabold text-[var(--kz-ink)] mt-3 leading-tight">{p.name}</div>
              <div className="text-[10px] font-semibold text-[var(--kz-mute)] uppercase tracking-wider mt-0.5">{p.job}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
