'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Briefcase, Users, MessageCircle, Plus, Calendar, Star, Building2, GraduationCap, BarChart2, User, Bookmark, ClipboardList } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { EmailVerifyBanner } from '@/components/auth/EmailVerifyBanner'
import { PageTransition } from '@/components/quest/PageTransition'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'
import { CompanySwitcher } from '@/components/layout/CompanySwitcher'
import { useAuth } from '@/features/auth/useAuth'
import { FullPageLoader } from '@/components/ui/LogoLoader'
import { BugReportWidget } from '@/components/feedback/BugReportWidget'
import { KZ } from '@/lib/constants'
import './qx-recruteur.css'

const NAV_ITEMS: NavItem[] = [
  { href: '/recruteur/tableau-de-bord',    label: 'Tableau de bord', icon: <LayoutDashboard size={16} /> },
  { href: '/recruteur/offres',         label: 'Mes offres',       icon: <Briefcase size={16} /> },
  { href: '/recruteur/stages',       label: 'Stages',           icon: <ClipboardList size={16} /> },
  { href: '/recruteur/formations',     label: 'Formations',       icon: <GraduationCap size={16} /> },
  { href: '/recruteur/candidatures', label: 'Candidatures',     icon: <Users size={16} /> },
  { href: '/recruteur/vivier',  label: 'Vivier de talents', icon: <Bookmark size={16} /> },
  { href: '/recruteur/statistiques',    label: 'Analytics',        icon: <BarChart2 size={16} /> },
  { href: '/recruteur/entretiens',       label: 'Agenda',           icon: <Calendar size={16} /> },
  { href: '/recruteur/evenements',       label: 'KazaEvents',       icon: <Star size={16} /> },
  { href: '/recruteur/entreprise',      label: 'Mon entreprise',   icon: <Building2 size={16} /> },
  { href: '/recruteur/messages',     label: 'Messages',         icon: <MessageCircle size={16} /> },
  { href: '/recruteur/profil',      label: 'Mon profil',       icon: <User size={16} /> },
]

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, authChecked } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [company, setCompany] = useState<{ name: string; logo_url: string | null } | null>(null)

  useEffect(() => {
    if (!profile?.company_id) return
    fetch(`/api/companies/${profile.company_id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.company) setCompany(d.company) })
      .catch(() => {})
  }, [profile?.company_id])

  useEffect(() => {
    if (!authChecked) return
    if (!profile) { router.push('/connexion'); return }
    if (profile.role === 'candidate') router.push('/candidat/tableau-de-bord')
    if (profile.role === 'admin')     router.push('/admin/tableau-de-bord')
  }, [profile, authChecked, router])

  if (!authChecked || loading || !profile) {
    return <FullPageLoader />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: KZ.cream }}>
      <TopBar
        searchPlaceholder="Rechercher un candidat..."
        onMenuClick={() => setSidebarOpen(true)}
      />
      {profile.email_verified === false && (
        <EmailVerifyBanner email={profile.email} detail="Elle est nécessaire pour publier vos offres." />
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          title={company?.name ?? 'Recruteur'}
          items={NAV_ITEMS}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          footer={
            <div className="flex flex-col gap-2">
              {/* Sélecteur d'entreprise (multi-structures) */}
              <CompanySwitcher />
              {/* Utilisateur connecté */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--kz-line)]" style={{ background: KZ.cream2 }}>
                <div className="w-7 h-7 rounded-full border border-[var(--kz-edge)] flex items-center justify-center text-[10px] font-extrabold shrink-0"
                  style={{ background: KZ.violetSoft, color: KZ.violet }}>
                  {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[var(--kz-ink)] truncate">{profile?.full_name}</span>
              </div>
              {/* CTA nouvelle offre */}
              <a
                href="/recruteur/offres/nouvelle"
                className="flex items-center justify-center gap-2 p-3 font-bold text-sm transition-all rounded-xl uppercase tracking-[0.08em] text-white border border-[#F0ABFC]/60 bg-[linear-gradient(120deg,#7C3AED,#A855F7_45%,#E879F9)] shadow-[0_0_22px_-4px_rgba(232,121,249,0.75)] hover:-translate-y-0.5"
              >
                <Plus size={16} />
                Nouvelle offre
              </a>
            </div>
          }
        />
        <main className="qxr-scope flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      {/* Signalement de bug */}
      <BugReportWidget />
    </div>
  )
}
