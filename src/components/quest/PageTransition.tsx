'use client'

import { ViewTransition } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Transition entre pages (View Transitions natives via React) : le contenu
 * sortant se dissout dans un éclat violet, le nouveau se matérialise.
 * La clé change à chaque route : la barre latérale et la barre du haut,
 * hors de ce bloc, restent parfaitement immobiles.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <ViewTransition key={pathname} enter="qx-page-in" exit="qx-page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  )
}
