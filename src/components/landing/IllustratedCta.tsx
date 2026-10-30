import type { ReactNode } from 'react'

/**
 * Thème Quest : appel à l'action dans un « portail » arcanique (anneaux néon,
 * nébuleuse). La prop `image` de la DA cartoon est conservée mais non affichée.
 */
export function IllustratedCta({
  eyebrow, title, text, actions, footnote, id,
}: {
  image?: string
  alt?: string
  eyebrow?: ReactNode
  title: ReactNode
  text?: ReactNode
  actions: ReactNode
  footnote?: ReactNode
  id?: string
}) {
  return (
    <section id={id} className="relative overflow-hidden px-4 sm:px-8 py-20 lg:py-32">
      {/* Portail */}
      <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] max-w-[140vw] aspect-square rounded-full border border-[#C084FC]/25 animate-spin-slow" style={{ boxShadow: '0 0 80px -10px rgba(168,85,247,0.6), inset 0 0 120px -20px rgba(232,121,249,0.4)' }} />
      <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] max-w-[110vw] aspect-square rounded-full border-2 border-dashed border-[#FACC15]/20 animate-spin-slow [animation-direction:reverse]" />
      <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] aspect-square rounded-full bg-[radial-gradient(closest-side,rgba(232,121,249,0.35),rgba(124,58,237,0.15),transparent)] blur-2xl" />

      <div className="relative max-w-[720px] mx-auto text-center qx-panel px-6 py-12 sm:px-12 sm:py-14">
        {eyebrow && <div className="mb-5 flex justify-center">{eyebrow}</div>}
        <h2 className="text-[34px] sm:text-[48px] lg:text-[58px] font-bold leading-[1.02] text-white mb-5 qx-glow-text">
          {title}
        </h2>
        {text && <p className="text-[15px] sm:text-[17px] text-[var(--kz-text)] mb-8 max-w-[520px] mx-auto leading-relaxed">{text}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">{actions}</div>
        {footnote && <p className="text-xs text-[var(--kz-mute)] mt-6">{footnote}</p>}
      </div>
    </section>
  )
}
