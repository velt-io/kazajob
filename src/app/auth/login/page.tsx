'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/layout/Logo'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'
import { PortalPanel } from '@/components/quest/PortalPanel'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await signIn(email, password)
    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    // Redirection selon le rôle réel du compte
    let role: string | undefined
    let companyId: string | null | undefined
    try {
      const res = await fetch('/api/me')
      if (res.ok) { const me = await res.json(); role = me?.role; companyId = me?.company_id }
    } catch { /* fallback ci-dessous */ }
    // Recruteur sans entreprise → tunnel de configuration + paiement (jamais le dashboard).
    window.location.href =
      role === 'admin'      ? '/admin/dashboard'
      : role === 'recruiter' ? (companyId ? '/recruiter/dashboard' : '/recruiter/company-setup')
      : '/candidate/dashboard'
  }

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2" style={{ background: KZ.cream }}>
      {/* Panneau gauche — portail (caché sur mobile) */}
      <PortalPanel
        eyebrow="Retour en jeu"
        title={<>Rebonjour,<br /><span className="qx-text-arcane">marmaille.</span></>}
        text="Ton aventure t'attend là où tu l'as laissée : quêtes en cours, offres sauvegardées, candidatures."
      />

      {/* Panneau droit — formulaire */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 md:px-12 lg:px-16" style={{ background: KZ.cream }}>
        {/* Logo visible uniquement sur mobile */}
        <div className="flex justify-center mb-8 md:hidden">
          <Logo size={36} />
        </div>

        <h2 className="text-2xl lg:text-[28px] font-extrabold tracking-tight mb-2 text-[var(--kz-ink)]">Connecte-toi</h2>
        <p className="text-sm text-[var(--kz-mute)] mb-7">
          Pas encore inscrit ?{' '}
          <Link href="/auth/register" className="font-bold" style={{ color: KZ.orange }}>Créer un compte</Link>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marie@email.re" icon={<Mail size={16} />} required />
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock size={16} />}
            suffix={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--kz-mute)] hover:text-[var(--kz-ink)]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />
          <div className="flex justify-end -mt-1">
            <Link href="/auth/forgot-password" className="text-sm font-semibold" style={{ color: KZ.orange }}>Mot de passe oublié ?</Link>
          </div>
          <Button kind="primary" size="lg" full iconRight={<ArrowRight size={16} />} loading={loading} type="submit">
            Se connecter
          </Button>
        </form>

        <OAuthButtons />

        <p className="text-center text-xs text-[var(--kz-mute)] mt-6">
          <Link href="/" className="hover:text-[var(--kz-orange)] font-semibold">← Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}
