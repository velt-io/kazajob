'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/layout/Logo'
import { KZ } from '@/lib/constants'

function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(token ? '' : 'Lien incomplet. Ouvre le lien reçu par email, ou refais une demande.')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setError(data.error ?? 'Une erreur est survenue. Réessaie dans un instant.')
      else setDone(true)
    } catch {
      setError('Connexion impossible. Vérifie ton réseau et réessaie.')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="w-14 h-14 mx-auto mb-4 rounded-2xl border border-[var(--kz-edge)] flex items-center justify-center" style={{ background: KZ.greenSoft }}>
          <ShieldCheck size={26} className="text-[var(--kz-ink)]" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-[var(--kz-ink)]">Mot de passe modifié</h1>
        <p className="text-sm text-[var(--kz-mute)] leading-relaxed mb-6">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
        <Link href="/auth/login">
          <Button kind="primary" size="lg" full iconRight={<ArrowRight size={16} />}>Me connecter</Button>
        </Link>
      </div>
    )
  }

  const toggle = (
    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--kz-mute)] hover:text-[var(--kz-ink)]"
      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-[var(--kz-ink)]">Nouveau mot de passe</h1>
      <p className="text-sm text-[var(--kz-mute)] mb-6">Choisis un mot de passe d&apos;au moins 8 caractères.</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}{' '}
          {!token || error.includes('expiré') ? (
            <Link href="/auth/forgot-password" className="font-bold underline">Refaire une demande</Link>
          ) : null}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nouveau mot de passe" type={showPassword ? 'text' : 'password'} value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" icon={<Lock size={16} />}
          suffix={toggle} autoComplete="new-password" required disabled={!token} />
        <Input label="Confirme le mot de passe" type={showPassword ? 'text' : 'password'} value={confirm}
          onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" icon={<Lock size={16} />}
          autoComplete="new-password" required disabled={!token} />
        <Button kind="primary" size="lg" full iconRight={<ArrowRight size={16} />} loading={loading} type="submit" disabled={!token}>
          Enregistrer
        </Button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10" style={{ background: KZ.cream }}>
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8"><Logo size={36} /></div>
        <div className="rounded-2xl border-[1.5px] border-[var(--kz-edge)] bg-[var(--kz-paper)] p-6 sm:p-8" style={{ boxShadow: '6px 6px 0 var(--kz-shadow)' }}>
          <Suspense><ResetPasswordForm /></Suspense>
        </div>
        <p className="text-center text-xs text-[var(--kz-mute)] mt-6">
          <Link href="/auth/login" className="hover:text-[var(--kz-orange)] font-semibold">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
