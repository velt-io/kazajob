'use client'
/**
 * Carte de candidature (tableau kanban & liste) — présentation seule.
 * Toutes les actions sont reçues en props : la page garde la logique.
 */
import Link from 'next/link'
import { Sparkles, MessageCircle, CalendarPlus, Bookmark, Rocket, MoreHorizontal, Check, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger, Tooltip } from '@/components/ui/radix'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { Application } from '@/lib/types'
import { ACCENT, APP_STATUS_ACCENT, IconButton, StatusPill, accentStyle, tint } from './primitives'

type Status = Application['status']
const STATUS_KEYS = Object.keys(APPLICATION_STATUSES) as Status[]

export interface ApplicationCardActions {
  onSummary: (app: Application) => void
  onMessage: (candidateId: string, jobId: string) => void
  onSchedule: (app: Application) => void
  onPool: (app: Application) => void
  onMove: (app: Application, status: Status) => void
}

export function isBoosted(app: Application) {
  const bu = (app.candidate as unknown as { boosted_until?: string | null } | undefined)?.boosted_until
  return !!bu && new Date(bu) > new Date()
}

export function prequalAnswers(app: Application) {
  const ans = (app as unknown as { prequal_answers?: { label: string; value: string }[] }).prequal_answers
  return (ans ?? []).filter((a) => a.value)
}

/** Menu « Déplacer vers… » (alternative clavier au glisser-déposer). */
export function StatusMenu({ app, onMove, variant = 'icon' }: { app: Application; onMove: ApplicationCardActions['onMove']; variant?: 'icon' | 'pill' }) {
  const current = APPLICATION_STATUSES[app.status] ?? { label: app.status }
  return (
    <Menu>
      <Tooltip content="Changer le statut">
        <MenuTrigger asChild>
          {variant === 'pill' ? (
            <button type="button" aria-label={`Statut : ${current.label}. Changer le statut`}
              className="rounded-full outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--kz-blue)_40%,transparent)] hover:brightness-125 transition">
              <StatusPill accent={APP_STATUS_ACCENT[app.status] ?? ACCENT.mute}>{current.label}</StatusPill>
            </button>
          ) : (
            <button type="button" aria-label="Changer le statut" className="osr-icon-btn"><MoreHorizontal size={16} /></button>
          )}
        </MenuTrigger>
      </Tooltip>
      <MenuContent align="end" className="min-w-[230px]">
        <MenuLabel className="osr-eyebrow !text-[10px]">Déplacer vers</MenuLabel>
        {STATUS_KEYS.map((k) => (
          <MenuItem key={k} onSelect={() => onMove(app, k)} disabled={k === app.status}
            className="data-[disabled]:opacity-100 data-[disabled]:cursor-default">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: APP_STATUS_ACCENT[k] }} />
            <span className="flex-1">{APPLICATION_STATUSES[k].label}</span>
            {k === app.status && <Check size={14} className="text-[var(--kz-blue)]" />}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

export function ApplicationCard({ app, actions, messaging, busy, landed, dragging, onDragStart, onDragEnd }: {
  app: Application
  actions: ApplicationCardActions
  messaging: boolean
  busy: boolean
  landed: boolean
  dragging: boolean
  onDragStart: (id: string) => void
  onDragEnd: () => void
}) {
  const candidate = app.candidate
  const name = candidate?.full_name ?? 'Candidat'
  const answers = prequalAnswers(app)
  const accent = APP_STATUS_ACCENT[app.status] ?? ACCENT.mute

  return (
    <article
      draggable={!busy}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', app.id); e.dataTransfer.effectAllowed = 'move'; onDragStart(app.id) }}
      onDragEnd={onDragEnd}
      data-dragging={dragging || undefined}
      data-busy={busy || undefined}
      data-landed={landed || undefined}
      className="osr-kcard p-3.5"
      style={accentStyle(accent)}
      aria-label={`${name} — ${app.job?.title ?? 'offre'}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} src={candidate?.avatar_url} avatarConfig={candidate?.avatar_config} size={38} color={tint(ACCENT.indigo, 30)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {candidate ? (
              <Link href={`/recruiter/candidates/${candidate.id}`} className="text-[14px] font-semibold text-white truncate hover:underline underline-offset-2" draggable={false}>
                {name}
              </Link>
            ) : <span className="text-[14px] font-semibold text-white truncate">{name}</span>}
            {isBoosted(app) && (
              <Tooltip content="Profil mis en avant">
                <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full shrink-0" style={{ background: tint(ACCENT.orange, 22), color: ACCENT.orange }}>
                  <Rocket size={10} aria-label="Mis en avant" />
                </span>
              </Tooltip>
            )}
          </div>
          <div className="text-[12px] text-[var(--kz-mute)] truncate">{app.job?.title ?? 'Offre'}</div>
        </div>
        <span className="text-[11px] text-[var(--kz-mute)] shrink-0 tabular-nums mt-0.5">{timeAgo(app.created_at)}</span>
      </div>

      {app.cover_letter && (
        <p className="text-[12px] text-[var(--kz-text)] opacity-80 mt-2.5 line-clamp-2 leading-relaxed">{app.cover_letter}</p>
      )}

      {answers.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {answers.slice(0, 2).map((a, i) => (
            <span key={i} className="osr-chip max-w-full"><span className="text-[var(--kz-mute)] truncate">{a.label}</span><strong className="font-semibold text-white truncate">{a.value}</strong></span>
          ))}
          {answers.length > 2 && (
            <Tooltip content={answers.slice(2).map((a) => `${a.label} : ${a.value}`).join(' · ')}>
              <span className="osr-chip" tabIndex={0}>+{answers.length - 2}</span>
            </Tooltip>
          )}
        </div>
      )}

      <div className="flex items-center gap-0.5 mt-3 pt-2.5 border-t border-white/[0.06]">
        <button type="button" onClick={() => actions.onSummary(app)}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-semibold text-white mr-auto transition hover:brightness-125 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--kz-violet)_40%,transparent)]"
          style={{ background: tint(ACCENT.violet, 26) }}>
          <Sparkles size={12} /> Synthèse IA
        </button>
        {busy && <span className="w-4 h-4 mr-1.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-label="Mise à jour" />}
        <div className="osr-reveal flex items-center">
          {candidate && (
            <IconButton label="Envoyer un message" onClick={() => actions.onMessage(candidate.id, app.job_id)} disabled={messaging}>
              {messaging ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <MessageCircle size={15} />}
            </IconButton>
          )}
          {candidate && <IconButton label="Planifier un entretien" onClick={() => actions.onSchedule(app)}><CalendarPlus size={15} /></IconButton>}
          {candidate && <IconButton label="Ajouter au vivier" onClick={() => actions.onPool(app)}><Bookmark size={15} /></IconButton>}
        </div>
        <StatusMenu app={app} onMove={actions.onMove} />
      </div>
    </article>
  )
}

/** Ligne façon Mail (vue liste). */
export function ApplicationRow({ app, actions, messaging, busy, landed }: {
  app: Application
  actions: ApplicationCardActions
  messaging: boolean
  busy: boolean
  landed: boolean
}) {
  const candidate = app.candidate
  const name = candidate?.full_name ?? 'Candidat'
  const answers = prequalAnswers(app)
  return (
    <div className="osr-row flex flex-col sm:flex-row sm:items-center gap-3 px-3 py-3" data-landed={landed || undefined}
      style={{ opacity: busy ? 0.7 : 1, ...accentStyle(APP_STATUS_ACCENT[app.status] ?? ACCENT.mute) }}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Avatar name={name} src={candidate?.avatar_url} avatarConfig={candidate?.avatar_config} size={42} color={tint(ACCENT.indigo, 30)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[15px] font-semibold text-white truncate">{name}</span>
            {isBoosted(app) && <span className="osr-chip !h-5" style={{ color: ACCENT.orange, background: tint(ACCENT.orange, 16) }}><Rocket size={10} />Mis en avant</span>}
            <span className="ml-auto text-[12px] text-[var(--kz-mute)] shrink-0 sm:hidden">{timeAgo(app.created_at)}</span>
          </div>
          <div className="text-[13px] text-[var(--kz-mute)] truncate">
            {app.job?.title}{app.job?.company?.name ? ` · ${app.job.company.name}` : ''}<span className="hidden sm:inline"> · {timeAgo(app.created_at)}</span>
          </div>
          {app.cover_letter && <p className="text-[12px] text-[var(--kz-text)] opacity-75 mt-1 line-clamp-1">{app.cover_letter}</p>}
          {answers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {answers.map((a, i) => (
                <span key={i} className="osr-chip max-w-full"><span className="text-[var(--kz-mute)] truncate">{a.label}</span><strong className="font-semibold text-white truncate">{a.value}</strong></span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 pl-[54px] sm:pl-0">
        <StatusMenu app={app} onMove={actions.onMove} variant="pill" />
        <span className="w-px h-5 bg-white/10 mx-1.5" aria-hidden />
        <IconButton label="Synthèse IA" onClick={() => actions.onSummary(app)}><Sparkles size={15} className="text-[var(--kz-violet)]" /></IconButton>
        {candidate && (
          <IconButton label="Envoyer un message" onClick={() => actions.onMessage(candidate.id, app.job_id)} disabled={messaging}>
            {messaging ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <MessageCircle size={15} />}
          </IconButton>
        )}
        {candidate && <IconButton label="Planifier un entretien" onClick={() => actions.onSchedule(app)}><CalendarPlus size={15} /></IconButton>}
        {candidate && <IconButton label="Ajouter au vivier" onClick={() => actions.onPool(app)}><Bookmark size={15} /></IconButton>}
        {candidate && (
          <Tooltip content="Voir le profil">
            <Link href={`/recruiter/candidates/${candidate.id}`} aria-label="Voir le profil" className="osr-icon-btn"><ChevronRight size={16} /></Link>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

