'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, ArrowUpRight, CalendarDays, Eye, Send, Gift, AlertTriangle } from 'lucide-react'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useApplications } from '@/features/applications/useApplications'
import { useAuth } from '@/features/auth/useAuth'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { CompanyMark, GlassEmpty, LargeTitle, Pill, Segmented } from '@/components/os/candidate/primitives'
import { StatusTracker, STATUS_HEADLINE, STATUS_TONE } from '@/components/os/candidate/StatusTracker'

const STATUS_TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'pending',   label: 'En attente' },
  { key: 'viewed',    label: 'Vues' },
  { key: 'interview', label: 'Entretien' },
  { key: 'offer',     label: 'Offres' },
  { key: 'rejected',  label: 'Refusées' },
] as const

type TabKey = (typeof STATUS_TABS)[number]['key']

export default function ApplicationsPage() {
  const { profile } = useAuth()
  const { applications, loading, refetch } = useApplications(profile?.id)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const filtered = (activeTab === 'all'
    ? applications
    : applications.filter((a) => a.status === activeTab)
  ).filter(a => a.status !== 'withdrawn')

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    await fetch(`/api/applications/${cancelId}/withdraw`, { method: 'POST' })
    await refetch?.()
    setCancelling(false)
    setCancelId(null)
  }

  const cancelTarget = applications.find(a => a.id === cancelId)
  const active = applications.filter(a => a.status !== 'withdrawn')
  const countOf = (s: string) => applications.filter((a) => a.status === s).length

  const summary = [
    { label: 'Envoyées', value: active.length, icon: <Send size={15} />, color: 'var(--kz-blue)' },
    { label: 'CV consultés', value: countOf('viewed'), icon: <Eye size={15} />, color: 'var(--kz-yellow)' },
    { label: 'Entretiens', value: countOf('interview'), icon: <CalendarDays size={15} />, color: 'var(--kz-green)' },
    { label: 'Offres', value: countOf('offer') + countOf('hired'), icon: <Gift size={15} />, color: 'var(--kz-violet)' },
  ]

  return (
    <div className="max-w-[860px] mx-auto">
      <LargeTitle
        eyebrow="Suivi"
        title="Mes candidatures"
        subtitle={`${active.length} candidature${active.length > 1 ? 's' : ''} active${active.length > 1 ? 's' : ''}`}
        actions={<Link href="/candidat/offres"><Button kind="outline" size="md" iconRight={<ArrowUpRight size={15} />}>Trouver une offre</Button></Link>}
      />

      {/* Résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {summary.map((s, i) => (
          <div key={s.label} className="osc-card osc-in p-4" style={{ ['--i' as string]: i }}>
            <span className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ color: s.color, background: `color-mix(in srgb, ${s.color} 16%, transparent)` }}>{s.icon}</span>
            <div className="text-[30px] font-semibold tracking-[-0.05em] text-[var(--kz-ink)] mt-3 leading-none tabular-nums">{s.value}</div>
            <div className="text-[12px] text-[var(--kz-mute)] mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto osc-scroll-x [scroll-snap-type:none]">
        <Segmented
          label="Filtrer par statut"
          value={activeTab}
          onChange={setActiveTab}
          className="shrink-0"
          options={STATUS_TABS.map((tab) => ({
            value: tab.key,
            label: tab.label,
            count: tab.key === 'all' ? active.length : countOf(tab.key),
          }))}
        />
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <GlassEmpty
          title="Aucune candidature"
          description="Commence à postuler aux offres qui te correspondent : tu suivras chaque étape ici."
          icon={<Briefcase size={26} />}
          action={<Link href="/candidat/offres"><Button kind="primary">Voir les offres</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((app, i) => {
            const statusInfo = APPLICATION_STATUSES[app.status as keyof typeof APPLICATION_STATUSES]
              ?? { label: app.status, color: 'cream' }
            const company = app.job?.company
            const canCancel = !['hired', 'rejected', 'withdrawn'].includes(app.status)
            const tone = STATUS_TONE[app.status] ?? 'gray'

            return (
              <article key={app.id} className="osc-card osc-in p-5 sm:p-6" style={{ ['--i' as string]: i }}>
                <div className="flex gap-3.5 items-start">
                  <CompanyMark name={company?.name} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)] leading-snug line-clamp-2">{app.job?.title}</h2>
                      <Pill tone={tone} dot className="hidden sm:inline-flex shrink-0">{statusInfo.label}</Pill>
                    </div>
                    <div className="text-[13px] text-[var(--kz-mute)] mt-0.5 truncate">
                      {[company?.name, app.job?.location].filter(Boolean).join(' · ')}
                    </div>
                    <Pill tone={tone} dot className="sm:hidden mt-2">{statusInfo.label}</Pill>
                  </div>
                </div>

                <p className="text-[15px] font-semibold tracking-[-0.01em] mt-5 mb-4" style={{ color: `color-mix(in srgb, var(--kz-ink) 92%, transparent)` }}>
                  {STATUS_HEADLINE[app.status] ?? statusInfo.label}
                </p>
                <StatusTracker status={app.status} index={i} />

                <div className="flex items-center justify-between gap-3 flex-wrap mt-5 pt-4 border-t border-[var(--kz-line)]">
                  <span className="text-[12px] text-[var(--kz-mute)]">
                    Envoyée {timeAgo(app.created_at)}
                    {app.updated_at && app.updated_at !== app.created_at && <> · mise à jour {timeAgo(app.updated_at)}</>}
                  </span>
                  <div className="flex items-center gap-2">
                    {app.status === 'interview' && (
                      <Link href="/candidat/entretiens" className="osc-press inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-semibold text-[var(--kz-green)] bg-[var(--kz-green-soft)] hover:brightness-125">
                        <CalendarDays size={13} />Agenda
                      </Link>
                    )}
                    <Link href={`/candidat/offres/${app.job_id}`} className="osc-press inline-flex items-center gap-1 h-8 px-3.5 rounded-full text-[12px] font-semibold text-[var(--kz-ink)] bg-[var(--osc-surface-hi)] hover:bg-[var(--kz-beige)]">
                      Voir l&apos;offre <ArrowUpRight size={13} />
                    </Link>
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancelId(app.id)}
                        className="osc-press inline-flex items-center h-8 px-3 rounded-full text-[12px] font-semibold text-[var(--kz-mute)] hover:text-[var(--kz-orange-deep)] hover:bg-red-50"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Modal confirmation annulation */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Retirer ma candidature" size="sm">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <CompanyMark name={cancelTarget?.job?.company?.name} size={44} />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[var(--kz-ink)] truncate">{cancelTarget?.job?.title}</div>
              <div className="text-[13px] text-[var(--kz-mute)] truncate">{cancelTarget?.job?.company?.name}</div>
            </div>
          </div>
          <div className="flex gap-3 p-3.5 rounded-[18px] text-[13px] leading-relaxed text-[var(--kz-text)] bg-[var(--kz-yellow-soft)] border border-[color-mix(in_srgb,var(--kz-yellow)_25%,transparent)]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-[var(--kz-yellow)]" />
            <span>Le recruteur sera informé que tu as retiré ta candidature. Cette action est irréversible.</span>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <Button kind="soft" size="lg" full onClick={() => setCancelId(null)}>Annuler</Button>
            <Button kind="danger" size="lg" full loading={cancelling} onClick={handleCancel}>
              Retirer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
