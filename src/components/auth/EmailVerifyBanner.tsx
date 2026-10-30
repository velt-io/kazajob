'use client'

import { useState } from 'react'
import { MailWarning, Check } from 'lucide-react'
import { KZ } from '@/lib/constants'

/** Bandeau affiché tant que l'adresse email n'est pas confirmée, avec renvoi du lien. */
export function EmailVerifyBanner({ email, detail }: { email: string; detail?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const resend = async () => {
    setState('sending')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setMessage(data.error ?? 'Envoi impossible. Réessaie plus tard.'); setState('error'); return }
      if (data.alreadyVerified) { window.location.reload(); return }
      setState('sent')
    } catch {
      setMessage('Connexion impossible. Réessaie plus tard.')
      setState('error')
    }
  }

  return (
    <div className="px-4 py-2.5 border-b border-[var(--kz-edge)] flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm"
      style={{ background: KZ.yellowSoft }} role="status">
      <MailWarning size={16} className="shrink-0 text-[var(--kz-ink)]" />
      <span className="flex-1 min-w-[200px] text-[var(--kz-ink)]">
        Confirme ton adresse <strong className="break-all">{email}</strong> via le lien reçu par email.
        {detail && <> {detail}</>}
      </span>
      {state === 'sent' ? (
        <span className="flex items-center gap-1 text-xs font-bold text-[var(--kz-ink)]"><Check size={14} color={KZ.green} />Email renvoyé</span>
      ) : (
        <button onClick={resend} disabled={state === 'sending'}
          className="text-xs font-bold underline whitespace-nowrap disabled:opacity-60" style={{ color: KZ.ink }}>
          {state === 'sending' ? 'Envoi…' : 'Renvoyer le lien'}
        </button>
      )}
      {state === 'error' && <span className="w-full text-xs text-red-700">{message}</span>}
    </div>
  )
}
