'use client'

import { useEffect } from 'react'

const SPARK_COLORS = ['#FACC15', '#E879F9', '#22D3EE', '#C084FC', '#F5EEFF']

/**
 * Effets « magiques » globaux (thème Quest), un seul jeu d'écouteurs :
 *  - gerbe d'étincelles au clic sur un bouton ou un lien ;
 *  - halo néon qui suit le pointeur sur les panneaux (.qx-panel) ;
 *  - inclinaison 3D des éléments marqués data-tilt.
 * Désactivé si l'utilisateur réduit les animations (étincelles aussi sur tactile).
 */
export function MagicLayer() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const fine = window.matchMedia('(hover: hover)').matches
    let frame = 0
    let tilted: HTMLElement | null = null

    const burst = (x: number, y: number) => {
      const host = document.createElement('div')
      host.setAttribute('aria-hidden', 'true')
      host.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:0;height:0;pointer-events:none;z-index:9999`
      for (let i = 0; i < 12; i++) {
        const p = document.createElement('span')
        const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.4
        const dist = 28 + Math.random() * 34
        const size = 3 + Math.random() * 4
        const color = SPARK_COLORS[i % SPARK_COLORS.length]
        p.style.cssText = `position:absolute;left:${-size / 2}px;top:${-size / 2}px;width:${size}px;height:${size}px;border-radius:2px;background:${color};box-shadow:0 0 8px ${color};transform:rotate(45deg)`
        p.animate(
          [
            { transform: 'translate(0,0) rotate(45deg) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px) rotate(225deg) scale(0)`, opacity: 0 },
          ],
          { duration: 600 + Math.random() * 300, easing: 'cubic-bezier(0.2,0.8,0.2,1)', fill: 'forwards' },
        )
        host.appendChild(p)
      }
      document.body.appendChild(host)
      window.setTimeout(() => host.remove(), 1000)
    }

    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('button, a, [role="tab"], [role="menuitem"]')) burst(e.clientX, e.clientY)
    }

    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const target = e.target as HTMLElement | null
        const panel = target?.closest<HTMLElement>('.qx-panel')
        if (panel) {
          const r = panel.getBoundingClientRect()
          panel.style.setProperty('--mx', `${e.clientX - r.left}px`)
          panel.style.setProperty('--my', `${e.clientY - r.top}px`)
        }
        const tilt = target?.closest<HTMLElement>('[data-tilt]') ?? null
        if (tilted && tilted !== tilt) tilted.style.removeProperty('transform')
        tilted = tilt
        if (tilt) {
          const r = tilt.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          tilt.style.transform = `perspective(800px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg) translateY(-4px)`
        }
      })
    }

    window.addEventListener('pointerdown', onDown, { passive: true })
    if (fine) window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])
  return null
}
