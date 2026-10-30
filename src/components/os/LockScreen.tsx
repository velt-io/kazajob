import type { ReactNode } from 'react'
import { Briefcase, CalendarCheck, Sparkles } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

/**
 * Panneau « écran verrouillé » des pages de connexion / inscription :
 * fond d'écran dégradé, grande typographie et notifications en verre.
 */
export function LockScreen({ eyebrow, title, text, tint = 'violet' }: {
  eyebrow: string
  title: ReactNode
  text: string
  tint?: 'violet' | 'orange'
}) {
  const wallpaper = tint === 'orange'
    ? 'linear-gradient(160deg, #3B0764 0%, #9D174D 45%, #EA580C 85%, #FBBF24 120%)'
    : 'linear-gradient(160deg, #0B1026 0%, #312E81 40%, #7C3AED 75%, #DB2777 115%)'

  return (
    <div className="hidden md:flex relative overflow-hidden flex-col p-8 lg:p-10" style={{ background: wallpaper }}>
      <div aria-hidden className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#FFD60A] opacity-25 blur-3xl" />
      <div aria-hidden className="absolute -left-24 bottom-0 w-96 h-96 rounded-full bg-[#0A84FF] opacity-30 blur-3xl" />

      <div className="relative z-10"><Logo size={30} href="/" /></div>

      <div className="relative z-10 mt-14 text-white">
        <p className="text-[13px] font-semibold text-white/80 mb-2">{eyebrow}</p>
        <h1 className="text-[52px] lg:text-[72px] font-semibold tracking-[-0.06em] leading-[0.92] mb-5">{title}</h1>
        <p className="text-[15px] text-white/80 max-w-[360px] leading-relaxed">{text}</p>
      </div>

      {/* Pile de notifications */}
      <div className="relative z-10 mt-auto flex flex-col gap-2.5 max-w-[380px]">
        {[
          { icon: <Sparkles size={15} />, bg: '#BF5AF2', app: 'KazaMatch', title: 'Réceptionniste (H/F) · 94 %', time: 'maintenant' },
          { icon: <CalendarCheck size={15} />, bg: '#30D158', app: 'Agenda', title: 'Entretien confirmé jeudi 10:00', time: 'il y a 5 min' },
          { icon: <Briefcase size={15} />, bg: '#FF9F0A', app: 'Offres', title: '12 nouvelles offres à Saint-Denis', time: 'il y a 1 h' },
        ].map((n, i) => (
          <div key={n.app} className="flex items-center gap-3 rounded-[20px] bg-white/[0.16] border border-white/15 backdrop-blur-2xl px-3.5 py-3 os-pop text-white"
            style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: n.bg }}>{n.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-white/75">{n.app}</span>
                <span className="text-[11px] text-white/60 shrink-0">{n.time}</span>
              </div>
              <div className="text-[14px] font-medium truncate">{n.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
