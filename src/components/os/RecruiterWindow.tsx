import { Sparkles, MapPin, Star, MessageCircle, CalendarDays } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { AvatarConfig } from '@/lib/avatar'

/**
 * Fenêtre macOS illustrant l'espace recruteur (exemple illustratif, données fictives) :
 * liste des candidatures triées par KazaIA + fiche du candidat sélectionné.
 */
const base = { hairColor: '2c1b18', eyes: 'happy', eyebrow: 'defaultNatural', mouth: 'smile', accessories: 'blank', facialHair: 'blank' } as const
const PEOPLE: { name: string; role: string; city: string; score: number; config: AvatarConfig }[] = [
  { name: 'Maëva L.', role: 'Réceptionniste', city: 'Saint-Paul',   score: 94, config: { ...base, skinColor: 'd08b5b', top: 'curvy',      clothes: 'blazerAndShirt',   clothesColor: 'ff488e' } },
  { name: 'Yanis P.', role: 'Réceptionniste', city: 'Saint-Pierre', score: 88, config: { ...base, skinColor: 'ae5d29', top: 'theCaesar',  clothes: 'shirtVNeck',       clothesColor: '5199e4' } },
  { name: 'Anaïs T.', role: 'Réceptionniste', city: 'Saint-Denis',  score: 81, config: { ...base, skinColor: 'f8d25c', top: 'bob',        clothes: 'collarAndSweater', clothesColor: 'ffffff' } },
  { name: 'Kévin R.', role: 'Réceptionniste', city: 'Le Port',      score: 72, config: { ...base, skinColor: '614335', top: 'shortCurly', clothes: 'hoodie',           clothesColor: '3c4f5c' } },
]

export function RecruiterWindow({ className = '' }: { className?: string }) {
  const sel = PEOPLE[0]
  return (
    <div data-tilt className={`relative rounded-[22px] os-glass overflow-hidden shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)] text-left ${className}`}>
      {/* Barre de titre */}
      <div className="flex items-center gap-2 px-4 h-10 border-b border-white/[0.06] bg-white/[0.03]">
        <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
        <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        <span className="mx-auto text-[11px] font-medium text-[var(--kz-mute)] -translate-x-6 truncate">Réceptionniste (H/F) — 24 candidatures</span>
      </div>

      <div className="grid grid-cols-[1fr] sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* Liste */}
        <div className="p-2 sm:border-r border-white/[0.06]">
          <div className="flex items-center gap-1.5 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#BF5AF2]">
            <Sparkles size={12} /> Trié par KazaIA
          </div>
          {PEOPLE.map((p, i) => (
            <div key={p.name} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl ${i === 0 ? 'bg-[#0A84FF]' : ''}`}>
              <Avatar name={p.name} avatarConfig={p.config} size={34} color="rgba(255,255,255,0.12)" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white truncate">{p.name}</div>
                <div className={`text-[11px] truncate ${i === 0 ? 'text-white/80' : 'text-[var(--kz-mute)]'}`}>{p.city}</div>
              </div>
              <span className={`text-[12px] font-semibold tabular-nums ${i === 0 ? 'text-white' : 'text-[var(--kz-text)]'}`}>{p.score}%</span>
            </div>
          ))}
        </div>

        {/* Fiche */}
        <div className="hidden sm:flex flex-col p-4 gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={sel.name} avatarConfig={sel.config} size={52} color="rgba(255,255,255,0.12)" />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-white">{sel.name}</div>
              <div className="text-[12px] text-[var(--kz-mute)] flex items-center gap-1"><MapPin size={11} />{sel.city} · dispo. immédiate</div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/[0.06] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[var(--kz-mute)]">Compatibilité</span>
              <span className="text-[13px] font-semibold os-text-aurora">{sel.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${sel.score}%`, background: 'linear-gradient(90deg,#FF9F0A,#FF375F,#BF5AF2)' }} />
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {['Accueil client', 'Anglais', 'Réservation'].map((s) => (
                <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.08] text-[var(--kz-text)]">{s}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#FFD60A]">
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={12} fill="currentColor" />)}
            <span className="text-[11px] text-[var(--kz-mute)] ml-1">KazaScore 4,8</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <span className="flex items-center justify-center gap-1.5 h-8 rounded-full bg-white/[0.08] text-[12px] font-semibold text-white"><MessageCircle size={13} />Message</span>
            <span className="flex items-center justify-center gap-1.5 h-8 rounded-full bg-white text-[12px] font-semibold text-black"><CalendarDays size={13} />Entretien</span>
          </div>
        </div>
      </div>
    </div>
  )
}
