'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/layout/Logo'
import { KZ } from '@/lib/constants'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Une erreur est survenue. Réessaie dans un instant.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Connexion impossible. Vérifie ton réseau et réessaie.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10" style={{ background: KZ.cream }}>
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8"><Logo size={36} /></div>

        <div className="rounded-2xl border-[1.5px] border-[#1A1410] bg-white p-6 sm:p-8" style={{ boxShadow: '6px 6px 0 #1A1410' }}>
          {sent ? (
            <div className="text-center">
              <span className="w-14 h-14 mx-auto mb-4 rounded-2xl border border-[#1A1410] flex items-center justify-center" style={{ background: KZ.greenSoft }}>
                <MailCheck size={26} className="text-[#1A1410]" />
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-[#1A1410]">Vérifie ta boîte mail</h1>
              <p className="text-sm text-[#6B5A4A] leading-relaxed mb-6">
                Si un compte existe pour <strong className="text-[#1A1410]">{email}</strong>, tu vas recevoir un lien pour choisir un nouveau mot de passe. Il est valable 1 heure.
                Pense à regarder dans tes spams.
              </p>
              <Link href="/auth/login">
                <Button kind="primary" size="lg" full>Retour à la connexion</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-[#1A1410]">Mot de passe oublié ?</h1>
              <p className="text-sm text-[#6B5A4A] mb-6">
                Indique l&apos;email de ton compte, on t&apos;envoie un lien pour en choisir un nouveau.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marie@email.re" icon={<Mail size={16} />} required autoFocus />
                <Button kind="primary" size="lg" full iconRight={<ArrowRight size={16} />} loading={loading} type="submit">
                  Recevoir le lien
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#6B5A4A] mt-6">
          <Link href="/auth/login" className="hover:text-[#FF6B35] font-semibold">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
