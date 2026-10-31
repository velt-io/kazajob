'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Calendar, MessageCircle, Sparkles, Lock, Check, AlertTriangle, Rocket, Bookmark, ChevronsRight, UserRound, Crown, Swords, ChevronDown, FileText, Play } from 'lucide-react'
import { InlineLoader } from '@/components/ui/LogoLoader'
import { Tag } from '@/components/ui/Tag'
import { Progress } from '@/components/ui/Progress'
import { useApplicationSummaryAI } from '@/features/ai/useKazaIA'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Tooltip } from '@/components/ui/radix'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import { useInterviews } from '@/features/interviews/useInterviews'
import { useStartConversation } from '@/features/messages/useMessages'
import type { Application } from '@/lib/types'
import { APPLICATION_STATUSES, KZ, TALENT_POOL_CATEGORIES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { island } from '@/lib/island'
import { QuestHeader, toneStyle } from '@/components/quest/recruteur/QuestChrome'
import { HeroPortrait, RarityTag } from '@/components/quest/recruteur/HeroPortrait'
import { sparkBurst } from '@/components/quest/recruteur/effects'
import { heroRank, isAdvance, RARITY_TONE, nextStage, PIPELINE_CLOSED, PIPELINE_ORDER, STAGE_META, type AppStatus } from '@/components/quest/recruteur/hero'

export default function RecruiterApplicationsPage() {
  const { profile } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [scheduleFor, setScheduleFor] = useState<Application | null>(null)
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: '', durationMin: '45', type: 'video' as 'video'|'phone'|'onsite',
    visioType: 'jitsi' as 'jitsi'|'external', externalLink: '', location: '', notes: '',
  })
  const [scheduling, setScheduling] = useState(false)
  const [messagingId, setMessagingId] = useState<string | null>(null)
  const [summaryFor, setSummaryFor] = useState<Application | null>(null)
  const [poolFor, setPoolFor] = useState<Application | null>(null)
  const { create: createInterview } = useInterviews()
  const startConversation = useStartConversation()
  const router = useRouter()
  // Présentation : carte mise en lumière après une promotion, colonne « hors quête » repliable
  const [promotedId, setPromotedId] = useState<string | null>(null)
  const [showClosed, setShowClosed] = useState(false)
  const promoteTimer = useRef<number | null>(null)

  useEffect(() => () => { if (promoteTimer.current) window.clearTimeout(promoteTimer.current) }, [])

  const handleMessage = async (candidateId: string, jobId: string) => {
    if (!profile?.id) return
    setMessagingId(candidateId)
    const convId = await startConversation(candidateId, profile.id, jobId)
    if (convId) router.push(`/recruteur/messages?c=${convId}`)
    setMessagingId(null)
  }

  useEffect(() => {
    if (!profile) return
    const fetchApps = async () => {
      try {
        const res = await fetch('/api/applications?scope=recruiter')
        let data = res.ok ? ((await res.json()) as Application[]) : []
        if (filterStatus) data = data.filter((a) => a.status === filterStatus)
        setApplications(data)
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchApps()
  }, [profile, filterStatus])

  const handleSchedule = async () => {
    if (!scheduleFor || !scheduleData.scheduledAt) return
    setScheduling(true)
    await createInterview({
      applicationId: scheduleFor.id,
      candidateId:   scheduleFor.candidate_id,
      jobId:         scheduleFor.job_id,
      scheduledAt:   new Date(scheduleData.scheduledAt).toISOString(),
      durationMin:   parseInt(scheduleData.durationMin),
      type:          scheduleData.type,
      visioType:     scheduleData.visioType,
      externalLink:  scheduleData.externalLink || undefined,
      location:      scheduleData.location || undefined,
      notes:         scheduleData.notes || undefined,
    })
    setScheduling(false)
    setScheduleFor(null)
    // Rafraîchir
    setApplications(prev => prev.map(a => a.id === scheduleFor.id ? { ...a, status: 'interview' } : a))
  }

  const updateStatus = async (id: string, status: Application['status']) => {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
  }

  /** Changement de statut (même appel qu'avant) + récompense visuelle si le héros progresse. */
  const changeStatus = (app: Application, status: AppStatus, origin?: Element | null) => {
    if (status === app.status) return
    if (isAdvance(app.status, status)) {
      sparkBurst(origin)
      setPromotedId(app.id)
      if (promoteTimer.current) window.clearTimeout(promoteTimer.current)
      promoteTimer.current = window.setTimeout(() => setPromotedId(null), 2600)
      const name = app.candidate?.full_name ?? 'Le candidat'
      island(status === 'hired'
        ? { title: 'Un héros rejoint la guilde !', subtitle: `${name} · ${APPLICATION_STATUSES.hired.label}`, tone: 'success' }
        : { title: `${name} progresse`, subtitle: `Nouvelle étape : ${APPLICATION_STATUSES[status].label}`, tone: 'info' })
    }
    updateStatus(app.id, status)
  }

  const STATUS_OPTIONS = [
    { value: '', label: 'Tous les statuts' },
    ...Object.entries(APPLICATION_STATUSES).map(([k, v]) => ({ value: k, label: v.label })),
  ]

  // Colonnes affichées : toute la progression, ou la seule étape filtrée
  const filtered = filterStatus as AppStatus | ''
  const columns: AppStatus[] = filtered ? [filtered] : PIPELINE_ORDER
  const closedApps = filtered ? [] : applications.filter((a) => PIPELINE_CLOSED.includes(a.status))
  const byStatus = (s: AppStatus) => applications.filter((a) => a.status === s)

  const jumpTo = (s: AppStatus) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(`etape-${s}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'start', block: 'nearest' })
  }

  const cardProps = {
    promotedId, messagingId,
    onStatus: changeStatus,
    onSummary: (a: Application) => setSummaryFor(a),
    onMessage: handleMessage,
    onSchedule: (a: Application) => setScheduleFor(a),
    onPool: (a: Application) => setPoolFor(a),
  }

  return (
    <div className="max-w-[1500px] mx-auto">
      <QuestHeader
        eyebrow="Candidatures reçues"
        icon={<Swords size={18} />}
        title={<>Le hall des <span className="qx-text-arcane">recrues</span></>}
        subtitle={<>{applications.length} candidature(s) · faites progresser vos héros d&apos;étape en étape.</>}
        actions={
          <Select
            aria-label="Filtrer par statut"
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-52"
          />
        }
      />

      {loading ? <PageLoader /> : applications.length === 0 ? (
        <div className="qx-panel">
          <EmptyState
            title="Aucune candidature"
            description="Publiez des offres pour commencer a recevoir des candidatures."
            icon={<Users size={28} />}
          />
        </div>
      ) : (
        <>
          {/* Navigation rapide entre étapes (utile au doigt sur mobile) */}
          {columns.length > 1 && (
            <nav aria-label="Étapes du pipeline" className="qxr-tabs mb-3 lg:hidden">
              {columns.map((s) => (
                <button key={s} type="button" className="qxr-tab" onClick={() => jumpTo(s)}>
                  <span className="qxr-column-gem" style={toneStyle(STAGE_META[s].tone)} aria-hidden />
                  {APPLICATION_STATUSES[s].label}
                  <span className="qxr-tab-count">{byStatus(s).length}</span>
                </button>
              ))}
            </nav>
          )}

          <div className="qxr-board" role="list" aria-label="Pipeline de recrutement">
            {columns.map((s) => {
              const list = byStatus(s)
              return (
                <div key={s} id={`etape-${s}`} role="listitem" aria-label={`${APPLICATION_STATUSES[s].label} : ${list.length}`}
                  className="qxr-column" style={toneStyle(STAGE_META[s].tone)}>
                  <header className="qxr-column-head">
                    <div className="flex items-center gap-2">
                      <span className="qxr-column-gem" aria-hidden />
                      <h2 className="text-[13px] font-bold text-white tracking-wide flex-1 truncate font-[family-name:var(--font-epic)]">{APPLICATION_STATUSES[s].label}</h2>
                      <span className="text-[12px] font-extrabold tabular-nums px-2 py-0.5 rounded-md bg-[rgba(12,5,24,0.6)]" style={{ color: STAGE_META[s].tone }}>{list.length}</span>
                    </div>
                    <p className="text-[10.5px] uppercase tracking-[0.12em] text-[var(--kz-mute)] mt-1 pl-[18px]">{STAGE_META[s].lore}</p>
                  </header>
                  <div className="flex flex-col gap-3 p-3">
                    {list.length === 0 ? (
                      <p className="text-[12px] text-[var(--kz-mute)] text-center py-6 border border-dashed border-[#C084FC]/20 rounded-xl">Aucun héros à cette étape.</p>
                    ) : list.map((app) => <HeroApplicationCard key={app.id} app={app} {...cardProps} />)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Hors quête : refusées / retirées */}
          {closedApps.length > 0 && (
            <section className="mt-5">
              <button type="button" onClick={() => setShowClosed((v) => !v)} aria-expanded={showClosed} aria-controls="hors-quete"
                className="flex items-center gap-2 text-[13px] font-bold text-[var(--kz-mute)] hover:text-white transition-colors">
                <ChevronDown size={15} className={`transition-transform ${showClosed ? 'rotate-180' : ''}`} aria-hidden />
                Hors quête <span className="text-[11px] font-semibold">({closedApps.length} refusée(s) ou retirée(s))</span>
              </button>
              {showClosed && (
                <div id="hors-quete" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-3">
                  {closedApps.map((app) => <HeroApplicationCard key={app.id} app={app} {...cardProps} />)}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Modal planification entretien */}
      <Modal open={!!scheduleFor} onClose={() => setScheduleFor(null)} title="Planifier un entretien" size="md">
        <div className="flex flex-col gap-4">
          <div className="p-3 rounded-xl border border-[var(--kz-edge)]" style={{ background: KZ.violetSoft }}>
            <div className="text-sm font-bold text-[var(--kz-ink)]">{scheduleFor?.job?.title}</div>
            <div className="text-xs text-[var(--kz-mute)]">
              Candidat : {(scheduleFor?.candidate as { full_name?: string })?.full_name}
            </div>
          </div>

          <Input label="Date et heure *" type="datetime-local" value={scheduleData.scheduledAt}
            onChange={e => setScheduleData(d => ({ ...d, scheduledAt: e.target.value }))} required />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Durée" options={[
              { value: '30', label: '30 min' }, { value: '45', label: '45 min' },
              { value: '60', label: '1 heure' }, { value: '90', label: '1h30' },
            ]} value={scheduleData.durationMin} onChange={e => setScheduleData(d => ({ ...d, durationMin: e.target.value }))} />

            <Select label="Type" options={[
              { value: 'video',  label: 'Visioconférence' },
              { value: 'phone',  label: 'Téléphone' },
              { value: 'onsite', label: 'Présentiel' },
            ]} value={scheduleData.type} onChange={e => setScheduleData(d => ({ ...d, type: e.target.value as 'video'|'phone'|'onsite' }))} />
          </div>

          {scheduleData.type === 'video' && (
            <div>
              <Select label="Outil visio" options={[
                { value: 'jitsi',    label: 'Jitsi Meet (lien auto-généré)' },
                { value: 'external', label: 'Mon propre lien' },
              ]} value={scheduleData.visioType} onChange={e => setScheduleData(d => ({ ...d, visioType: e.target.value as 'jitsi'|'external' }))} />
              {scheduleData.visioType === 'external' && (
                <Input label="Lien visio" className="mt-3" value={scheduleData.externalLink}
                  placeholder="https://meet.google.com/..."
                  onChange={e => setScheduleData(d => ({ ...d, externalLink: e.target.value }))} />
              )}
            </div>
          )}

          {scheduleData.type === 'onsite' && (
            <Input label="Lieu" value={scheduleData.location}
              placeholder="12 Rue de Paris, Saint-Denis"
              onChange={e => setScheduleData(d => ({ ...d, location: e.target.value }))} />
          )}

          <Textarea label="Notes pour le candidat" value={scheduleData.notes} rows={3}
            placeholder="Ce que le candidat doit savoir avant l'entretien..."
            onChange={e => setScheduleData(d => ({ ...d, notes: e.target.value }))} />

          <div className="text-xs text-[var(--kz-mute)] p-2.5 rounded-lg border border-[var(--kz-line)]" style={{ background: KZ.greenSoft }}>
            Les deux parties recevront un email de confirmation avec tous les détails.
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button kind="soft" size="lg" full onClick={() => setScheduleFor(null)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={scheduling} onClick={handleSchedule}
              disabled={!scheduleData.scheduledAt} className="whitespace-normal">
              Planifier et envoyer les invitations
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal synthèse IA candidature */}
      <ApplicationSummaryModal app={summaryFor} onClose={() => setSummaryFor(null)} />

      {/* Modal sauvegarde dans le vivier */}
      <SaveToPoolModal app={poolFor} onClose={() => setPoolFor(null)} />
    </div>
  )
}

// ── Carte de héros (candidature) ───────────────────────────────

function HeroApplicationCard({ app, promotedId, messagingId, onStatus, onSummary, onMessage, onSchedule, onPool }: {
  app: Application
  promotedId: string | null
  messagingId: string | null
  onStatus: (app: Application, status: AppStatus, origin?: Element | null) => void
  onSummary: (app: Application) => void
  onMessage: (candidateId: string, jobId: string) => void
  onSchedule: (app: Application) => void
  onPool: (app: Application) => void
}) {
  const candidate = app.candidate
  const rank = heroRank(candidate?.xp)
  const rarity = rank?.rarity ?? 'commune'
  const next = nextStage(app.status)
  const boostedUntil = candidate?.boosted_until
  const boosted = !!boostedUntil && new Date(boostedUntil) > new Date()
  const answers = (app as unknown as { prequal_answers?: { label: string; value: string }[] }).prequal_answers?.filter((a) => a.value) ?? []
  const name = candidate?.full_name ?? 'Candidat'
  const closed = PIPELINE_CLOSED.includes(app.status)

  return (
    <article className={`qxr-hero p-3.5 ${closed ? 'opacity-75' : 'qx-rise'}`} data-promoted={promotedId === app.id}
      style={toneStyle(RARITY_TONE[rarity])}
      aria-label={`${name}, ${APPLICATION_STATUSES[app.status]?.label ?? app.status}`}>
      {/* Rang */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {rank ? <RarityTag rarity={rarity} /> : <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--kz-mute)]">Héros</span>}
          {rank && <span className="text-[11px] font-bold text-white whitespace-nowrap">Niv. {rank.level}</span>}
        </div>
        <span className="text-[10.5px] text-[var(--kz-mute)] whitespace-nowrap">{timeAgo(app.created_at)}</span>
      </div>

      {/* Identité */}
      <div className="flex items-center gap-3">
        <HeroPortrait name={name} src={candidate?.avatar_url} avatarConfig={candidate?.avatar_config} size={54} rarity={rarity} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[14px] font-bold text-white truncate">{name}</h3>
            {boosted && (
              <Tooltip content="Profil mis en avant par le candidat">
                <span className="shrink-0 inline-flex items-center gap-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-[#FDBA74] px-1.5 py-0.5 rounded border border-[#FB923C]/45 bg-[rgba(251,146,60,0.12)]">
                  <Rocket size={9} aria-hidden />Avant
                </span>
              </Tooltip>
            )}
          </div>
          <p className="text-[11.5px] text-[var(--kz-text)] truncate">{app.job?.title}</p>
          <p className="text-[11px] text-[var(--kz-mute)] truncate">{app.job?.company?.name}{candidate?.location ? ` · ${candidate.location}` : ''}</p>
        </div>
      </div>

      {/* XP réelle vers le palier suivant */}
      {rank && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-[var(--kz-mute)] mb-1">
            <span className="uppercase tracking-[0.1em]">{rank.title}</span>
            <span className="tabular-nums">{rank.xp.toLocaleString('fr-FR')} XP</span>
          </div>
          <div className="qxr-xp-mini" role="progressbar" aria-label={`Progression vers ${rank.nextTitle}`} aria-valuenow={rank.progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${Math.max(rank.progress, 3)}%` }} />
          </div>
        </div>
      )}

      {/* Artefacts & lettre */}
      {(candidate?.cv_url || candidate?.video_pitch_url) && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {candidate?.cv_url && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--qx-cyan)] px-1.5 py-0.5 rounded border border-[#22D3EE]/30"><FileText size={10} aria-hidden />CV</span>}
          {candidate?.video_pitch_url && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--qx-magenta)] px-1.5 py-0.5 rounded border border-[#E879F9]/30"><Play size={10} aria-hidden />Pitch vidéo</span>}
        </div>
      )}
      {app.cover_letter && (
        <p className="text-[11.5px] text-[var(--kz-mute)] mt-2.5 line-clamp-2 italic">« {app.cover_letter} »</p>
      )}
      {answers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {answers.map((a, i) => (
            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[var(--kz-line)] text-[var(--kz-text)]" style={{ background: KZ.cream2 }}>
              {a.label} : <strong className="text-white">{a.value}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Progression */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#C084FC]/15">
        <select
          aria-label={`Statut de la candidature de ${name}`}
          value={app.status}
          onChange={(e) => onStatus(app, e.target.value as AppStatus, e.currentTarget.closest('article'))}
          className="qxr-select flex-1"
        >
          {Object.entries(APPLICATION_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {next && (
          <Tooltip content={`Faire passer à « ${APPLICATION_STATUSES[next].label} »`}>
            <button type="button" onClick={(e) => onStatus(app, next, e.currentTarget.closest('article'))}
              aria-label={`Promouvoir ${name} : ${APPLICATION_STATUSES[next].label}`}
              className="h-8 px-2.5 inline-flex items-center gap-1 rounded-[10px] text-[11px] font-bold uppercase tracking-[0.06em] text-[#1A0B2E] border border-[#FDE68A] bg-[linear-gradient(120deg,#FDE68A,#FACC15_50%,#F59E0B)] shadow-[0_0_16px_-4px_rgba(250,204,21,0.8)] hover:-translate-y-0.5 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15]/70">
              {next === 'hired' ? <Crown size={13} aria-hidden /> : <ChevronsRight size={14} aria-hidden />}
              <span className="hidden min-[380px]:inline">{next === 'hired' ? 'Recruter' : 'Promouvoir'}</span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Actions rapides */}
      <div className="flex items-center justify-between gap-1 mt-2">
        <Tooltip content="Synthèse IA">
          <button type="button" className="qxr-icon-btn text-[var(--qx-magenta)]" aria-label={`Synthèse IA de la candidature de ${name}`} onClick={() => onSummary(app)}>
            <Sparkles size={15} />
          </button>
        </Tooltip>
        {candidate && (
          <>
            <Tooltip content="Envoyer un message">
              <button type="button" className="qxr-icon-btn" aria-label={`Envoyer un message à ${name}`} disabled={messagingId === candidate.id}
                onClick={() => onMessage(candidate.id, app.job_id)}>
                {messagingId === candidate.id ? <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <MessageCircle size={15} />}
              </button>
            </Tooltip>
            <Tooltip content="Planifier un entretien">
              <button type="button" className="qxr-icon-btn" aria-label={`Planifier un entretien avec ${name}`} onClick={() => onSchedule(app)}>
                <Calendar size={15} />
              </button>
            </Tooltip>
            <Tooltip content="Sauvegarder dans le vivier">
              <button type="button" className="qxr-icon-btn" aria-label={`Sauvegarder ${name} dans le vivier`} onClick={() => onPool(app)}>
                <Bookmark size={15} />
              </button>
            </Tooltip>
            <Tooltip content="Fiche du héros">
              <Link href={`/recruteur/candidats/${candidate.id}`} className="qxr-icon-btn" aria-label={`Voir le profil de ${name}`}>
                <UserRound size={15} />
              </Link>
            </Tooltip>
          </>
        )}
      </div>
    </article>
  )
}

function SaveToPoolModal({ app, onClose }: { app: Application | null; onClose: () => void }) {
  const [category, setCategory] = useState<string>('a_contacter')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const candidate = app?.candidate as { id?: string; full_name?: string } | undefined

  const save = async () => {
    if (!candidate?.id) return
    setLoading(true)
    await fetch('/api/recruiter/talent-pool', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: candidate.id, category, note: note || null }),
    })
    setLoading(false); setDone(true)
  }

  const handleClose = () => { setDone(false); setNote(''); setCategory('a_contacter'); onClose() }

  return (
    <Modal open={!!app} onClose={handleClose} title="Sauvegarder dans le vivier" size="sm">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center qx-rise">
          <div className="w-14 h-14 rounded-xl rotate-45 border border-[#4ADE80]/60 flex items-center justify-center shadow-[0_0_24px_-6px_rgba(74,222,128,0.9)]" style={{ background: KZ.greenSoft }}>
            <Check size={24} color={KZ.green} className="-rotate-45" />
          </div>
          <p className="text-sm font-bold text-[var(--kz-ink)] mt-1">{candidate?.full_name} ajouté au vivier.</p>
          <p className="text-xs text-[var(--kz-mute)]">Retrouvez-le dans le Registre des héros.</p>
          <Button kind="primary" size="md" onClick={handleClose}>Fermer</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--kz-mute)]">Classez <strong className="text-[var(--kz-ink)]">{candidate?.full_name}</strong> pour le retrouver facilement.</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Catégorie">
            {TALENT_POOL_CATEGORIES.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={category === c.id} onClick={() => setCategory(c.id)}
                className="p-2.5 rounded-xl border text-sm font-semibold text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E879F9]/60"
                style={{ borderColor: category === c.id ? 'var(--qx-magenta)' : KZ.line, background: category === c.id ? KZ.violetSoft : 'rgba(12,5,24,0.5)', boxShadow: category === c.id ? '0 0 18px -6px var(--qx-magenta)' : 'none' }}>
                {c.label}
              </button>
            ))}
          </div>
          <Textarea label="Note (optionnel)" value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Ex : à rappeler en septembre, profil rare en soudure…" />
          <Button kind="primary" size="lg" full loading={loading} icon={<Bookmark size={15} />} onClick={save}>
            Ajouter au vivier
          </Button>
        </div>
      )}
    </Modal>
  )
}

// Recommandation rapide dérivée du taux d'adéquation (déterministe, sans appel IA).
function recoFromScore(score: number): { label: string; bg: string; color: string } {
  if (score >= 80) return { label: 'À contacter',       bg: KZ.greenSoft,  color: KZ.green }
  if (score >= 60) return { label: 'Profil intéressant', bg: KZ.violetSoft, color: KZ.violet }
  if (score >= 40) return { label: 'À étudier',          bg: KZ.yellowSoft, color: KZ.yellow }
  return                  { label: 'Peu prioritaire',    bg: KZ.cream2,     color: KZ.mute }
}

function ApplicationSummaryModal({ app, onClose }: { app: Application | null; onClose: () => void }) {
  const { generating, summary, raw, error, locked, generate, reset } = useApplicationSummaryAI()
  const candidate = app?.candidate as { full_name?: string } | undefined

  // Génère dès l'ouverture
  if (app && !summary && !raw && !generating && !error && !locked) {
    generate(app.id)
  }

  const handleClose = () => { reset(); onClose() }

  return (
    <Modal open={!!app} onClose={handleClose} title="Synthèse IA de la candidature" size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--kz-edge)]" style={{ background: KZ.violetSoft }}>
          <Sparkles size={18} color={KZ.violet} aria-hidden />
          <p className="text-sm font-semibold text-[var(--kz-ink)]">
            {candidate?.full_name ? `Analyse de ${candidate.full_name}` : 'KazaIA analyse cette candidature'} — {app?.job?.title}
          </p>
        </div>

        {generating && (
          <div className="flex flex-col items-center gap-3 py-8">
            <InlineLoader size={48} />
            <p className="text-sm text-[var(--kz-mute)]">Lecture du profil et croisement avec l&apos;offre…</p>
          </div>
        )}

        {locked && (
          <div className="p-5 rounded-xl border border-[var(--kz-edge)] flex flex-col items-center gap-3 text-center" style={{ background: KZ.orangeSoft }}>
            <div className="w-12 h-12 rounded-full border border-[var(--kz-edge)] flex items-center justify-center" style={{ background: 'var(--kz-paper)' }}>
              <Lock size={20} color={KZ.orange} />
            </div>
            <p className="text-sm font-bold text-[var(--kz-ink)]">{locked}</p>
            <Link href="/recruteur/entreprise"><Button kind="primary" size="md">Passer à un plan supérieur</Button></Link>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {summary && !generating && (
          <div className="flex flex-col gap-4">
            {/* Recommandation rapide (premium) */}
            {(() => {
              const r = recoFromScore(summary.adequation)
              return (
                <div className="p-4 rounded-xl border flex items-center gap-3"
                  style={{ background: r.bg, borderColor: `color-mix(in srgb, ${r.color} 55%, transparent)`, boxShadow: `0 0 26px -10px ${r.color}` }}>
                  <Sparkles size={20} color={r.color} aria-hidden />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--kz-mute)]">Recommandation KazaIA</p>
                    <p className="text-lg font-extrabold text-[var(--kz-ink)]">{r.label}</p>
                  </div>
                  <span className="ml-auto text-2xl font-extrabold" style={{ color: r.color }}>{summary.adequation}%</span>
                </div>
              )
            })()}
            {/* Adéquation */}
            <div className="p-4 rounded-xl border border-[var(--kz-edge)]" style={{ background: KZ.violetSoft }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[var(--kz-ink)]">Taux d&apos;adéquation</span>
                <span className="text-2xl font-extrabold qx-text-arcane">{summary.adequation}%</span>
              </div>
              <Progress value={summary.adequation} color="var(--qx-arcane)" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--kz-mute)] mb-1">Résumé du profil</p>
              <p className="text-sm text-[var(--kz-text)] leading-relaxed">{summary.resume}</p>
            </div>

            {summary.competences_match?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--kz-mute)] mb-1.5">Compétences correspondantes</p>
                <div className="flex gap-2 flex-wrap">{summary.competences_match.map((c, i) => <Tag key={i}>{c}</Tag>)}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summary.points_forts?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--kz-mute)] mb-1.5">Points forts</p>
                  <ul className="flex flex-col gap-1.5">
                    {summary.points_forts.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--kz-text)]"><Check size={14} className="mt-0.5 shrink-0" color={KZ.green} />{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.points_vigilance?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--kz-mute)] mb-1.5">Points de vigilance</p>
                  <ul className="flex flex-col gap-1.5">
                    {summary.points_vigilance.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--kz-text)]"><AlertTriangle size={14} className="mt-0.5 shrink-0" color={KZ.orange} />{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {summary.experiences?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--kz-mute)] mb-1.5">Expériences pertinentes</p>
                <ul className="flex flex-col gap-1.5">
                  {summary.experiences.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--kz-text)]">• {e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 rounded-xl border border-[var(--kz-edge)]" style={{ background: KZ.greenSoft }}>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--kz-ink)] mb-1">Recommandation</p>
              <p className="text-sm font-semibold text-[var(--kz-text)]">{summary.decision}</p>
            </div>
            <p className="text-[11px] text-[var(--kz-mute)] italic">Généré par KazaIA — aide à la décision, ne remplace pas votre jugement.</p>
          </div>
        )}

        {raw && !summary && !generating && (
          <div className="p-4 rounded-xl border border-[var(--kz-edge)] text-sm text-[var(--kz-text)] leading-relaxed whitespace-pre-wrap" style={{ background: KZ.paper }}>{raw}</div>
        )}

        <Button kind="outline" size="md" onClick={handleClose}>Fermer</Button>
      </div>
    </Modal>
  )
}
