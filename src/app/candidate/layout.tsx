'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Heart, Briefcase, MessageCircle, User, Sparkles, Calendar, Settings, Star, Users, Flame, Gamepad2, GraduationCap, Compass } from 'lucide-react'
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
import { ActivityRings, RING_COLORS } from '@/components/os/ActivityRings'

const NAV_ITEMS: NavItem[] = [
  { href: '/candidate/dashboard',    label: 'Tableau de bord', icon: <LayoutDashboard size={16} /> },
  { href: '/candidate/jobs',         label: 'Offres d\'emploi', icon: <Search size={16} /> },
  { href: '/candidate/training',     label: 'Formations',       icon: <GraduationCap size={16} /> },
  { href: '/candidate/favorites',    label: 'Favoris',          icon: <Heart size={16} /> },
  { href: '/candidate/applications', label: 'Candidatures',    icon: <Briefcase size={16} /> },
  { href: '/candidate/messages',     label: 'Messages',        icon: <MessageCircle size={16} /> },
  { href: '/candidate/agenda',       label: 'Entretiens',      icon: <Calendar size={16} /> },
  { href: '/candidate/events',       label: 'KazaEvents',      icon: <Star size={16} /> },
  { href: '/candidate/ia',           label: 'KazaIA',          icon: <Sparkles size={16} /> },
  { href: '/candidate/coach',        label: 'KazaCoach',       icon: <Compass size={16} /> },
  { href: '/candidate/profile',      label: 'Mon profil',      icon: <User size={16} /> },
  { href: '/candidate/referral',     label: 'Parrainage',      icon: <Users size={16} /> },
  { href: '/candidate/settings',     label: 'Paramètres',      icon: <Settings size={16} /> },
]

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, authChecked } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const gami = useGamification(profile, 0, 0)  // counts approx — dashboard a les vrais
  const level = getLevel(profile?.xp ?? 0)
  // Anneau « Profil » : part des éléments clés renseignés
  const profileCompletion = profile
    ? Math.round(([profile.location, profile.bio, profile.phone, profile.cv_url || profile.cv_data, profile.avatar_config || profile.avatar_url, profile.video_pitch_url]
        .filter(Boolean).length / 6) * 100)
    : 0

  // Pages publiques (offres + formations) : accessibles sans connexion (SEO + visiteurs).
  const isPublicPath = ['/candidate/jobs', '/candidate/training'].some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  useEffect(() => {
    if (!authChecked) return
    if (!profile) { if (!isPublicPath) router.push('/auth/login'); return }
    if (profile.role === 'recruiter') router.push('/recruiter/dashboard')
    if (profile.role === 'admin')     router.push('/admin/dashboard')
  }, [profile, authChecked, router, isPublicPath])

  if (!authChecked || loading) {
    return <FullPageLoader />
  }

  // Visiteur non connecté sur une page publique → coquille publique (nav + footer).
  if (!profile) {
    if (isPublicPath) {
      return (
        <div className="min-h-screen flex flex-col" >
          <NavLanding />
          <main className="flex-1 px-4 sm:px-8 lg:px-12 py-6">{children}</main>
          <Footer />
        </div>
      )
    }
    return <FullPageLoader />  // redirection vers login en cours
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" >
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
              /* ── Anneaux d'activité (gamification OS 2027) ── */
              <div className="rounded-[20px] os-glass !bg-white/[0.05] p-3">
                <div className="flex items-center gap-3">
                  <ActivityRings size={64} stroke={8} gap={2} rings={[
                    { value: gami.xpProgress, ...RING_COLORS.move, label: 'Niveau' },
                    { value: Math.min(100, ((profile.streak ?? 0) / 7) * 100), ...RING_COLORS.exercise, label: 'Série' },
                    { value: profileCompletion, ...RING_COLORS.stand, label: 'Profil' },
                  ]} />
                  <div className="min-w-0 flex-1 text-[11px] leading-[1.35]">
                    <div className="font-semibold text-white truncate">{level.emoji} {level.title}</div>
                    <div className="text-[#FA114F] font-semibold">{(profile.xp ?? 0).toLocaleString('fr-FR')} XP</div>
                    <div className="text-[#92E82A] font-semibold flex items-center gap-1"><Flame size={10} />{profile.streak ?? 0} j de série</div>
                    <div className="text-[#1EEAEF] font-semibold">Profil {profileCompletion} %</div>
                  </div>
                </div>
                <button
                  onClick={() => gami.toggle()}
                  className="w-full mt-2.5 pt-2 text-[10px] font-medium border-t border-white/[0.06] flex items-center justify-center gap-1 text-[var(--kz-mute)] hover:text-white transition-colors"
                >
                  <Gamepad2 size={10} /> Masquer les anneaux
                </button>
              </div>
            ) : (
              <button
                onClick={() => gami.toggle()}
                className="flex items-center justify-center gap-1.5 h-9 rounded-full bg-white/[0.07] hover:bg-white/[0.12] text-[11px] font-semibold text-[var(--kz-text)] transition-colors"
              >
                <Gamepad2 size={12} /> Afficher mes anneaux
              </button>
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
