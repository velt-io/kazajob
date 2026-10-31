'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, X, Swords, ScrollText, Crown, MapPin, Clock, ArrowUpRight } from 'lucide-react'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useApplications } from '@/features/applications/useApplications'
import { useAuth } from '@/features/auth/useAuth'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { Crest, QuestEmpty, QuestPageHeader, RarityBadge, SPELL_LINK, rarityVars } from '@/components/quest/candidat/QuestKit'
import { StageTrack } from '@/components/quest/candidat/StageTrack'
import { applicationQuest } from '@/components/quest/candidat/quest-ui'

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
  const trials = applications.filter(a => a.status === 'interview').length
  const treasures = applications.filter(a => a.status === 'offer' || a.status === 'hired').length

  return (
    <div className="max-w-[920px] mx-auto">
      <QuestPageHeader
        eyebrow="Journal de quêtes"
        title="Quêtes"
        accent="actives"
        icon={<Swords size={20} />}
        subtitle={`${active.length} candidature${active.length > 1 ? 's' : ''} en cours d’aventure`}
      >
        <div className="flex items-center gap-2 text-[12px] font-bold">
          <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#C084FC]/45 bg-[rgba(192,132,252,0.1)] text-[#D8B4FE]"><Swords size={12} aria-hidden />{trials} épreuve{trials > 1 ? 's' : ''}</span>
          <span className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#FACC15]/45 bg-[rgba(250,204,21,0.1)] text-[#FDE68A]"><Crown size={12} aria-hidden />{treasures} trésor{treasures > 1 ? 's' : ''}</span>
        </div>
      </QuestPageHeader>

      {/* Filtres du journal */}
      <div className="flex gap-1.5 mb-6 p-1.5 rounded-xl border border-[#C084FC]/25 bg-[rgba(168,85,247,0.08)] overflow-x-auto qx-rise" role="group" aria-label="Filtrer les quêtes" style={{ animationDelay: '0.06s' }}>
        {STATUS_TABS.map((tab) => {
          const cnt = tab.key === 'all'
            ? applications.filter(a => a.status !== 'withdrawn').length
            : applications.filter((a) => a.status === tab.key).length
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className="qxc-chip shrink-0"
            >
              {tab.label}
              {cnt > 0 && <span className="qxc-count">{cnt}</span>}
            </button>
          )
        })}
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <QuestEmpty
          title="Aucune quête dans ce journal"
          description="Accepte une prime du tableau pour commencer ton aventure."
          icon={<Briefcase size={28} />}
          action={<Link href="/candidat/offres" className={SPELL_LINK}><ScrollText size={15} aria-hidden />Voir le tableau des primes</Link>}
        />
      ) : (
        <ol className="flex flex-col gap-4 qxc-stagger">
          {filtered.map((app) => {
            const statusInfo = APPLICATION_STATUSES[app.status as keyof typeof APPLICATION_STATUSES]
              ?? { label: app.status, color: 'cream' }
            const company = app.job?.company
            const companyInit = (company?.name ?? 'CO').slice(0, 2).toUpperCase()
            const canCancel = !['hired', 'rejected', 'withdrawn'].includes(app.status)
            const quest = applicationQuest(app.status)
            const ended = quest.state === 'lost' || quest.state === 'abandoned'

            return (
              <li key={app.id} className={`qxc-card ${quest.state === 'won' ? 'qxc-legend' : ''} p-4 sm:p-5 ${ended ? 'opacity-80' : ''}`} style={rarityVars(quest.rarity)}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <Crest rarity={quest.rarity} size={48}>{companyInit}</Crest>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 justify-between">
                      <h2 className="text-[15px] sm:text-base font-bold text-white leading-snug font-[family-name:var(--font-epic)] tracking-wide line-clamp-2 min-w-0">{app.job?.title}</h2>
                      <div className="shrink-0 hidden min-[420px]:block">
                        <RarityBadge rarity={quest.rarity} label={statusInfo.label} />
                      </div>
                    </div>
                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[12px] text-[var(--kz-mute)] mt-1">
                      {company?.name && <span className="text-[var(--kz-text)] font-semibold">{company.name}</span>}
                      {app.job?.location && <span className="flex items-center gap-1"><MapPin size={11} aria-hidden />{app.job.location}</span>}
                      <span className="flex items-center gap-1"><Clock size={11} aria-hidden />{timeAgo(app.created_at)}</span>
                    </div>
                    <div className="min-[420px]:hidden mt-2"><RarityBadge rarity={quest.rarity} label={statusInfo.label} size="sm" /></div>
                  </div>
                </div>

                <div className="mt-4 px-1">
                  <StageTrack status={app.status} />
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#C084FC]/15">
                  {quest.state === 'won' && (
                    <span className="mr-auto flex items-center gap-1.5 text-[12px] font-bold qx-text-legend"><Crown size={13} className="text-[var(--qx-gold)]" aria-hidden />Trésor obtenu</span>
                  )}
                  <Link href={`/candidat/offres/${app.job_id}`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--kz-ink)] bg-[rgba(168,85,247,0.12)] hover:bg-[rgba(168,85,247,0.22)] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/40">
                    Voir l&apos;offre <ArrowUpRight size={12} aria-hidden />
                  </Link>
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setCancelId(app.id)}
                      className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-[#C084FC]/20 text-[11px] font-bold text-[var(--kz-mute)] hover:border-red-300 hover:text-[#FCA5A5] hover:bg-red-50 transition-colors shrink-0"
                      aria-label={`Retirer ma candidature : ${app.job?.title ?? ''}`}
                      title="Retirer ma candidature"
                    >
                      <X size={13} aria-hidden /><span className="hidden sm:inline">Abandonner</span>
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {/* Modal confirmation annulation */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Abandonner la quête ?">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--kz-text)]">
            Tu es sur le point de retirer ta candidature pour{' '}
            <strong className="text-white">{cancelTarget?.job?.title}</strong>{' '}
            chez <strong className="text-white">{cancelTarget?.job?.company?.name}</strong>.
          </p>
          <div className="p-3 rounded-xl border border-[#FACC15]/30 bg-[rgba(250,204,21,0.08)] text-xs text-[#FDE68A]">
            Le recruteur sera informé que tu as retiré ta candidature. Cette action est irréversible.
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button kind="soft" size="md" full onClick={() => setCancelId(null)}>Annuler</Button>
            <Button kind="danger" size="md" full loading={cancelling} onClick={handleCancel}>
              Retirer ma candidature
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
