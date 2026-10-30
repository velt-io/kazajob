'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/layout/Logo'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'
import { PortalPanel } from '@/components/quest/PortalPanel'

function RegisterForm() {
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'candidate'

  const [role, setRole] = useState<'candidate' | 'recruiter'>(initialRole)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [launchDays, setLaunchDays] = useState<number | null>(null)
  const { signUp } = useAuth()

  useEffect(() => {
    fetch('/api/launch/public').then(r => r.ok ? r.json() : null).then(d => {
      if (!d?.available || !d.campaignEndsAt) return
      const days = Math.ceil((new Date(d.campaignEndsAt).getTime() - Date.now()) / 86_400_000)
      if (days > 0) setLaunchDays(days)
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Le mot de passe doit faire au moins 8 caracteres.'); return }
    setLoading(true)
    setError('')
    const { error: err } = await signUp(email, password, fullName, role)
    if (err) {
      if (err.includes('fetch') || err.includes('network') || err.includes('Failed')) {
        setError('Connexion impossible au serveur. Vérifie ta connexion internet et réessaie.')
      } else if (err.startsWith('Trop de tentatives')) {
        setError(err)
      } else if (err.includes('already registered') || err.includes('already been registered')) {
        setError('Cet email est déjà utilisé. Connecte-toi ou utilise un autre email.')
      } else if (err.includes('Password')) {
        setError('Le mot de passe doit contenir au moins 8 caractères.')
      } else {
        setError('Une erreur est survenue. Vérifie tes informations et réessaie.')
      }
      setLoading(false)
    } else {
      // Email de bienvenue (fire & forget)
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'welcome', email, fullName, role }),
      }).catch(() => {})
      // Candidats → onboarding | Recruteurs → configuration entreprise + paiement (obligatoire)
      // Navigation par rechargement complet : garantit que la session est lue par le proxy
      // (évite le rebond vers /auth/login juste après l'inscription).
      window.location.href = role === 'recruiter' ? '/recruiter/company-setup' : '/onboarding'
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2" style={{ background: KZ.cream }}>
      {/* Panneau gauche — portail (caché sur mobile) */}
      <PortalPanel
        eyebrow="Nouveau héros · 3 min"
        title={<>Crée ton<br /><span className="qx-text-arcane">héros.</span></>}
        text="Rejoins l'aventure Kazajob et trouve ton prochain job dans le 974. Gratuit, rapide, et beaucoup plus fun."
      />

      {/* Panneau droit */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 md:px-12 lg:px-16" style={{ background: KZ.cream }}>
        {/* Logo mobile */}
        <div className="flex justify-center mb-8 md:hidden">
          <Logo size={36} />
        </div>

        <h2 className="text-2xl lg:text-[28px] font-extrabold tracking-tight mb-2 text-[var(--kz-ink)]">Créer un compte</h2>
        <p className="text-sm text-[var(--kz-mute)] mb-6">
          Deja inscrit ?{' '}
          <Link href="/auth/login" className="font-bold" style={{ color: KZ.orange }}>Se connecter</Link>
        </p>

        {/* Choix du role */}
        <div className="flex gap-2 mb-6 p-1 rounded-xl border border-[var(--kz-edge)]" style={{ background: KZ.paper }}>
          {(['candidate', 'recruiter'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-[1.5px]"
              style={role === r
                ? { background: KZ.inverse, color: KZ.onInverse, borderColor: 'var(--kz-edge)', boxShadow: '2px 2px 0 var(--kz-orange)' }
                : { background: 'transparent', color: KZ.text, borderColor: 'transparent' }}
            >
              {r === 'candidate' ? 'Je cherche' : 'Je recrute'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Marie Hoarau" icon={<User size={16} />} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marie@email.re" icon={<Mail size={16} />} required />
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 caracteres minimum"
            icon={<Lock size={16} />}
            hint="Minimum 8 caracteres"
            suffix={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[var(--kz-mute)] hover:text-[var(--kz-ink)]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            required
          />
          <p className="text-xs text-[var(--kz-mute)] -mt-1">
            En creant un compte tu acceptes nos{' '}
            <span className="font-semibold" style={{ color: KZ.orange }}>CGU</span> et notre{' '}
            <span className="font-semibold" style={{ color: KZ.orange }}>politique de confidentialite</span>.
          </p>
          <Button kind="primary" size="lg" full iconRight={<ArrowRight size={16} />} loading={loading} type="submit">
            {role === 'recruiter' ? 'Créer mon espace recruteur' : 'Créer mon compte — gratuit'}
          </Button>
          {role === 'recruiter' && (
            <p className="text-xs text-center text-[var(--kz-mute)] -mt-1">
              {launchDays
                ? `Phase de lancement — accès gratuit pendant encore ${launchDays} jours · sans carte bancaire.`
                : "Essai 30 jours · carte requise à l'activation · 1er débit après l'essai."
              }
            </p>
          )}
        </form>

        <OAuthButtons role={role} />

        <p className="text-center text-xs text-[var(--kz-mute)] mt-6">
          <Link href="/" className="hover:text-[var(--kz-orange)] font-semibold">← Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
