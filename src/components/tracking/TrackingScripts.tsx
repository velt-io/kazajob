'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { matchesRouteScope, renderIntegrationScripts } from '@/lib/tracking'
import { readConsent, CONSENT_EVENT, type ConsentState } from '@/lib/consent'
import type { TrackingIntegration } from '@/lib/types'

export function TrackingScripts({ integrations }: { integrations: TrackingIntegration[] }) {
  const pathname = usePathname()
  const [consent, setConsent] = useState<ConsentState | null>(null)

  useEffect(() => {
    setConsent(readConsent())
    const handler = (e: Event) => setConsent((e as CustomEvent<ConsentState>).detail)
    window.addEventListener(CONSENT_EVENT, handler)
    return () => window.removeEventListener(CONSENT_EVENT, handler)
  }, [])

  if (!consent) return null

  const eligible = integrations.filter((i) => {
    if (i.consent_category !== 'necessary' && !consent[i.consent_category]) return false
    return matchesRouteScope(i, pathname)
  })

  // La dédoublonnage repose sur l'id stable de next/script — pas de bookkeeping manuel côté rendu.
  const scripts = eligible.flatMap(renderIntegrationScripts)

  return (
    <>
      {scripts.map((s) => (
        <Script key={s.id} id={`tracking-${s.id}`} strategy="afterInteractive" src={s.src}>
          {s.content}
        </Script>
      ))}
    </>
  )
}
