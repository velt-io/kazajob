'use client'

/**
 * Gerbe d'étincelles dorées autour d'un élément (promotion d'un héros,
 * quête publiée…). Ne fait rien si l'utilisateur réduit les animations.
 */
const COLORS = ['#FACC15', '#FDE68A', '#E879F9', '#22D3EE', '#F5EEFF']

export function sparkBurst(el: Element | null | undefined, count = 22) {
  if (!el || typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const r = el.getBoundingClientRect()
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:0;height:0;pointer-events:none;z-index:9999`
  const spread = Math.max(r.width, r.height) * 0.55
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span')
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
    const dist = spread * (0.6 + Math.random() * 0.7)
    const size = 3 + Math.random() * 5
    const color = COLORS[i % COLORS.length]
    p.style.cssText = `position:absolute;left:${-size / 2}px;top:${-size / 2}px;width:${size}px;height:${size}px;border-radius:2px;background:${color};box-shadow:0 0 10px ${color};transform:rotate(45deg)`
    p.animate(
      [
        { transform: 'translate(0,0) rotate(45deg) scale(1.2)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist - 18}px) rotate(260deg) scale(0)`, opacity: 0 },
      ],
      { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(0.2,0.8,0.2,1)', fill: 'forwards' },
    )
    host.appendChild(p)
  }
  document.body.appendChild(host)
  window.setTimeout(() => host.remove(), 1400)
}
