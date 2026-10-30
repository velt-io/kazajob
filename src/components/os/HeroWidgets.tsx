import { Sparkles, MapPin, CalendarCheck, Bell, Briefcase } from 'lucide-react'
import { ActivityRings, RING_COLORS } from './ActivityRings'

/**
 * Hero « écran d'accueil » : widgets façon iOS illustrant le parcours candidat
 * (exemple illustratif, données fictives).
 */
export function HeroWidgets() {
  return (
    <div className="relative mx-auto w-full max-w-[1040px] text-left">
      {/* Halo */}
      <div aria-hidden className="absolute -inset-x-10 -top-10 bottom-0 bg-[radial-gradient(closest-side,rgba(191,90,242,0.25),transparent)] blur-2xl" />

      <div className="relative grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] md:auto-rows-[170px] gap-3 md:gap-4">
        {/* Widget « Météo de l'emploi » — fond d'écran dégradé */}
        <div className="col-span-2 row-span-2 relative rounded-[28px] overflow-hidden border border-white/10 os-pop shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]" style={{ animationDelay: '0.05s', background: 'linear-gradient(160deg, #1E3A8A 0%, #5B21B6 45%, #DB2777 85%, #F97316 120%)' }}>
          <div aria-hidden className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[#FFD60A] opacity-30 blur-3xl" />
          {/* Silhouette du Piton (simple courbe) */}
          <svg aria-hidden viewBox="0 0 400 160" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 w-full h-[45%] opacity-60">
            <path d="M0 160 L0 120 C 60 110, 110 70, 170 40 C 200 25, 215 25, 240 45 C 290 85, 340 100, 400 110 L400 160 Z" fill="rgba(0,0,0,0.35)" />
            <path d="M0 160 L0 140 C 80 130, 160 120, 260 128 C 320 132, 360 130, 400 125 L400 160 Z" fill="rgba(0,0,0,0.45)" />
          </svg>
          <div className="absolute left-5 top-5 flex items-center gap-1.5 text-white/90 text-xs font-semibold">
            <MapPin size={13} /> Saint-Denis · La Réunion
          </div>
          <div className="absolute left-5 top-11 text-white">
            <div className="text-[64px] md:text-[84px] font-extralight tracking-[-0.06em] leading-none">128</div>
            <div className="text-sm font-medium text-white/85 mt-1">nouvelles offres cette semaine</div>
          </div>
          <div className="absolute left-5 right-5 bottom-5 grid grid-cols-4 gap-2 text-white">
            {[['Lun', 18], ['Mar', 26], ['Mer', 21], ['Jeu', 34]].map(([d, n]) => (
              <div key={d} className="rounded-2xl bg-white/15 backdrop-blur-md px-2 py-2 text-center">
                <div className="text-[11px] text-white/75">{d}</div>
                <div className="text-[15px] font-semibold">+{n}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Match */}
        <div className="col-span-2 md:col-span-2 relative rounded-[28px] os-glass p-5 flex flex-col justify-between os-pop shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#BF5AF2]"><Sparkles size={13} /> KazaMatch</span>
            <span className="text-[11px] text-[var(--kz-mute)]">à l&apos;instant</span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[17px] font-semibold text-white truncate">Réceptionniste (H/F)</div>
              <div className="text-[13px] text-[var(--kz-mute)] truncate">Hôtel Lagon Bleu · Saint-Gilles · CDI</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[40px] font-semibold tracking-[-0.05em] leading-none os-text-aurora">94%</div>
              <div className="text-[11px] text-[var(--kz-mute)]">compatible</div>
            </div>
          </div>
        </div>

        {/* Anneaux */}
        <div className="relative rounded-[28px] os-glass p-4 flex items-center justify-center os-pop shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]" style={{ animationDelay: '0.25s' }}>
          <ActivityRings size={118} stroke={13} rings={[
            { value: 82, ...RING_COLORS.move, label: 'Niveau' },
            { value: 60, ...RING_COLORS.exercise, label: 'Candidatures' },
            { value: 100, ...RING_COLORS.stand, label: 'Profil' },
          ]} />
        </div>

        {/* Notifications */}
        <div className="relative rounded-[28px] os-glass p-3.5 flex flex-col gap-2 justify-center os-pop shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]" style={{ animationDelay: '0.35s' }}>
          {[
            { icon: <CalendarCheck size={14} />, color: '#30D158', title: 'Entretien jeudi', sub: '10:00 · Visio' },
            { icon: <Bell size={14} />, color: '#FF9F0A', title: 'Profil consulté', sub: '3 recruteurs' },
            { icon: <Briefcase size={14} />, color: '#0A84FF', title: 'Nouvelle offre', sub: 'Saint-Pierre' },
          ].map((n) => (
            <div key={n.title} className="flex items-center gap-2.5 rounded-2xl bg-white/[0.06] px-2.5 py-2">
              <span className="w-7 h-7 rounded-[9px] flex items-center justify-center text-white shrink-0" style={{ background: n.color }}>{n.icon}</span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-white truncate">{n.title}</div>
                <div className="text-[11px] text-[var(--kz-mute)] truncate">{n.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="relative text-center text-[11px] text-[var(--kz-mute)] mt-4">Aperçu de l&apos;expérience Kazajob — exemple illustratif</p>
    </div>
  )
}
