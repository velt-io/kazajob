'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import Link from 'next/link'
import {
  MapPin, Phone, Mail, Check, X, Download, ExternalLink, Palette, Camera, User, FileText, Flame, Zap, Briefcase,
  Video, Rocket, RefreshCw, PenLine, Award,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarBuilder } from '@/components/ui/AvatarBuilder'
import { Modal } from '@/components/ui/Modal'
import { hasAvatarConfig, type AvatarConfig } from '@/lib/avatar'
import { FileUpload } from '@/components/ui/FileUpload'
import dynamic from 'next/dynamic'
import { KazaBoostButton } from '@/components/ui/KazaBoostButton'
import { ProfileBoostPaid } from '@/components/ui/ProfileBoostPaid'
import { KazaPortfolioSection } from '@/components/profile/KazaPortfolioSection'

// Import dynamique ssr:false pour éviter les erreurs MediaRecorder en prod
const VideoPitchRecorder = dynamic(
  () => import('@/components/ui/VideoPitchRecorder').then(m => ({ default: m.VideoPitchRecorder })),
  { ssr: false, loading: () => <div className="h-24 rounded-2xl osc-skeleton" /> }
)
import { useAuth } from '@/features/auth/useAuth'
import { useApplications } from '@/features/applications/useApplications'
import { useAvatarUpload, useCvUpload, uploadFile } from '@/features/profile/useUpload'
import { SOFT_SKILLS, HOBBIES } from '@/lib/constants'
import { SkillSelector } from '@/components/skills/SkillSelector'
import { computeCvCompletion } from '@/lib/cv'
import type { Skill } from '@/lib/types'
import { island } from '@/lib/island'
import { cn } from '@/lib/utils'
import { InsetGroup, InsetRow, Pill } from '@/components/os/candidate/primitives'

async function patchProfile(patch: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch(() => null)
  if (!res || !res.ok) {
    const data = await res?.json().catch(() => ({})) ?? {}
    return { ok: false, error: (data as { error?: string }).error ?? 'Connexion au serveur impossible' }
  }
  return { ok: true }
}

/** Anneau de complétion autour de l'avatar (dégradé « aurora »). */
function CompletionRing({ value, size }: { value: number; size: number }) {
  const stroke = 4
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90 pointer-events-none" aria-hidden>
      <defs>
        <linearGradient id="osc-profile-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--kz-orange)" />
          <stop offset="50%" stopColor="var(--kz-violet)" />
          <stop offset="100%" stopColor="var(--kz-blue)" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--kz-line)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#osc-profile-ring)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} className="osc-ring-draw" style={{ '--osc-circ': circ } as CSSProperties} />
    </svg>
  )
}

/** Puce sélectionnable (édition des savoir-être / loisirs). */
function ToggleChip({ on, label, color, onClick }: { on: boolean; label: string; color: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={cn('osc-press inline-flex items-center gap-1 h-8 px-3 rounded-full text-[13px] font-medium border transition-colors',
        on ? 'text-white border-transparent' : 'text-[var(--kz-text)] border-[var(--kz-edge)] bg-[var(--osc-surface)] hover:bg-[var(--osc-surface-hi)]')}
      style={on ? { background: color } : undefined}>
      {on && <Check size={13} strokeWidth={3} />}{label}
    </button>
  )
}

export default function CandidateProfilePage() {
  const { profile, refetch } = useAuth()
  const { applications } = useApplications(profile?.id)
  const { upload: uploadAvatar, uploading: uploadingAvatar } = useAvatarUpload(profile?.id)
  const { upload: uploadCv, uploading: uploadingCv, progress: cvProgress, getSignedUrl } = useCvUpload(profile?.id)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [skills, setSkills] = useState<Skill[]>([])
  const [softSkills, setSoftSkills] = useState<string[]>([])
  const [hobbies, setHobbies] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [cvFileName, setCvFileName] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      // Logique d'origine conservée : synchronise le formulaire avec le profil chargé.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(profile.full_name ?? '')
      setBio(profile.bio ?? '')
      setLocation(profile.location ?? '')
      setPhone(profile.phone ?? '')
      setSoftSkills(profile.soft_skills ?? [])
      setHobbies(profile.hobbies ?? [])
    }
  }, [profile])

  useEffect(() => {
    if (!profile?.id) return
    const fetchSkills = async () => {
      const res = await fetch('/api/candidate-skills')
      if (res.ok) setSkills(((await res.json()) as Skill[]).filter(Boolean))
    }
    fetchSkills()
  }, [profile?.id])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setSaveError(null)
    const { ok, error } = await patchProfile({
      full_name: fullName, bio, location, phone,
      soft_skills: softSkills, hobbies,
    })
    if (!ok) {
      setSaveError(error ?? 'Échec de l\'enregistrement')
      setSaving(false)
      return
    }
    await refetch?.()
    setSaving(false)
    setEditing(false)
  }

  const handleAvatarFile = async (file: File) => {
    setUploadError(null)
    const { error } = await uploadAvatar(file)
    if (error) { setUploadError(error); return }
    // La photo remplace le personnage : sinon l'avatar DiceBear resterait prioritaire.
    if (hasAvatarConfig(profile?.avatar_config)) await patchProfile({ avatar_config: null })
    await refetch?.()
  }

  const handleSaveAvatar = async (config: AvatarConfig) => {
    setUploadError(null)
    setSavingAvatar(true)
    const { ok, error } = await patchProfile({ avatar_config: config })
    setSavingAvatar(false)
    if (!ok) { setUploadError(error ?? "Échec de l'enregistrement de l'avatar"); return }
    await refetch?.()
    setAvatarOpen(false)
    island({ title: 'Avatar enregistré', subtitle: 'Il te représente partout', tone: 'success' })
  }

  const handleCvFile = async (file: File) => {
    setUploadError(null)
    setCvFileName(file.name)
    const { error } = await uploadCv(file)
    if (error) { setUploadError(error); setCvFileName(null) }
    else await refetch?.()
  }

  const handleDownloadCv = async () => {
    if (!profile?.cv_url) return
    const url = await getSignedUrl(profile.cv_url)
    if (url) window.open(url, '_blank')
  }

  const handleVideoPitchUpload = async (blob: Blob, mimeType: string) => {
    if (!profile?.id) return { url: null, error: 'Non authentifié' }
    const file = new File([blob], 'pitch.webm', { type: mimeType })
    const { url, error } = await uploadFile(file, 'video-pitches')
    if (error || !url) return { url: null, error: error ?? 'Échec de l’upload' }
    const patch = await patchProfile({ video_pitch_url: url })
    if (!patch.ok) return { url: null, error: patch.error ?? 'Échec de l\'enregistrement' }
    await refetch?.()
    return { url, error: null }
  }

  const handleVideoPitchDelete = async () => {
    if (!profile?.id) return
    const { ok } = await patchProfile({ video_pitch_url: null })
    if (ok) await refetch?.()
  }

  const addSkill = async (skill: Skill) => {
    if (!profile?.id || skills.find(s => s.id === skill.id)) return
    const res = await fetch('/api/candidate-skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: skill.id }),
    })
    if (!res.ok) return
    setSkills(prev => [...prev, skill])
  }

  const removeSkill = async (skillId: string) => {
    if (!profile?.id) return
    const res = await fetch(`/api/candidate-skills?skillId=${skillId}`, { method: 'DELETE' })
    if (!res.ok) return
    setSkills(prev => prev.filter(s => s.id !== skillId))
  }

  const profileScore = computeCvCompletion(profile ?? {})

  const hasCv = !!profile?.cv_url
  const hasCvBuilder = !!profile?.cv_data

  const badges = [
    (profile?.streak ?? 0) > 0 && { tone: 'orange' as const, label: `Série de ${profile!.streak} j` },
    (profile?.xp ?? 0) >= 1000 && { tone: 'violet' as const, label: `Niveau ${Math.floor((profile!.xp) / 1000) + 1}` },
    profileScore >= 80 && { tone: 'green' as const, label: 'Profil complet' },
    hasCv && { tone: 'blue' as const, label: 'CV en ligne' },
    !!profile?.video_pitch_url && { tone: 'orange' as const, label: 'Pitch vidéo' },
    applications.length >= 5 && { tone: 'yellow' as const, label: `${applications.length} candidatures` },
  ].filter(Boolean) as { tone: 'orange' | 'violet' | 'green' | 'blue' | 'yellow'; label: string }[]

  const inputCls = 'osc-inline-input text-right'

  return (
    <div className="max-w-[1080px] mx-auto">
      {/* ── Barre de titre façon Réglages : Modifier / OK ── */}
      <header className="flex items-end justify-between gap-4 mb-7">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--kz-mute)]">Compte</p>
          <h1 className="text-[34px] sm:text-[44px] lg:text-[52px] font-semibold tracking-[-0.05em] leading-[1.02] text-[var(--kz-ink)] mt-1">Mon profil</h1>
        </div>
        {!editing ? (
          <Button kind="outline" size="md" icon={<PenLine size={15} />} onClick={() => setEditing(true)}>Modifier</Button>
        ) : (
          <div className="flex gap-2 osc-fade">
            <Button kind="ghost" size="md" onClick={() => setEditing(false)}>Annuler</Button>
            <Button kind="primary" size="md" icon={<Check size={15} />} loading={saving} onClick={handleSave}>OK</Button>
          </div>
        )}
      </header>

      {(saveError || uploadError) && (
        <div className="osc-drop flex flex-col gap-2 mb-5">
          {saveError && <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><X size={15} />{saveError}</div>}
          {uploadError && <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"><X size={15} />{uploadError}</div>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-7 items-start">
        {/* ── Carte identité (façon identifiant Apple) ── */}
        <aside className="flex flex-col gap-5">
          <div className="osc-mesh relative overflow-hidden rounded-[30px] border border-[var(--kz-edge)] p-6 text-center shadow-[var(--os-elevation)]">
            <div className="relative mx-auto w-[132px] h-[132px] flex items-center justify-center">
              <CompletionRing value={profileScore} size={132} />
              <div className="relative">
                <Avatar name={profile?.full_name ?? 'KZ'} src={profile?.avatar_url} avatarConfig={profile?.avatar_config} size={108} color="color-mix(in srgb, var(--kz-ink) 12%, transparent)" />
                {/* Zone de clic pour changer l'avatar */}
                <FileUpload
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeMb={5}
                  onFile={handleAvatarFile}
                  variant="avatar"
                  uploading={uploadingAvatar}
                  className="absolute inset-0 rounded-full"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-9 h-9 rounded-full flex items-center justify-center bg-[var(--kz-ink)] text-[var(--kz-inverse)] border-[3px] border-[var(--kz-cream)] pointer-events-none" aria-hidden>
                <Camera size={15} />
              </span>
            </div>

            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--kz-ink)] mt-4 truncate">{profile?.full_name}</h2>
            <p className="text-[14px] text-[var(--kz-mute)] truncate">{profile?.email}</p>
            <p className="text-[13px] text-[var(--kz-text)] mt-1 inline-flex items-center gap-1"><MapPin size={13} className="text-[var(--kz-mute)]" />{profile?.location ?? 'La Réunion'}</p>
            {uploadingAvatar && <p className="text-[12px] text-[var(--kz-mute)] mt-2 osc-fade">Envoi de la photo…</p>}

            <div className="flex justify-center mt-4">
              <Button kind="outline" size="sm" icon={<Palette size={13} />} onClick={() => setAvatarOpen(true)}>
                {hasAvatarConfig(profile?.avatar_config) ? 'Modifier mon perso' : 'Créer mon perso'}
              </Button>
            </div>
            <p className="text-[11px] text-[var(--kz-mute)] mt-3">Touche l&apos;avatar pour utiliser une photo</p>

            <div className="mt-5 pt-4 border-t border-[var(--kz-line)]">
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-[var(--kz-text)]">Profil complété</span>
                <span className="font-semibold os-text-aurora tabular-nums">{profileScore} %</span>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="osc-card grid grid-cols-3 divide-x divide-[var(--osc-hairline)] py-4">
            {[
              { v: (profile?.xp ?? 0).toLocaleString('fr-FR'), l: 'XP', icon: <Zap size={13} />, c: 'var(--kz-violet)' },
              { v: profile?.streak ?? 0, l: 'Jours de série', icon: <Flame size={13} />, c: 'var(--kz-orange)' },
              { v: applications.length, l: 'Candidatures', icon: <Briefcase size={13} />, c: 'var(--kz-blue)' },
            ].map((s) => (
              <div key={s.l} className="text-center px-2 min-w-0">
                <div className="inline-flex items-center justify-center" style={{ color: s.c }}>{s.icon}</div>
                <div className="text-[22px] font-semibold tracking-[-0.04em] text-[var(--kz-ink)] tabular-nums leading-tight">{String(s.v)}</div>
                <div className="text-[11px] text-[var(--kz-mute)] truncate">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Badges */}
          <InsetGroup title="Badges">
            <div className="p-4 flex flex-wrap gap-2">
              {badges.length > 0
                ? badges.map((b) => <Pill key={b.label} tone={b.tone} className="h-7 text-[12px]"><Award size={12} />{b.label}</Pill>)
                : <p className="text-[13px] text-[var(--kz-mute)]">Complète ton profil pour obtenir des badges.</p>}
            </div>
          </InsetGroup>
        </aside>

        {/* ── Listes groupées (façon Réglages iOS) ── */}
        <div className="flex flex-col gap-7 min-w-0">
          <InsetGroup title="Informations personnelles" footer={editing ? 'Les modifications seront enregistrées en touchant OK.' : undefined}>
            <InsetRow icon={<User size={16} />} iconBg="var(--kz-blue)" label="Nom">
              {editing
                ? <input aria-label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Ton nom" />
                : <span className="text-[15px] text-[var(--kz-mute)] truncate text-right">{profile?.full_name || '—'}</span>}
            </InsetRow>
            <InsetRow icon={<Mail size={16} />} iconBg="var(--kz-violet)" label="E-mail" value={profile?.email} />
            <InsetRow icon={<Phone size={16} />} iconBg="var(--kz-green)" label="Téléphone">
              {editing
                ? <input aria-label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+262 692 …" inputMode="tel" />
                : <span className="text-[15px] text-[var(--kz-mute)] truncate text-right">{profile?.phone || '—'}</span>}
            </InsetRow>
            <InsetRow icon={<MapPin size={16} />} iconBg="var(--kz-orange)" label="Ville">
              {editing
                ? <input aria-label="Localisation" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="Saint-Denis" />
                : <span className="text-[15px] text-[var(--kz-mute)] truncate text-right">{profile?.location || '—'}</span>}
            </InsetRow>
            <InsetRow icon={<PenLine size={16} />} iconBg="var(--kz-mute)" label="Présentation" stacked>
              {editing
                ? <textarea aria-label="Bio / Présentation" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Parle de toi en quelques lignes…"
                    className="osc-inline-input resize-none leading-relaxed" />
                : <p className="text-[15px] leading-relaxed text-[var(--kz-text)]">{profile?.bio || <span className="text-[var(--kz-mute)]">Aucune présentation — touche Modifier</span>}</p>}
            </InsetRow>
          </InsetGroup>

          <InsetGroup title="Compétences" clip={false} footer="Elles alimentent le score de compatibilité avec les offres.">
            <div className="p-4">
              <SkillSelector selected={skills} onAdd={addSkill} onRemove={removeSkill} placeholder="Rechercher React, Python, Figma…" />
            </div>
          </InsetGroup>

          <InsetGroup title="Savoir-être" footer="Visible sur ton CV.">
            <div className="p-4">
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {SOFT_SKILLS.map(s => {
                    const on = softSkills.includes(s)
                    return <ToggleChip key={s} on={on} label={s} color="var(--kz-violet)" onClick={() => setSoftSkills(prev => on ? prev.filter(x => x !== s) : [...prev, s])} />
                  })}
                </div>
              ) : softSkills.length === 0 ? (
                <p className="text-[14px] text-[var(--kz-mute)]">Aucun savoir-être — touche Modifier pour en ajouter.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {softSkills.map(s => <Pill key={s} tone="violet" className="h-7 text-[12px]">{s}</Pill>)}
                </div>
              )}
            </div>
          </InsetGroup>

          <InsetGroup title="Loisirs" footer="Centres d'intérêt, visibles sur ton CV.">
            <div className="p-4">
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {HOBBIES.map(h => {
                    const on = hobbies.includes(h)
                    return <ToggleChip key={h} on={on} label={h} color="var(--kz-green)" onClick={() => setHobbies(prev => on ? prev.filter(x => x !== h) : [...prev, h])} />
                  })}
                </div>
              ) : hobbies.length === 0 ? (
                <p className="text-[14px] text-[var(--kz-mute)]">Aucun loisir — touche Modifier pour en ajouter.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {hobbies.map(h => <Pill key={h} tone="green" className="h-7 text-[12px]">{h}</Pill>)}
                </div>
              )}
            </div>
          </InsetGroup>

          {/* CV */}
          <InsetGroup title="Mon CV">
            {/* CV Builder (cv_data) */}
            {hasCvBuilder && (
              <Link href="/premiers-pas/cv" className="block">
                <InsetRow icon={<FileText size={16} />} iconBg="var(--kz-violet)" label="CV Builder" value="Modifier / Télécharger" chevron className="hover:bg-[var(--osc-surface)]" />
              </Link>
            )}

            {/* CV uploadé (cv_url) */}
            {hasCv ? (
              <>
                <InsetRow icon={<Check size={16} strokeWidth={3} />} iconBg="var(--kz-green)" label={<span className="truncate">{cvFileName ?? 'CV importé'}</span>} />
                <InsetRow icon={<Download size={16} />} iconBg="var(--kz-blue)" label="Télécharger" chevron onClick={handleDownloadCv} />
                <InsetRow icon={<RefreshCw size={16} />} iconBg="var(--kz-mute)" label="Changer" chevron onClick={() => setCvFileName(null)} />
              </>
            ) : !hasCvBuilder ? (
              <div className="p-4 flex flex-col gap-3">
                <Link href="/premiers-pas/cv">
                  <Button kind="primary" size="md" full icon={<ExternalLink size={14} />}>
                    Créer mon CV avec le Builder
                  </Button>
                </Link>
                <div className="flex items-center gap-3 text-[12px] text-[var(--kz-mute)]"><span className="h-px flex-1 bg-[var(--kz-line)]" />ou<span className="h-px flex-1 bg-[var(--kz-line)]" /></div>
                <FileUpload
                  accept=".pdf,.doc,.docx"
                  maxSizeMb={10}
                  hint="PDF ou Word · max 10 Mo"
                  onFile={handleCvFile}
                  uploading={uploadingCv}
                  progress={cvProgress}
                  currentFileName={cvFileName ?? undefined}
                />
              </div>
            ) : null}

            {/* Permettre un nouvel upload si on veut changer */}
            {hasCv && !cvFileName && (
              <div className="p-4">
                <FileUpload
                  accept=".pdf,.doc,.docx"
                  maxSizeMb={10}
                  hint="Remplacer par un nouveau CV"
                  onFile={handleCvFile}
                  uploading={uploadingCv}
                  progress={cvProgress}
                />
              </div>
            )}
          </InsetGroup>

          {/* Pitch vidéo */}
          <InsetGroup
            title={<span className="inline-flex items-center gap-2"><Video size={13} />Pitch vidéo <span className="normal-case tracking-normal font-medium text-[var(--kz-orange)]">60 s max</span></span>}
            footer="Présente-toi en 60 secondes. Les recruteurs voient ton pitch directement sur ton profil : un vrai atout pour te démarquer."
          >
            <div className="p-4">
              <VideoPitchRecorder
                currentUrl={profile?.video_pitch_url ?? null}
                onUpload={handleVideoPitchUpload}
                onDelete={handleVideoPitchDelete}
              />
            </div>
          </InsetGroup>

          {/* KazaPortfolio */}
          <KazaPortfolioSection profile={profile as unknown as Record<string, unknown> | null} onSaved={refetch} />

          {/* KazaBoost */}
          <InsetGroup
            title={<span className="inline-flex items-center gap-2"><Rocket size={13} />KazaBoost <span className="normal-case tracking-normal font-medium text-[var(--kz-yellow)]">48 h</span></span>}
            footer="Pas assez d'XP ou besoin de plus longtemps ? Opte pour le boost premium (7 à 30 jours)."
          >
            <div className="p-4">
              <p className="text-[14px] text-[var(--kz-text)] mb-3 leading-relaxed">
                Booste ton profil et apparais en priorité dans les recherches des recruteurs pendant 48 h.
              </p>
              {profile && (
                <KazaBoostButton
                  profileId={profile.id}
                  xp={profile.xp ?? 0}
                  boostedUntil={profile.boosted_until ?? null}
                  onBoost={refetch}
                />
              )}
            </div>
            {/* Boost premium payant (durée longue) */}
            <div className="p-4">
              {profile && <ProfileBoostPaid boostedUntil={profile.boosted_until ?? null} />}
            </div>
          </InsetGroup>
        </div>
      </div>

      <Modal open={avatarOpen} onClose={() => setAvatarOpen(false)} title="Mon personnage Kazajob" size="lg">
        {avatarOpen && (
          <AvatarBuilder
            initialConfig={profile?.avatar_config}
            onSave={handleSaveAvatar}
            onCancel={() => setAvatarOpen(false)}
            saving={savingAvatar}
          />
        )}
      </Modal>
    </div>
  )
}
