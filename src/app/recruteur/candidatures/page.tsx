'use client'

import { useState, useEffect, useRef, startTransition, ViewTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Sparkles, Lock, Check, AlertTriangle, Bookmark, Columns3, List, Video, Phone, MapPin, CalendarPlus, Mail } from 'lucide-react'
import { InlineLoader } from '@/components/ui/LogoLoader'
import { Tag } from '@/components/ui/Tag'
import { useApplicationSummaryAI } from '@/features/ai/useKazaIA'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { useInterviews } from '@/features/interviews/useInterviews'
import { useStartConversation } from '@/features/messages/useMessages'
import type { Application } from '@/lib/types'
import { APPLICATION_STATUSES, TALENT_POOL_CATEGORIES } from '@/lib/constants'
import { island } from '@/lib/island'
import {
  ACCENT, APP_STATUS_ACCENT, BADGE_ACCENT, EmptyPanel, Gauge, PageHeader, SearchField, Segmented, SkeletonList, accentStyle, tint,
} from '@/components/os/recruiter/primitives'
import { ApplicationCard, ApplicationRow, type ApplicationCardActions } from '@/components/os/recruiter/ApplicationCard'

type Status = Application['status']
const COLUMNS = Object.keys(APPLICATION_STATUSES) as Status[]

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

  // ── État de présentation uniquement ──
  const [view, setView] = useState<'board' | 'list'>('board')
  const [query, setQuery] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<Status | null>(null)
  const [busyId, setBusyId] = useState<{ id: string; to: Status } | null>(null)
  const [landedId, setLandedId] = useState<string | null>(null)
  const landedTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(landedTimer.current), [])

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
    // Rafraîchir (dans une transition : la carte glisse vers « Entretien »)
    startTransition(() => {
      setApplications(prev => prev.map(a => a.id === scheduleFor.id ? { ...a, status: 'interview' } : a))
    })
    island({ title: 'Entretien planifié', subtitle: scheduleFor.candidate?.full_name ?? 'Invitations envoyées', tone: 'success' })
  }

  const updateStatus = async (id: string, status: Application['status']) => {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    // Transition React : la carte « vole » vers sa nouvelle colonne (<ViewTransition>)
    startTransition(() => {
      setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
    })
  }

  /** Changement de statut avec retour visuel (glisser-déposer ou menu). */
  const moveTo = async (app: Application, status: Status) => {
    if (app.status === status || busyId) return
    setBusyId({ id: app.id, to: status })
    try {
      await updateStatus(app.id, status)
      setLandedId(app.id)
      window.clearTimeout(landedTimer.current)
      landedTimer.current = window.setTimeout(() => setLandedId(null), 950)
      island({
        title: APPLICATION_STATUSES[status].label,
        subtitle: app.candidate?.full_name ?? 'Statut mis à jour',
        tone: status === 'rejected' ? 'warning' : status === 'hired' ? 'love' : 'success',
      })
    } catch {
      island({ title: 'Statut non modifié', subtitle: 'Connexion impossible. Réessayez.', tone: 'warning' })
    }
    setBusyId(null)
  }

  const STATUS_OPTIONS = [
    { value: '', label: 'Tous les statuts' },
    ...Object.entries(APPLICATION_STATUSES).map(([k, v]) => ({ value: k, label: v.label })),
  ]

  const actions: ApplicationCardActions = {
    onSummary: setSummaryFor,
    onMessage: handleMessage,
    onSchedule: setScheduleFor,
    onPool: setPoolFor,
    onMove: moveTo,
  }

  // Recherche locale (nom, offre)
  const q = query.trim().toLowerCase()
  const shown = q
    ? applications.filter((a) => `${a.candidate?.full_name ?? ''} ${a.job?.title ?? ''}`.toLowerCase().includes(q))
    : applications
  const byStatus = (s: Status) => shown.filter((a) => a.status === s)
  const visibleColumns = COLUMNS.filter((s) => {
    const n = applications.filter((a) => a.status === s).length
    if (filterStatus) return s === filterStatus || n > 0
    return s !== 'withdrawn' || n > 0
  })
  const draggedApp = dragId ? applications.find((a) => a.id === dragId) : undefined

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Recrutement"
        title="Candidatures"
        subtitle={<><span className="text-white font-medium tabular-nums">{applications.length}</span> candidature(s){filterStatus && <> · {APPLICATION_STATUSES[filterStatus as Status]?.label}</>}</>}
        actions={
          <Segmented ariaLabel="Affichage" value={view} onChange={setView} items={[
            { id: 'board', label: 'Tableau', icon: <Columns3 size={14} /> },
            { id: 'list',  label: 'Liste',   icon: <List size={14} /> },
          ]} />
        }
      />

      {/* Barre d'outils */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <SearchField value={query} onChange={setQuery} placeholder="Rechercher un candidat ou une offre" className="flex-1 sm:max-w-[380px]" />
        <div className="sm:ml-auto sm:w-56">
          <Select
            options={STATUS_OPTIONS}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filtrer par statut"
            className="!h-9 !rounded-xl"
          />
        </div>
      </div>

      {loading ? (
        view === 'board' ? (
          <div className="osr-board">
            {COLUMNS.slice(0, 5).map((s) => (
              <div key={s} className="osr-col p-3 gap-2"><div className="osr-skel h-5 w-24 mb-2" />{[0, 1, 2].map((i) => <div key={i} className="osr-skel h-[118px]" />)}</div>
            ))}
          </div>
        ) : <SkeletonList rows={6} height={72} />
      ) : applications.length === 0 ? (
        <div className="os-glass rounded-[28px]">
          <EmptyPanel
            icon={<Users size={28} />}
            title="Aucune candidature"
            description="Publiez des offres pour commencer à recevoir des candidatures."
            action={<Link href="/recruteur/offres/nouvelle"><Button kind="primary">Créer une offre</Button></Link>}
          />
        </div>
      ) : view === 'board' ? (
        <>
          <p className="hidden md:block text-[12px] text-[var(--kz-mute)] mb-2.5 px-1">
            Glissez une carte d’une colonne à l’autre pour changer son statut, ou utilisez le menu <span className="text-[var(--kz-text)]">•••</span> de la carte.
          </p>
          <div className="osr-board" role="list" aria-label="Pipeline des candidatures">
            {visibleColumns.map((status) => {
              const list = byStatus(status)
              const accent = APP_STATUS_ACCENT[status] ?? ACCENT.mute
              const isOver = overCol === status && !!draggedApp && draggedApp.status !== status
              const incoming = busyId?.to === status
              return (
                <div
                  key={status}
                  role="listitem"
                  aria-label={`${APPLICATION_STATUSES[status].label} : ${list.length}`}
                  className="osr-col"
                  data-over={isOver || undefined}
                  style={accentStyle(accent)}
                  onDragOver={(e) => { if (!dragId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (overCol !== status) setOverCol(status) }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol((c) => (c === status ? null : c)) }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const id = e.dataTransfer.getData('text/plain') || dragId
                    const app = applications.find((a) => a.id === id)
                    setOverCol(null); setDragId(null)
                    if (app) moveTo(app, status)
                  }}
                >
                  <div className="osr-col-head px-3.5 pt-3.5 pb-2.5">
                    <div className="osr-col-bar mb-3" />
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-[14px] font-semibold text-white truncate">{APPLICATION_STATUSES[status].label}</h2>
                      <span className="min-w-6 h-6 px-2 rounded-full inline-flex items-center justify-center text-[12px] font-semibold tabular-nums"
                        style={{ background: tint(accent, 18), color: `color-mix(in srgb, ${accent} 80%, white)` }}>
                        {list.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 px-2.5 pb-3 flex-1">
                    {incoming && (
                      <div className="osr-skel h-[86px] border border-dashed" style={{ borderColor: tint(accent, 50) }} aria-hidden />
                    )}
                    {list.map((app) => (
                      <ViewTransition key={app.id} name={`osr-app-${app.id}`} share="osr-move" update="osr-move" enter="none" exit="none" default="none">
                        <div>
                          <ApplicationCard
                            app={app}
                            actions={actions}
                            messaging={messagingId === app.candidate?.id}
                            busy={busyId?.id === app.id}
                            landed={landedId === app.id}
                            dragging={dragId === app.id}
                            onDragStart={setDragId}
                            onDragEnd={() => { setDragId(null); setOverCol(null) }}
                          />
                        </div>
                      </ViewTransition>
                    ))}
                    {list.length === 0 && !incoming && (
                      <div className="flex-1 min-h-[96px] rounded-2xl border border-dashed flex items-center justify-center text-center px-4 text-[12px] text-[var(--kz-mute)] transition-colors"
                        style={{ borderColor: isOver ? accent : 'var(--osr-hair)' }}>
                        {isOver ? 'Relâchez pour déplacer ici' : q ? 'Aucun résultat' : 'Aucune candidature'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="os-glass rounded-[26px] p-2">
          {shown.length === 0 ? (
            <p className="text-[14px] text-[var(--kz-mute)] text-center py-10">Aucun résultat pour « {query} ».</p>
          ) : (
            <div className="osr-sep">
              {shown.map((app, i) => (
                <ViewTransition key={app.id} name={`osr-app-${app.id}`} update="osr-move" enter="none" exit="none" default="none">
                  <div className="osr-in" style={{ ['--i' as string]: i }}>
                    <ApplicationRow
                      app={app}
                      actions={actions}
                      messaging={messagingId === app.candidate?.id}
                      busy={busyId?.id === app.id}
                      landed={landedId === app.id}
                    />
                  </div>
                </ViewTransition>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal planification entretien */}
      <Modal open={!!scheduleFor} onClose={() => setScheduleFor(null)} title="Planifier un entretien" size="md">
        <div className="flex flex-col gap-4">
          <div className="osr-inset flex items-center gap-3 p-3">
            <Avatar name={scheduleFor?.candidate?.full_name ?? 'Candidat'} src={scheduleFor?.candidate?.avatar_url} avatarConfig={scheduleFor?.candidate?.avatar_config} size={40} color={tint(ACCENT.indigo, 30)} />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-white truncate">{(scheduleFor?.candidate as { full_name?: string })?.full_name}</div>
              <div className="text-[12px] text-[var(--kz-mute)] truncate">Candidat · {scheduleFor?.job?.title}</div>
            </div>
            <span className="ml-auto w-9 h-9 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: ACCENT.red }} aria-hidden>
              <CalendarPlus size={17} />
            </span>
          </div>

          <Input label="Date et heure *" type="datetime-local" value={scheduleData.scheduledAt}
            onChange={e => setScheduleData(d => ({ ...d, scheduledAt: e.target.value }))} required />

          <div className="grid grid-cols-2 gap-3">
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
            <div className="animate-slide-up">
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
            <div className="animate-slide-up">
              <Input label="Lieu" value={scheduleData.location}
                placeholder="12 Rue de Paris, Saint-Denis"
                onChange={e => setScheduleData(d => ({ ...d, location: e.target.value }))} />
            </div>
          )}

          <Textarea label="Notes pour le candidat" value={scheduleData.notes} rows={3}
            placeholder="Ce que le candidat doit savoir avant l'entretien..."
            onChange={e => setScheduleData(d => ({ ...d, notes: e.target.value }))} />

          <div className="flex items-center gap-2.5 text-[12px] text-[var(--kz-text)] p-3 rounded-xl" style={{ background: tint(ACCENT.green, 10) }}>
            <span className="flex gap-1 shrink-0" style={{ color: ACCENT.green }} aria-hidden>
              {scheduleData.type === 'video' ? <Video size={14} /> : scheduleData.type === 'phone' ? <Phone size={14} /> : <MapPin size={14} />}
              <Mail size={14} />
            </span>
            Les deux parties recevront un email de confirmation avec tous les détails.
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <Button kind="soft" size="lg" full onClick={() => setScheduleFor(null)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={scheduling} onClick={handleSchedule}
              disabled={!scheduleData.scheduledAt}>
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
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center os-pop" style={{ background: ACCENT.green, boxShadow: `0 16px 40px -12px ${ACCENT.green}` }}>
            <Check size={28} strokeWidth={3} className="text-white" />
          </div>
          <p className="text-[15px] font-semibold text-white">{candidate?.full_name} ajouté au vivier.</p>
          <Button kind="primary" size="md" onClick={handleClose}>Fermer</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--kz-mute)]">Classez <strong className="text-[var(--kz-ink)]">{candidate?.full_name}</strong> pour le retrouver facilement.</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Catégorie">
            {TALENT_POOL_CATEGORIES.map((c) => {
              const active = category === c.id
              const accent = BADGE_ACCENT[c.color]
              return (
                <button key={c.id} type="button" role="radio" aria-checked={active} onClick={() => setCategory(c.id)}
                  className="flex items-center gap-2 p-3 rounded-2xl text-[13px] font-semibold text-left transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--kz-blue)_40%,transparent)]"
                  style={{
                    background: active ? tint(accent, 18) : 'var(--osr-fill)',
                    boxShadow: active ? `inset 0 0 0 1px ${tint(accent, 60)}` : 'inset 0 0 0 1px var(--osr-hair)',
                    color: active ? 'white' : 'var(--kz-text)',
                  }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: accent }} />
                  {c.label}
                </button>
              )
            })}
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
function recoFromScore(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'À contacter',        color: ACCENT.green }
  if (score >= 60) return { label: 'Profil intéressant', color: ACCENT.violet }
  if (score >= 40) return { label: 'À étudier',          color: ACCENT.yellow }
  return                  { label: 'Peu prioritaire',    color: ACCENT.mute }
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
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: tint(ACCENT.violet, 12) }}>
          <span className="w-9 h-9 rounded-[11px] flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(145deg, var(--osr-indigo), var(--kz-violet))' }}>
            <Sparkles size={17} />
          </span>
          <p className="text-[14px] font-semibold text-white min-w-0">
            {candidate?.full_name ? `Analyse de ${candidate.full_name}` : 'KazaIA analyse cette candidature'}
            <span className="block text-[12px] font-normal text-[var(--kz-mute)] truncate">{app?.job?.title}</span>
          </p>
        </div>

        {generating && (
          <div className="flex flex-col items-center gap-3 py-8">
            <InlineLoader size={48} />
            <p className="text-sm text-[var(--kz-mute)]">Lecture du profil et croisement avec l&apos;offre…</p>
          </div>
        )}

        {locked && (
          <div className="p-6 rounded-2xl flex flex-col items-center gap-3 text-center" style={{ background: tint(ACCENT.orange, 10) }}>
            <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: tint(ACCENT.orange, 22) }}>
              <Lock size={20} style={{ color: ACCENT.orange }} />
            </span>
            <p className="text-sm font-semibold text-[var(--kz-ink)]">{locked}</p>
            <Link href="/recruteur/entreprise"><Button kind="primary" size="md">Passer à un plan supérieur</Button></Link>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {summary && !generating && (
          <div className="flex flex-col gap-5 animate-slide-up">
            {/* Recommandation rapide + adéquation */}
            {(() => {
              const r = recoFromScore(summary.adequation)
              return (
                <div className="osr-glow flex items-center gap-4 p-4 rounded-2xl" style={{ ...accentStyle(r.color), background: tint(r.color, 10), boxShadow: `inset 0 0 0 1px ${tint(r.color, 30)}` }}>
                  <Gauge value={summary.adequation} size={68} stroke={7} color={r.color} label={`Adéquation ${summary.adequation} %`}>
                    <span className="text-[17px] font-semibold text-white tabular-nums">{summary.adequation}</span>
                  </Gauge>
                  <div className="min-w-0">
                    <p className="osr-eyebrow !text-[10px]">Recommandation KazaIA</p>
                    <p className="text-[20px] font-semibold tracking-[-0.02em] text-white">{r.label}</p>
                    <p className="text-[12px] text-[var(--kz-mute)]">Taux d&apos;adéquation : {summary.adequation} %</p>
                  </div>
                </div>
              )
            })()}

            <div>
              <p className="osr-eyebrow !text-[11px] mb-1.5">Résumé du profil</p>
              <p className="text-[14px] text-[var(--kz-text)] leading-relaxed">{summary.resume}</p>
            </div>

            {summary.competences_match?.length > 0 && (
              <div>
                <p className="osr-eyebrow !text-[11px] mb-2">Compétences correspondantes</p>
                <div className="flex gap-1.5 flex-wrap">{summary.competences_match.map((c, i) => <Tag key={i} color="violet">{c}</Tag>)}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.points_forts?.length > 0 && (
                <div className="osr-inset p-4">
                  <p className="osr-eyebrow !text-[11px] mb-2" style={{ color: ACCENT.green }}>Points forts</p>
                  <ul className="flex flex-col gap-2">
                    {summary.points_forts.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--kz-text)]"><Check size={14} className="mt-0.5 shrink-0" style={{ color: ACCENT.green }} />{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.points_vigilance?.length > 0 && (
                <div className="osr-inset p-4">
                  <p className="osr-eyebrow !text-[11px] mb-2" style={{ color: ACCENT.orange }}>Points de vigilance</p>
                  <ul className="flex flex-col gap-2">
                    {summary.points_vigilance.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[var(--kz-text)]"><AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: ACCENT.orange }} />{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {summary.experiences?.length > 0 && (
              <div>
                <p className="osr-eyebrow !text-[11px] mb-2">Expériences pertinentes</p>
                <ul className="flex flex-col gap-1.5">
                  {summary.experiences.map((e, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] text-[var(--kz-text)]">
                      <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0 bg-[var(--kz-mute)]" />{e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-4 rounded-2xl" style={{ background: tint(ACCENT.green, 10) }}>
              <p className="osr-eyebrow !text-[11px] mb-1" style={{ color: ACCENT.green }}>Recommandation</p>
              <p className="text-[14px] font-medium text-white leading-relaxed">{summary.decision}</p>
            </div>
            <p className="text-[11px] text-[var(--kz-mute)]">Généré par KazaIA — aide à la décision, ne remplace pas votre jugement.</p>
          </div>
        )}

        {raw && !summary && !generating && (
          <div className="osr-inset p-4 text-sm text-[var(--kz-text)] leading-relaxed whitespace-pre-wrap">{raw}</div>
        )}

        <Button kind="outline" size="md" onClick={handleClose}>Fermer</Button>
      </div>
    </Modal>
  )
}
