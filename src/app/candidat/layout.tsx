'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import { PageTransition } from '@/components/quest/PageTransition'
// Styles propres aux pages candidat (thème Quest : primes, parchemins, sceaux…)
import './qx-candidat.css'

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
              /* ── HUD du héros (mode quête) ── */
              <div className="qx-panel overflow-hidden">
                <Link href="/candidat/quetes" className="block px-3 pt-3 pb-2 rounded-t-[18px] hover:bg-[rgba(232,121,249,0.06)] transition-colors" aria-label={`Niveau ${level.level}, ${level.title} — ouvrir mon aventure`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span aria-hidden className="w-7 h-7 rounded-md rotate-45 grid place-items-center shrink-0 bg-[linear-gradient(135deg,#FDE68A,#FACC15,#F59E0B)] shadow-[0_0_12px_rgba(250,204,21,0.6)]">
                        <span className="-rotate-45 text-[11px] font-bold text-[#1A0B2E]">{level.level}</span>
                      </span>
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--kz-mute)]">Niveau</div>
                        <div className="text-[12px] font-bold leading-none text-white truncate font-[family-name:var(--font-epic)]">{level.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" title="Série de connexions">
                      <Flame size={11} className="text-[#FB923C]" fill="#FB923C" aria-hidden />
                      <span className="text-[10px] font-bold text-[#FDBA74]">{profile.streak ?? 0}j</span>
                    </div>
                  </div>
                  {/* Barre d'XP */}
                  <div className="qx-xp h-[7px]"><span style={{ width: `${Math.max(gami.xpProgress, 3)}%` }} /></div>
                  <div className="flex items-center justify-between text-[9px] mt-1.5">
                    <span className="font-bold text-[var(--qx-gold)]">{(profile.xp ?? 0).toLocaleString('fr-FR')} XP</span>
                    <span className="text-[var(--kz-mute)]">{gami.xpProgress} %</span>
                  </div>
                </Link>
                <button
                  onClick={() => gami.toggle()}
                  className="w-full px-3 py-1.5 text-[10px] font-bold border-t border-[#C084FC]/20 flex items-center justify-center gap-1 text-[var(--kz-mute)] hover:text-white hover:bg-[rgba(168,85,247,0.1)] transition-colors"
                >
                  <Gamepad2 size={10} aria-hidden /> Désactiver le mode quête
                </button>
              </div>
            ) : (
              /* ── Footer normal ── */
              <div className="flex flex-col gap-2">
                <div className="qx-panel p-3.5 flex gap-2.5 items-center">
                  <div className="flex-1">
                    <div className="text-xs font-bold mb-0.5 text-white">Boost IA</div>
                    <div className="text-[10px] text-[var(--kz-mute)]">Niveau {Math.floor((profile.xp ?? 0) / 1000) + 1}</div>
                  </div>
                  <Sparkles size={18} className="text-[var(--qx-magenta)]" aria-hidden />
                </div>
                <button
                  onClick={() => gami.toggle()}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-[#E879F9]/45 text-[11px] font-bold text-[#F5D0FE] bg-[rgba(232,121,249,0.1)] hover:bg-[rgba(232,121,249,0.2)] hover:shadow-[0_0_18px_-6px_rgba(232,121,249,0.9)] transition-all"
                >
                  <Gamepad2 size={12} aria-hidden /> Mode Quête
                </button>
              </div>
            )
          }
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      {/* KazaIA flottant */}
      <ChatAssistantDrawer />
      {/* Signalement de bug (empilé au-dessus du chat) */}
      <BugReportWidget stacked />
    </div>
  )
}
