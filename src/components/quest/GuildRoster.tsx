import { Sparkles, Shield, Crown } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { AvatarConfig } from '@/lib/avatar'

/**
 * « Recrutez votre guilde » : candidats présentés comme des fiches de héros
 * (exemple illustratif, données fictives) — vitrine recruteur du thème Quest.
 */
const base = { hairColor: '2c1b18', eyes: 'happy', eyebrow: 'defaultNatural', mouth: 'smile', accessories: 'blank', facialHair: 'blank' } as const
const HEROES: { name: string; klass: string; city: string; level: number; match: number; rarity: 'legendaire' | 'epique' | 'rare'; stats: [string, number][]; config: AvatarConfig }[] = [
  { name: 'Maëva L.', klass: 'Réceptionniste', city: 'Saint-Paul', level: 12, match: 94, rarity: 'legendaire',
    stats: [['Accueil', 92], ['Anglais', 80], ['Rigueur', 74]],
    config: { ...base, skinColor: 'd08b5b', top: 'curvy', clothes: 'blazerAndShirt', clothesColor: 'ff488e' } },
  { name: 'Yanis P.', klass: 'Chef de chantier', city: 'Saint-Pierre', level: 9, match: 88, rarity: 'epique',
    stats: [['Terrain', 90], ['Management', 76], ['Plans', 70]],
    config: { ...base, skinColor: 'ae5d29', top: 'theCaesar', clothes: 'shirtVNeck', clothesColor: '5199e4' } },
  { name: 'Anaïs T.', klass: 'Infirmière', city: 'Saint-Denis', level: 10, match: 81, rarity: 'rare',
    stats: [['Soins', 95], ['Calme', 84], ['Équipe', 78]],
    config: { ...base, skinColor: 'f8d25c', top: 'bob', clothes: 'collarAndSweater', clothesColor: 'ffffff' } },
]

const RARITY = {
  legendaire: { color: '#FACC15', label: 'Légendaire', icon: Crown },
  epique:     { color: '#C084FC', label: 'Épique',     icon: Sparkles },
  rare:       { color: '#22D3EE', label: 'Rare',       icon: Shield },
} as const

export function GuildRoster({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
      {HEROES.map((h, i) => {
        const r = RARITY[h.rarity]
        const Icon = r.icon
        return (
          <div key={h.name} data-tilt className="qx-panel p-4 qx-rise text-left"
            style={{ animationDelay: `${i * 0.12}s`, boxShadow: `0 0 36px -12px ${r.color}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: r.color }}><Icon size={11} />{r.label}</span>
              <span className="text-[11px] font-bold text-white">Niv. {h.level}</span>
            </div>
            <div className="relative mx-auto w-20 h-20 rounded-xl rotate-45 border flex items-center justify-center overflow-hidden mb-3"
              style={{ borderColor: r.color, background: `radial-gradient(circle, color-mix(in srgb, ${r.color} 30%, transparent), transparent 70%)` }}>
              <div className="-rotate-45"><Avatar name={h.name} avatarConfig={h.config} size={62} color="transparent" /></div>
            </div>
            <div className="text-center">
              <div className="text-[15px] font-bold text-white">{h.name}</div>
              <div className="text-[11px] text-[var(--kz-mute)]">{h.klass} · {h.city}</div>
            </div>
            <div className="flex flex-col gap-1.5 mt-3">
              {h.stats.map(([label, v]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-[68px] text-[10px] uppercase tracking-[0.06em] text-[var(--kz-mute)] truncate">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[rgba(168,85,247,0.15)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${v}%`, background: `linear-gradient(90deg, #7C3AED, ${r.color})` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-[#C084FC]/20 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--kz-mute)]">Compatibilité</span>
              <span className="text-[15px] font-bold qx-text-legend">{h.match}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
