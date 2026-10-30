import Image from 'next/image'
import type { ReactNode } from 'react'

/**
 * Bandeau d'appel à l'action posé sur une illustration de la DA (cadres tropicaux,
 * coucher de soleil). Le contenu est centré dans une carte pour rester lisible
 * quelle que soit l'image et la largeur d'écran.
 */
export function IllustratedCta({
  image, alt = '', eyebrow, title, text, actions, footnote, id,
}: {
  image: string
  alt?: string
  eyebrow?: ReactNode
  title: ReactNode
  text?: ReactNode
  actions: ReactNode
  footnote?: ReactNode
  id?: string
}) {
  return (
    <section id={id} className="relative overflow-hidden border-t border-[#1A1410] px-4 sm:px-8 py-16 lg:py-28">
      <Image src={image} alt={alt} fill sizes="100vw" className="object-cover" />
      <div className="relative max-w-[680px] mx-auto text-center rounded-2xl border-[1.5px] border-[#1A1410] px-6 py-9 sm:px-10 sm:py-11"
        style={{ background: 'rgba(255,247,238,0.94)', boxShadow: '6px 6px 0 #1A1410' }}>
        {eyebrow && <div className="mb-4 flex justify-center">{eyebrow}</div>}
        <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] font-extrabold tracking-[-0.03em] leading-[1.02] text-[#1A1410] mb-4">
          {title}
        </h2>
        {text && <p className="text-sm sm:text-base lg:text-lg text-[#2A2018] mb-7 max-w-[520px] mx-auto">{text}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">{actions}</div>
        {footnote && <p className="text-xs text-[#6B5A4A] mt-5">{footnote}</p>}
      </div>
    </section>
  )
}
