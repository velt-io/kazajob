'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, User, Sparkles, Building2, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Logo } from './Logo'
import { KZ } from '@/lib/constants'
import { useAuth } from '@/features/auth/useAuth'

type View = 'candidat' | 'entreprise'

const LINKS: Record<View, { href: string; label: string }[]> = {
  candidat: [
    { href: '/candidat/offres',     label: 'Offres' },
    { href: '/stages',             label: 'Stages' },
    { href: '/candidat/formations', label: 'Formations' },
    { href: '#comment',            label: 'Comment ça marche' },
    { href: '#faq',                label: 'FAQ' },
  ],
  entreprise: [
    { href: '#tarifs-pro',     label: 'Tarifs' },
    { href: '/candidat/offres', label: 'Voir les offres' },
  ],
}

function ViewToggle({ view, onNavigate }: { view: View; onNavigate?: () => void }) {
  const router = useRouter()
  const [active, setActive] = useState<View>(view)

  useEffect(() => { setActive(view) }, [view])

  useEffect(() => {
    router.prefetch('/')
    router.prefetch('/entreprise')
  }, [router])

  const go = (v: View) => {
    if (active === v) return
    setActive(v)
    onNavigate?.()
    router.push(v === 'candidat' ? '/' : '/entreprise')
  }

  return (
    // Contrôle segmenté façon iOS : la pastille active glisse d'un segment à l'autre.
    <div className="relative inline-grid grid-cols-2 items-center p-[3px] rounded-xl bg-[rgba(12,5,24,0.8)] border border-[#C084FC]/30 shrink-0">
      <span
        aria-hidden
        className="absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)] rounded-lg bg-[linear-gradient(120deg,#7C3AED,#C026D3)] shadow-[0_0_16px_-4px_rgba(232,121,249,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ transform: active === 'entreprise' ? 'translateX(100%)' : 'translateX(0)' }}
      />
      <button
        onClick={() => go('candidat')}
        className="relative z-10 flex items-center justify-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-full text-[11px] lg:text-xs font-semibold transition-colors duration-200"
        style={{ color: active === 'candidat' ? '#fff' : KZ.mute }}
      >
        <Users size={12} />
        <span className="hidden md:inline">Je cherche un emploi</span><span className="md:hidden">Emploi</span>
      </button>
      <button
        onClick={() => go('entreprise')}
        className="relative z-10 flex items-center justify-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-full text-[11px] lg:text-xs font-semibold transition-colors duration-200"
        style={{ color: active === 'entreprise' ? '#fff' : KZ.mute }}
      >
        <Building2 size={12} />
        <span className="hidden md:inline">Je recrute</span><span className="md:hidden">Recruter</span>
      </button>
    </div>
  )
}

export function NavLanding({ view = 'candidat' }: { view?: View }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const links = LINKS[view]
  const isPro = view === 'entreprise'

  const handleSignOut = async () => {
    await signOut()
    setProfileOpen(false)
    router.push('/')
    router.refresh()
  }

  const dashboardPath = profile?.role === 'recruiter'
    ? '/recruteur/tableau-de-bord'
    : profile?.role === 'admin'
      ? '/admin/tableau-de-bord'
      : '/candidat/tableau-de-bord'
  const profilePath = profile?.role === 'recruiter' ? '/recruteur/profil' : '/candidat/profil'

  return (
    <header className="h-[60px] lg:h-[64px] px-4 md:px-8 lg:px-10 border-b border-[#C084FC]/20 bg-[rgba(11,6,20,0.82)] backdrop-blur-xl shadow-[0_1px_0_rgba(232,121,249,0.15)] flex items-center gap-4 sticky top-0 z-50">
      <Logo size={28} className="lg:scale-[1.15] origin-left" />

      {/* Nav desktop (audience) */}
      <nav className="hidden lg:flex gap-6 ml-7">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-[13px] font-medium text-[var(--kz-mute)] hover:text-white transition-colors">
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        {/* Toggle audience — à côté des boutons de connexion */}
        <div className="hidden sm:block"><ViewToggle view={view} /></div>

        {profile ? (
          /* ── Connecté : avatar + dropdown ── */
          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-lg bg-[rgba(168,85,247,0.12)] border border-[#C084FC]/30 hover:bg-[rgba(168,85,247,0.22)] transition-colors"
            >
              <Avatar name={profile.full_name} src={profile.avatar_url} avatarConfig={profile.avatar_config} size={28} color={KZ.orangeSoft} />
              <span className="hidden sm:block text-sm font-bold text-[var(--kz-ink)] max-w-[120px] truncate">
                {profile.full_name.split(' ')[0]}
              </span>
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-52 z-40 rounded-2xl qx-panel overflow-hidden qx-rise shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]"
                >
                  <div className="px-4 py-3 border-b border-[var(--kz-line)]" style={{ background: KZ.cream2 }}>
                    <div className="text-xs font-bold text-[var(--kz-ink)] truncate">{profile.full_name}</div>
                    <div className="text-[11px] text-[var(--kz-mute)] truncate">{profile.email}</div>
                  </div>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <Link href={dashboardPath} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--kz-ink)] hover:bg-[var(--kz-cream2)] transition-colors">
                      <LayoutDashboard size={15} className="text-[var(--kz-mute)]" />
                      Mon espace
                    </Link>
                    <Link href={profilePath} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--kz-ink)] hover:bg-[var(--kz-cream2)] transition-colors">
                      <User size={15} className="text-[var(--kz-mute)]" />
                      Mon profil
                    </Link>
                    {profile.role === 'candidate' && (
                      <Link href="/candidat/ia" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[var(--kz-ink)] hover:bg-[var(--kz-cream2)] transition-colors">
                        <Sparkles size={15} color={KZ.violet} />
                        KazaIA
                      </Link>
                    )}
                    <div className="h-px bg-[var(--kz-line)] my-1" />
                    <button onClick={handleSignOut}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut size={15} />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── Non connecté : boutons adaptés à l'audience ── */
          <>
            <Link href="/connexion" className="hidden md:block">
              <Button kind="ghost" size="md">Connexion</Button>
            </Link>
            <Link href={isPro ? '/inscription?role=recruiter' : '/inscription'}>
              <Button kind={isPro ? 'violet' : 'primary'} size="sm" className="lg:!text-sm lg:!h-9" iconRight={<ArrowRight size={14} />}>
                <span className="hidden sm:inline">{isPro ? 'Essai gratuit' : 'Alon comencé'}</span>
                <span className="sm:hidden">{isPro ? 'Essai' : 'S\'inscrire'}</span>
              </Button>
            </Link>
          </>
        )}

        {/* Hamburger mobile */}
        <button onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir le menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-[rgba(168,85,247,0.12)] border border-[#C084FC]/30 hover:bg-[rgba(168,85,247,0.22)]">
          <Menu size={18} />
        </button>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 qx-scrim backdrop-blur-sm z-40 lg:hidden" onClick={() => setDrawerOpen(false)} />
          <div
            className="fixed top-0 right-0 bottom-0 w-[300px] z-50 flex flex-col p-6 lg:hidden qx-panel !rounded-none animate-slide-up"
          >
            <div className="flex justify-between items-center mb-6">
              <Logo size={24} />
              <button onClick={() => setDrawerOpen(false)} aria-label="Fermer le menu" className="w-8 h-8 flex items-center justify-center rounded-lg bg-[rgba(168,85,247,0.12)] border border-[#C084FC]/30 hover:bg-[rgba(168,85,247,0.22)]">
                <X size={16} />
              </button>
            </div>

            {/* Toggle audience dans le drawer */}
            <div className="mb-4"><ViewToggle view={view} onNavigate={() => setDrawerOpen(false)} /></div>

            {profile && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--kz-line)] mb-4" style={{ background: KZ.cream2 }}>
                <Avatar name={profile.full_name} src={profile.avatar_url} avatarConfig={profile.avatar_config} size={36} color={KZ.orangeSoft} />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[var(--kz-ink)] truncate">{profile.full_name}</div>
                  <div className="text-xs text-[var(--kz-mute)] capitalize">{profile.role}</div>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setDrawerOpen(false)}
                  className="px-3 py-3 text-sm font-semibold text-[var(--kz-text)] hover:bg-[var(--kz-cream2)] rounded-lg transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2.5">
              {profile ? (
                <>
                  <Link href={dashboardPath} onClick={() => setDrawerOpen(false)}>
                    <Button kind="outline" size="lg" full icon={<LayoutDashboard size={16} />}>Mon espace</Button>
                  </Link>
                  <Button kind="danger" size="lg" full icon={<LogOut size={16} />} onClick={handleSignOut}>
                    Se déconnecter
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/connexion" onClick={() => setDrawerOpen(false)}>
                    <Button kind="outline" size="lg" full>Connexion</Button>
                  </Link>
                  <Link href={isPro ? '/inscription?role=recruiter' : '/inscription'} onClick={() => setDrawerOpen(false)}>
                    <Button kind={isPro ? 'violet' : 'primary'} size="lg" full>
                      {isPro ? 'Démarrer l\'essai gratuit' : 'Créer mon compte'}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}
