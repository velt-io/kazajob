import type { ReactNode } from 'react'
import { Sparkles, Swords, Crown } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

/**
 * Panneau « portail » des pages connexion / inscription (thème Quest) :
 * anneaux arcaniques animés, titre épique et récompenses à venir.
 */
export function PortalPanel({ eyebrow, title, text }: { eyebrow: string; title: ReactNode; text: string }) {
  return (
    <div className="hidden md:flex relative overflow-hidden flex-col p-8 lg:p-10 border-r border-[#C084FC]/20"
      style={{ background: 'radial-gradient(90% 70% at 50% 45%, #3B0764 0%, #1A0B2E 55%, #0B0614 100%)' }}>
      {/* Portail */}
      <div aria-hidden className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[520px] aspect-square rounded-full border border-[#C084FC]/30 animate-spin-slow" style={{ boxShadow: '0 0 90px -10px rgba(168,85,247,0.7), inset 0 0 120px -20px rgba(232,121,249,0.5)' }} />
      <div aria-hidden className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[380px] aspect-square rounded-full border-2 border-dashed border-[#FACC15]/25 animate-spin-slow [animation-direction:reverse]" />
      <div aria-hidden className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[260px] aspect-square rounded-full bg-[radial-gradient(closest-side,rgba(232,121,249,0.55),rgba(124,58,237,0.2),transparent)] blur-xl" />

      <div className="relative z-10"><Logo size={30} href="/" /></div>

      <div className="relative z-10 mt-auto text-white">
        <p className="kz-eyebrow text-[var(--qx-gold)] mb-3">{eyebrow}</p>
        <h1 className="text-[44px] lg:text-[58px] font-bold leading-[0.98] mb-4">{title}</h1>
        <p className="text-[15px] text-[var(--kz-text)] max-w-[380px] leading-relaxed mb-6">{text}</p>
        <div className="flex flex-wrap gap-2">
          {[
            { icon: <Sparkles size={13} />, label: '+50 XP à la création du héros', c: '#C084FC' },
            { icon: <Swords size={13} />, label: '9 chapitres jusqu’au trésor', c: '#22D3EE' },
            { icon: <Crown size={13} />, label: 'Récompense légendaire : ton job', c: '#FACC15' },
          ].map((b) => (
            <span key={b.label} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-bold"
              style={{ color: b.c, borderColor: `color-mix(in srgb, ${b.c} 45%, transparent)`, background: `color-mix(in srgb, ${b.c} 10%, transparent)` }}>
              {b.icon}{b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
