'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Map as MapIcon, LayoutDashboard, Search, Heart, Briefcase, MessageCircle, User, Sparkles, Calendar, Settings, Star, Users, Flame, Gamepad2, GraduationCap, Compass } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'
import { NavLanding } from '@/components/layout/NavLanding'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/features/auth/useAuth'
import { FullPageLoader } from '@/components/ui/LogoLoader'
import { ChatAssistantDrawer } from '@/components/ui/ChatAssistantDrawer'
import { EmailVerifyBanner } from '@/components/auth/EmailVerifyBanner'
import { BugReportWidget } from '@/components/feedback/BugReportWidget'
import { useGamification, getLevel } from '@/features/gamification/useGamification'
import { KZ } from '@/lib/constants'

const NAV_ITEMS: NavItem[] = [
  { href: '/candidat/tableau-de-bord',    label: 'QG du héros',      icon: <LayoutDashboard size={16} /> },
  { href: '/candidat/quetes',       label: 'Mon aventure',     icon: <MapIcon size={16} /> },
  { href: '/candidat/offres',         label: 'Offres d\'emploi', icon: <Search size={16} /> },
  { href: '/candidat/formations',     label: 'Formations',       icon: <GraduationCap size={16} /> },
  { href: '/candidat/favoris',    label: 'Favoris',          icon: <Heart size={16} /> },
  { href: '/candidat/candidatures', label: 'Candidatures',    icon: <Briefcase size={16} /> },
  { href: '/candidat/messages',     label: 'Messages',        icon: <MessageCircle size={16} /> },
  { href: '/candidat/entretiens',       label: 'Entretiens',      icon: <Calendar size={16} /> },
  { href: '/candidat/evenements',       label: 'KazaEvents',      icon: <Star size={16} /> },
  { href: '/candidat/ia',           label: 'KazaIA',          icon: <Sparkles size={16} /> },
  { href: '/candidat/coach',        label: 'KazaCoach',       icon: <Compass size={16} /> },
  { href: '/candidat/profil',      label: 'Mon profil',      icon: <User size={16} /> },
  { href: '/candidat/parrainage',     label: 'Parrainage',      icon: <Users size={16} /> },
  { href: '/candidat/parametres',     label: 'Paramètres',      icon: <Settings size={16} /> },
]

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, authChecked } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const gami = useGamification(profile, 0, 0)  // counts approx — dashboard a les vrais
  const level = getLevel(profile?.xp ?? 0)

  // Pages publiques (offres + formations) : accessibles sans connexion (SEO + visiteurs).
  const isPublicPath = ['/candidat/offres', '/candidat/formations'].some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  useEffect(() => {
    if (!authChecked) return
    if (!profile) { if (!isPublicPath) router.push('/connexion'); return }
    if (profile.role === 'recruiter') router.push('/recruteur/tableau-de-bord')
    if (profile.role === 'admin')     router.push('/admin/tableau-de-bord')
  }, [profile, authChecked, router, isPublicPath])

  if (!authChecked || loading) {
    return <FullPageLoader />
  }

  // Visiteur non connecté sur une page publique → coquille publique (nav + footer).
  if (!profile) {
    if (isPublicPath) {
      return (
        <div className="min-h-screen flex flex-col" style={{ background: KZ.cream }}>
          <NavLanding />
          <main className="flex-1 px-4 sm:px-8 lg:px-12 py-6">{children}</main>
          <Footer />
        </div>
      )
    }
    return <FullPageLoader />  // redirection vers login en cours
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: KZ.cream }}>
      <TopBar
        searchPlaceholder="Metier, entreprise, ville..."
        onMenuClick={() => setSidebarOpen(true)}
      />
      {profile.email_verified === false && <EmailVerifyBanner email={profile.email} />}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          title="Candidat"
          items={NAV_ITEMS}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          footer={
            gami.enabled ? (
              /* ── HUD Gamification ── */
              <div
                className="rounded-xl border-2 border-[var(--kz-edge)] overflow-hidden"
                style={{ background: 'var(--kz-inverse)', boxShadow: '3px 3px 0 ' + level.color }}
              >
                <div className="px-3 pt-3 pb-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{level.emoji}</span>
                      <div>
                        <div className="text-[9px] font-bold opacity-50 uppercase tracking-widest" style={{ color: KZ.onInverse }}>NIVEAU</div>
                        <div className="text-[11px] font-extrabold leading-none" style={{ color: level.color }}>{level.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame size={11} color={KZ.yellow} fill={KZ.yellow} />
                      <span className="text-[10px] font-bold" style={{ color: KZ.yellow }}>{profile.streak ?? 0}j</span>
                    </div>
                  </div>
                  {/* Mini XP bar */}
                  <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${gami.xpProgress}%`, background: level.color }}
                    />
                  </div>
                  <div className="text-[9px] opacity-50 text-center pb-1" style={{ color: KZ.onInverse }}>
                    {(profile.xp ?? 0).toLocaleString('fr-FR')} XP
                  </div>
                </div>
                <button
                  onClick={() => gami.toggle()}
                  className="w-full px-3 py-1.5 text-[10px] font-bold border-t border-white/10 flex items-center justify-center gap-1 hover:bg-white/5 transition-colors"
                  style={{ color: 'rgba(255,247,238,0.5)' }}
                >
                  <Gamepad2 size={10} /> Désactiver le mode quête
                </button>
              </div>
            ) : (
              /* ── Footer normal ── */
              <div className="flex flex-col gap-2">
                <div
                  className="p-3.5 rounded-xl border border-[var(--kz-edge)] flex gap-2.5 items-center"
                  style={{ background: KZ.violet, color: KZ.onInverse, boxShadow: '3px 3px 0 var(--kz-shadow)' }}
                >
                  <div className="flex-1">
                    <div className="text-xs font-bold mb-0.5">Boost IA</div>
                    <div className="text-[10px] opacity-80">Niveau {Math.floor((profile.xp ?? 0) / 1000) + 1}</div>
                  </div>
                  <Sparkles size={18} />
                </div>
                <button
                  onClick={() => gami.toggle()}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-[var(--kz-edge)] text-[11px] font-bold transition-all hover:shadow-[2px_2px_0_var(--kz-shadow)]"
                  style={{ background: KZ.violetSoft, color: KZ.violet }}
                >
                  <Gamepad2 size={12} /> Mode Quête
                </button>
              </div>
            )
          }
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      {/* KazaIA flottant */}
      <ChatAssistantDrawer />
      {/* Signalement de bug (empilé au-dessus du chat) */}
      <BugReportWidget stacked />
    </div>
  )
}
