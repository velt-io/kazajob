'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Briefcase, Building2, TrendingUp, Star, Bell, BookOpen, BarChart2, Sparkles, Zap, Castle, ScrollText, Compass, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { QuestHeader, PanelTitle, Sigil, toneStyle } from '@/components/quest/recruteur/QuestChrome'
import { TrophyStat } from '@/components/quest/recruteur/TrophyStat'

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
    { label: 'Candidats',   count: stats.candidates, pct: Math.round((stats.candidates / total) * 100), color: 'var(--qx-cyan)' },
    { label: 'Recruteurs',  count: stats.recruiters,  pct: Math.round((stats.recruiters / total) * 100),  color: 'var(--qx-neon)' },
    { label: 'Admins',      count: stats.admins,      pct: Math.round((stats.admins / total) * 100),      color: 'var(--qx-gold)' },
  ]

  if (loading) return <PageLoader />

  const QUICK = [
    { href: '/admin/utilisateurs',  label: 'Gérer les utilisateurs',  tone: 'var(--qx-neon)',    icon: <Users size={14} /> },
    { href: '/admin/offres',        label: 'Modérer les offres',      tone: 'var(--kz-orange)',  icon: <Briefcase size={14} /> },
    { href: '/admin/entreprises',   label: 'Valider les entreprises', tone: 'var(--kz-green)',   icon: <Building2 size={14} /> },
    { href: '/admin/evenements',    label: 'Gérer KazaEvents',        tone: 'var(--qx-cyan)',    icon: <Star size={14} /> },
    { href: '/admin/notifications', label: 'Envoyer une notification', tone: 'var(--qx-gold)',   icon: <Bell size={14} /> },
    { href: '/admin/competences',   label: 'Référentiel compétences', tone: '#A3A3B8',           icon: <BookOpen size={14} /> },
    { href: '/admin/statistiques',  label: 'Analytics & rapports',    tone: 'var(--qx-neon)',    icon: <BarChart2 size={14} /> },
    { href: '/admin/ia',            label: 'KazaIA — Statistiques',   tone: 'var(--qx-magenta)', icon: <Sparkles size={14} /> },
  ]

  return (
    <div className="max-w-[1180px] mx-auto">
      <QuestHeader
        eyebrow="Administration · Vue globale"
        icon={<Castle size={18} />}
        tone="var(--qx-gold)"
        title={<>La <span className="qx-text-legend">Citadelle</span></>}
        subtitle="Kazajob La Réunion 974 — l'état du royaume en un coup d'œil."
      />

      {/* KPI — ligne 1 */}
      <section aria-label="Indicateurs principaux" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <TrophyStat label="Utilisateurs"  value={stats.users.toLocaleString('fr-FR')}        tone="var(--qx-neon)"    icon={<Users size={14} />} />
        <TrophyStat label="Offres"        value={stats.jobs.toLocaleString('fr-FR')}         tone="var(--kz-orange)"  icon={<Briefcase size={14} />} delay={0.05} />
        <TrophyStat label="Entreprises"   value={stats.companies.toLocaleString('fr-FR')}    tone="var(--kz-green)"   icon={<Building2 size={14} />} delay={0.1} />
        <TrophyStat label="Candidatures"  value={stats.applications.toLocaleString('fr-FR')} tone="var(--qx-gold)"    icon={<TrendingUp size={14} />} delay={0.15} />
      </section>
      {/* KPI — ligne 2 */}
      <section aria-label="Indicateurs secondaires" className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'KazaEvents',  value: stats.events,    tone: 'var(--qx-cyan)',    icon: <Star size={13} /> },
          { label: 'Compétences', value: stats.skills,    tone: '#A3A3B8',           icon: <BookOpen size={13} /> },
          { label: 'Parrainages', value: stats.referrals, tone: 'var(--qx-magenta)', icon: <Zap size={13} /> },
        ].map((k, i) => (
          <div key={k.label} className="qx-panel px-4 py-3 flex items-center gap-3 qx-rise" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
            <Sigil tone={k.tone} size="sm">{k.icon}</Sigil>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--kz-mute)] flex-1">{k.label}</span>
            <span className="text-xl font-extrabold qx-text-legend tabular-nums">{k.value.toLocaleString('fr-FR')}</span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        {/* Offres récentes */}
        <section className="qx-panel p-5 sm:p-6 min-w-0 qx-rise" style={{ animationDelay: '0.2s' }}>
          <PanelTitle icon={<ScrollText size={16} />} title="Offres récentes"
            action={<Link href="/admin/offres"><Button kind="soft" size="sm">Tout voir</Button></Link>} />
          {recentJobs.length === 0 ? (
            <p className="text-sm text-[var(--kz-mute)] text-center py-6">Aucune offre publiée pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentJobs.map((job) => (
                <li key={job.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#C084FC]/15 bg-[rgba(12,5,24,0.45)]">
                  <span aria-hidden className="qxr-column-gem" style={toneStyle(job.is_active ? 'var(--kz-green)' : '#8B7FB0')} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{job.title}</div>
                    <div className="text-xs text-[var(--kz-mute)]">
                      {new Date(job.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <Badge color={job.is_active ? 'green' : 'cream'} size="sm">
                    {job.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Colonne droite */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Accès rapides */}
          <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.25s' }}>
            <PanelTitle icon={<Compass size={16} />} title="Accès rapides" as="h2" />
            <nav aria-label="Accès rapides" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
              {QUICK.map((item) => (
                <Link key={item.href} href={item.href}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-[#C084FC]/30 hover:bg-[rgba(168,85,247,0.1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E879F9]/60">
                  <Sigil tone={item.tone} size="sm">{item.icon}</Sigil>
                  <span className="text-sm font-semibold text-[var(--kz-ink)] flex-1">{item.label}</span>
                  <ArrowRight size={13} aria-hidden className="text-[var(--kz-mute)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                </Link>
              ))}
            </nav>
          </section>

          {/* Distribution rôles — données réelles */}
          <section className="qx-panel p-5 qx-rise" style={{ animationDelay: '0.3s' }}>
            <PanelTitle icon={<Users size={16} />} title="Distribution des rôles" as="h2" />
            {stats.users === 0 ? (
              <p className="text-xs text-[var(--kz-mute)] text-center py-4">Aucun utilisateur inscrit.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {roleDistrib.map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[var(--kz-ink)]">{r.label} <span className="text-[var(--kz-mute)] font-normal">({r.count})</span></span>
                      <span className="text-[var(--kz-mute)] tabular-nums">{r.pct}%</span>
                    </div>
                    <div className="qxr-xp-mini h-2.5" style={toneStyle(r.color)}>
                      <span className="transition-all duration-500" style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
