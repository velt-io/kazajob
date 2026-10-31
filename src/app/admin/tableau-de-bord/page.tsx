'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Users, Briefcase, Building2, TrendingUp, Star, Bell, BookOpen, BarChart2, Sparkles, Zap, ArrowUpRight, LayoutGrid } from 'lucide-react'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { KZ } from '@/lib/constants'
import {
  ACCENT, CountUp, EmptyPanel, Gauge, Monogram, PageHeader, StatusPill, Widget, accentStyle, tint,
} from '@/components/os/recruiter/primitives'

interface AdminStats {
  users: number
  jobs: number
  companies: number
  applications: number
  candidates: number
  recruiters: number
  admins: number
  events: number
  skills: number
  referrals: number
}

const idx = (i: number) => ({ '--i': i } as CSSProperties)

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    users: 0, jobs: 0, companies: 0, applications: 0,
    candidates: 0, recruiters: 0, admins: 0,
    events: 0, skills: 0, referrals: 0,
  })
  const [recentJobs, setRecentJobs] = useState<Array<{ id: string; title: string; created_at: string; is_active: boolean }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const d = await res.json()
          setStats({
            users: d.users ?? 0, jobs: d.jobs ?? 0, companies: d.companies ?? 0,
            applications: d.applications ?? 0, candidates: d.candidates ?? 0,
            recruiters: d.recruiters ?? 0, admins: d.admins ?? 0,
            events: d.events ?? 0, skills: d.skills ?? 0, referrals: d.referrals ?? 0,
          })
          setRecentJobs((d.recentJobs ?? []) as typeof recentJobs)
        }
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchStats()
  }, [])

  // Distribution réelle des rôles
  const total = stats.users || 1
  const roleDistrib = [
    { label: 'Candidats',   count: stats.candidates, pct: Math.round((stats.candidates / total) * 100), color: KZ.orange },
    { label: 'Recruteurs',  count: stats.recruiters,  pct: Math.round((stats.recruiters / total) * 100),  color: KZ.violet },
    { label: 'Admins',      count: stats.admins,      pct: Math.round((stats.admins / total) * 100),      color: KZ.green },
  ]

  if (loading) return <PageLoader />

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const KPIS = [
    { label: 'Utilisateurs', value: stats.users,        icon: <Users size={15} />,      accent: ACCENT.violet, href: '/admin/utilisateurs' },
    { label: 'Offres',       value: stats.jobs,         icon: <Briefcase size={15} />,  accent: ACCENT.orange, href: '/admin/offres' },
    { label: 'Entreprises',  value: stats.companies,    icon: <Building2 size={15} />,  accent: ACCENT.green,  href: '/admin/entreprises' },
    { label: 'Candidatures', value: stats.applications, icon: <TrendingUp size={15} />, accent: ACCENT.blue,   href: '/admin/statistiques' },
  ]
  const MINOR = [
    { label: 'KazaEvents',  value: stats.events,    icon: <Star size={14} />,     accent: ACCENT.teal },
    { label: 'Compétences', value: stats.skills,    icon: <BookOpen size={14} />, accent: ACCENT.indigo },
    { label: 'Parrainages', value: stats.referrals, icon: <Zap size={14} />,      accent: ACCENT.yellow },
  ]
  const QUICK = [
    { href: '/admin/utilisateurs',         label: 'Utilisateurs', accent: ACCENT.violet, icon: <Users size={18} /> },
    { href: '/admin/offres',          label: 'Modération',   accent: ACCENT.orange, icon: <Briefcase size={18} /> },
    { href: '/admin/entreprises',     label: 'Entreprises',  accent: ACCENT.green,  icon: <Building2 size={18} /> },
    { href: '/admin/evenements',        label: 'KazaEvents',   accent: ACCENT.teal,   icon: <Star size={18} /> },
    { href: '/admin/notifications', label: 'Notifier',     accent: ACCENT.yellow, icon: <Bell size={18} /> },
    { href: '/admin/competences',        label: 'Compétences',  accent: ACCENT.indigo, icon: <BookOpen size={18} /> },
    { href: '/admin/statistiques',     label: 'Analytics',    accent: ACCENT.blue,   icon: <BarChart2 size={18} /> },
    { href: '/admin/ia',            label: 'KazaIA',       accent: ACCENT.pink,   icon: <Sparkles size={18} /> },
  ]

  return (
    <div className="max-w-[1180px] mx-auto">
      <PageHeader
        eyebrow={<span className="capitalize">{today}</span>}
        title={<>Administration <span className="os-text-aurora">Kazajob</span></>}
        subtitle="Vue globale · La Réunion 974"
      />

      {/* KPI principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {KPIS.map((k, i) => (
          <div key={k.label} className="osr-in min-w-0" style={idx(i)}>
            {/* Apparition sur l'enveloppe, inclinaison sur la carte : les deux transformations ne se gênent pas */}
            <Link href={k.href} data-tilt
              className="osr-glow group block h-full rounded-[24px] os-glass p-5 hover:bg-white/[0.07] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]"
              style={accentStyle(k.accent)}>
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white" style={{ background: k.accent }}>{k.icon}</span>
                <ArrowUpRight size={16} className="text-[var(--kz-mute)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[30px] sm:text-[36px] font-semibold tracking-[-0.05em] text-white mt-3 leading-none">
                <CountUp value={k.value} />
              </div>
              <div className="text-[13px] text-[var(--kz-mute)] mt-1.5">{k.label}</div>
            </Link>
          </div>
        ))}
      </div>

      {/* KPI secondaires */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {MINOR.map((k, i) => (
          <div key={k.label} className="osr-in osr-panel flex items-center gap-3 px-4 py-3.5" style={idx(i + 4)}>
            <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: tint(k.accent, 18), color: k.accent }}>{k.icon}</span>
            <span className="flex-1 text-[14px] text-[var(--kz-text)]">{k.label}</span>
            <span className="text-[20px] font-semibold tracking-[-0.03em] text-white"><CountUp value={k.value} /></span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Offres récentes */}
        <Widget title="Offres récentes" sub="Dernières publications" icon={<Briefcase size={14} />} accent={ACCENT.orange}
          href="/admin/offres" linkLabel="Tout voir" bodyClassName="px-2 pb-2">
          {recentJobs.length === 0 ? (
            <EmptyPanel icon={<Briefcase size={24} />} title="Aucune offre" description="Aucune offre publiée pour le moment." accent={ACCENT.orange} className="py-10" />
          ) : (
            <div className="flex flex-col">
              {recentJobs.map((job, i) => (
                <Link key={job.id} href="/admin/offres" className="osr-row osr-in flex items-center gap-3 px-3 py-2.5" style={idx(i)}>
                  <Monogram name={job.title} size={36} radius={11} gradient="linear-gradient(145deg, var(--kz-orange), var(--osr-pink))" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white truncate">{job.title}</div>
                    <div className="osr-sub text-[12px] text-[var(--kz-mute)]">
                      {new Date(job.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <StatusPill accent={job.is_active ? ACCENT.green : ACCENT.mute} live={job.is_active}>
                    {job.is_active ? 'Active' : 'Inactive'}
                  </StatusPill>
                </Link>
              ))}
            </div>
          )}
        </Widget>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Distribution rôles — données réelles */}
          <Widget title="Distribution des rôles" sub={`${stats.users.toLocaleString('fr-FR')} comptes`} icon={<Users size={14} />} accent={ACCENT.violet}>
            {stats.users === 0 ? (
              <p className="text-[13px] text-[var(--kz-mute)] text-center py-4">Aucun utilisateur inscrit.</p>
            ) : (
              <div className="flex items-center gap-5 pt-1">
                <Gauge value={roleDistrib[0].pct} size={92} stroke={10} color={ACCENT.orange} label={`Candidats ${roleDistrib[0].pct} %`}>
                  <span className="block text-[20px] font-semibold text-white tracking-[-0.04em]">{roleDistrib[0].pct}%</span>
                  <span className="block text-[10px] text-[var(--kz-mute)] mt-0.5">candidats</span>
                </Gauge>
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  {roleDistrib.map((r, i) => (
                    <div key={r.label}>
                      <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="text-white font-medium">{r.label} <span className="text-[var(--kz-mute)] font-normal tabular-nums">({r.count})</span></span>
                        <span className="text-[var(--kz-mute)] tabular-nums">{r.pct}%</span>
                      </div>
                      <div className="osr-bar" style={idx(i)}>
                        <span style={{ width: `${r.pct}%`, background: r.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Widget>

          {/* Accès rapides (grille d'apps) */}
          <Widget title="Accès rapides" icon={<LayoutGrid size={14} />} accent={ACCENT.indigo} bodyClassName="px-3 pb-3">
            <div className="grid grid-cols-4 gap-1">
              {QUICK.map((item) => (
                <Link key={item.href} href={item.href}
                  className="group flex flex-col items-center gap-1.5 py-2.5 rounded-2xl hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]">
                  <span className="w-11 h-11 rounded-[13px] flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                    style={{ background: `linear-gradient(145deg, ${item.accent}, ${tint(item.accent, 60)})`, boxShadow: `0 10px 22px -12px ${item.accent}` }}>
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-medium text-[var(--kz-text)] text-center leading-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </Widget>
        </div>
      </div>
    </div>
  )
}
