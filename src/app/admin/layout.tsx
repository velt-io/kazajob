'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Briefcase, Building2, Shield, Star, Bell, BookOpen, BarChart2, Sparkles, CreditCard, HardDrive, Activity, Bug, Ticket, CalendarClock, Rocket, Tag, ClipboardList, Radio } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'
import { useAuth } from '@/features/auth/useAuth'
import { FullPageLoader } from '@/components/ui/LogoLoader'
import { KZ } from '@/lib/constants'
import '../recruiter/os-recruiter.css'

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard',      label: 'Dashboard',        icon: <LayoutDashboard size={16} /> },
  { href: '/admin/analytics',      label: 'Analytics',        icon: <BarChart2 size={16} /> },
  { href: '/admin/traffic',        label: 'Trafic',           icon: <Activity size={16} /> },
  { href: '/admin/users',          label: 'Utilisateurs',     icon: <Users size={16} /> },
  { href: '/admin/jobs',           label: 'Offres',           icon: <Briefcase size={16} /> },
  { href: '/admin/stages',         label: 'Stages',           icon: <ClipboardList size={16} /> },
  { href: '/admin/companies',      label: 'Entreprises',      icon: <Building2 size={16} /> },
  { href: '/admin/events',         label: 'KazaEvents',       icon: <Star size={16} /> },
  { href: '/admin/notifications',  label: 'Notifications',    icon: <Bell size={16} /> },
  { href: '/admin/skills',         label: 'Compétences',      icon: <BookOpen size={16} /> },
  { href: '/admin/ai',             label: 'KazaIA Stats',     icon: <Sparkles size={16} /> },
  { href: '/admin/plans',          label: 'Forfaits',         icon: <Tag size={16} /> },
  { href: '/admin/subscriptions',  label: 'Abonnements',      icon: <CreditCard size={16} /> },
  { href: '/admin/launch',         label: 'Lancement',        icon: <Rocket size={16} /> },
  { href: '/admin/promos',         label: 'Codes promo',      icon: <Ticket size={16} /> },
  { href: '/admin/demo',           label: 'Démos / RDV',      icon: <CalendarClock size={16} /> },
  { href: '/admin/bug-reports',    label: 'Signalements',     icon: <Bug size={16} /> },
  { href: '/admin/backup',         label: 'Sauvegarde',       icon: <HardDrive size={16} /> },
  { href: '/admin/settings/tracking', label: 'Tracking & Ads', icon: <Radio size={16} /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [profile, loading, router])

  if (loading || !profile) {
    return <FullPageLoader />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: KZ.cream }}>
      <TopBar
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          title="Administration"
          items={NAV_ITEMS}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          footer={
            <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
              <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-black shrink-0 bg-[linear-gradient(145deg,var(--kz-yellow),var(--kz-orange))]">
                <Shield size={15} />
              </span>
              <div className="min-w-0">
                <span className="block text-[13px] font-semibold text-[var(--kz-ink)] truncate">Super Admin</span>
                <span className="block text-[11px] text-[var(--kz-mute)] truncate">{profile.full_name}</span>
              </div>
            </div>
          }
        />
        <main className="osr-scope flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
