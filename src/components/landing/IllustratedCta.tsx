import type { ReactNode } from 'react'

/**
 * Thème « OS 2027 » : appel à l'action posé sur un « fond d'écran » dégradé
 * (façon iOS), contenu dans une feuille de verre. La prop `image` de la DA
 * cartoon est conservée pour compatibilité mais n'est plus affichée.
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
      {/* Fond d'écran */}
      <div aria-hidden className="absolute inset-0 bg-[#050507]" />
      <div aria-hidden className="absolute -top-1/3 -left-1/4 w-[70%] aspect-square rounded-full bg-[#BF5AF2] opacity-40 blur-[120px]" />
      <div aria-hidden className="absolute -bottom-1/3 -right-1/4 w-[70%] aspect-square rounded-full bg-[#FF9F0A] opacity-30 blur-[120px]" />
      <div aria-hidden className="absolute top-1/4 right-1/4 w-[40%] aspect-square rounded-full bg-[#0A84FF] opacity-25 blur-[120px]" />

      <div className="relative max-w-[720px] mx-auto text-center rounded-[36px] os-glass !bg-[rgba(20,20,26,0.55)] px-6 py-12 sm:px-12 sm:py-14 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]">
        {eyebrow && <div className="mb-5 flex justify-center">{eyebrow}</div>}
        <h2 className="text-[38px] sm:text-[56px] lg:text-[68px] font-semibold tracking-[-0.055em] leading-[0.98] text-white mb-5">
          {title}
        </h2>
        {text && <p className="text-[15px] sm:text-[17px] text-[var(--kz-mute)] mb-8 max-w-[520px] mx-auto leading-relaxed">{text}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">{actions}</div>
        {footnote && <p className="text-xs text-[var(--kz-mute)] mt-6">{footnote}</p>}
      </div>
    </section>
  )
}
