'use client'

import { useEffect } from 'react'

/**
 * Effets de pointeur globaux (thème OS 2027), un seul écouteur pour tout le site :
 *  - lumière qui suit le curseur sur les surfaces en verre (.os-glass) ;
 *  - inclinaison 3D douce des éléments marqués data-tilt.
 * Désactivé pour les écrans tactiles et si l'utilisateur réduit les animations.
 */
export function MotionLayer() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches) return
    let frame = 0
    let tilted: HTMLElement | null = null

    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const target = e.target as HTMLElement | null
        const glass = target?.closest<HTMLElement>('.os-glass')
        if (glass) {
          const r = glass.getBoundingClientRect()
          glass.style.setProperty('--mx', `${e.clientX - r.left}px`)
          glass.style.setProperty('--my', `${e.clientY - r.top}px`)
        }
        const tilt = target?.closest<HTMLElement>('[data-tilt]') ?? null
        if (tilted && tilted !== tilt) tilted.style.removeProperty('transform')
        tilted = tilt
        if (tilt) {
          const r = tilt.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          tilt.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateZ(0)`
        }
      })
    }
    const onLeave = () => { if (tilted) tilted.style.removeProperty('transform'); tilted = null }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(frame)
    }
  }, [])
  return null
}
