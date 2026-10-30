'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'
import { readConsent, writeConsent, type ConsentState } from '@/lib/consent'

export function CookieConsent() {
  const [show, setShow] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const saved = readConsent()
    if (!saved) { setShow(true); return }
    setAnalytics(saved.analytics)
    setMarketing(saved.marketing)
  }, [])

  const persist = (state: ConsentState) => {
    writeConsent(state)
    setShow(false)
    setCustomizing(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 sm:p-4" role="dialog" aria-label="Consentement cookies">
      <div
        className="max-w-[760px] mx-auto rounded-2xl border border-[var(--kz-edge)] bg-[var(--kz-paper)] p-4 sm:p-5 flex flex-col gap-4"
        style={{ boxShadow: '4px 4px 0 var(--kz-shadow)' }}
      >
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl border border-[var(--kz-edge)] flex items-center justify-center shrink-0" style={{ background: KZ.yellowSoft }}>
            <Cookie size={16} className="text-[var(--kz-ink)]" />
          </div>
          <p className="text-xs sm:text-sm text-[var(--kz-text)] leading-relaxed">
            Kazajob utilise des <strong>cookies essentiels</strong> au fonctionnement (session de connexion), et,
            avec ton accord, des cookies de mesure d&apos;audience et publicitaires.{' '}
            <Link href="/legal/cookies" className="font-bold underline" style={{ color: KZ.violet }}>En savoir plus</Link>.
          </p>
        </div>

        {customizing && (
          <div className="flex flex-col gap-2 pl-12">
            <label className="flex items-center justify-between gap-3 text-xs sm:text-sm text-[var(--kz-text)]">
              <span>Cookies nécessaires <span className="text-[var(--kz-mute)]">(toujours actifs)</span></span>
              <input type="checkbox" checked disabled className="w-4 h-4" />
            </label>
            <label className="flex items-center justify-between gap-3 text-xs sm:text-sm text-[var(--kz-text)] cursor-pointer">
              <span>Mesure d&apos;audience (Analytics)</span>
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="w-4 h-4" />
            </label>
            <label className="flex items-center justify-between gap-3 text-xs sm:text-sm text-[var(--kz-text)] cursor-pointer">
              <span>Publicité (Marketing)</span>
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="w-4 h-4" />
            </label>
          </div>
        )}

        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          {!customizing && (
            <Button kind="ghost" size="md" onClick={() => setCustomizing(true)}>Personnaliser</Button>
          )}
          <Button kind="outline" size="md" onClick={() => persist({ necessary: true, analytics: false, marketing: false })}>
            Refuser tout
          </Button>
          {customizing ? (
            <Button kind="primary" size="md" onClick={() => persist({ necessary: true, analytics, marketing })}>
              Enregistrer mes choix
            </Button>
          ) : (
            <Button kind="primary" size="md" onClick={() => persist({ necessary: true, analytics: true, marketing: true })}>
              Accepter tout
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
