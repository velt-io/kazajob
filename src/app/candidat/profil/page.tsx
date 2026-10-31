'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Mail, Edit3, Check, X, Download, ExternalLink, Palette, Camera, Crown, Flame, Sparkles, Swords, ScrollText, FileText, Video, Backpack, Gem, Heart, User, Rocket, Shield, Lock, Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
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
  { ssr: false, loading: () => <div className="h-24 rounded-xl bg-[var(--kz-cream2)] animate-pulse" /> }
)
import { useAuth } from '@/features/auth/useAuth'
import { useApplications } from '@/features/applications/useApplications'
import { useAvatarUpload, useCvUpload, uploadFile } from '@/features/profile/useUpload'
import { SOFT_SKILLS, HOBBIES } from '@/lib/constants'
import { SkillSelector } from '@/components/skills/SkillSelector'
import { computeCvCompletion } from '@/lib/cv'
import { getLevel, getNextLevel, getXpProgress } from '@/lib/gamification'
import { ARCHETYPES, type ArchetypeKey } from '@/lib/quiz'
import type { Skill } from '@/lib/types'
import { island } from '@/lib/island'
import { PanelTitle, QuestPageHeader } from '@/components/quest/candidat/QuestKit'

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
    island({ title: 'Feuille de personnage mise à jour', subtitle: 'Ton héros gagne en renommée', tone: 'success' })
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
    island({ title: 'Ton héros a pris vie', subtitle: 'Avatar enregistré', tone: 'success' })
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
    island({ title: `Talent forgé : ${skill.name}`, subtitle: 'Il déclenchera de nouveaux matchs', tone: 'info' })
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

  // Présentation « fiche de personnage » (valeurs réelles du compte)
  const xp = profile?.xp ?? 0
  const streak = profile?.streak ?? 0
  const level = getLevel(xp)
  const nextLevel = getNextLevel(xp)
  const xpProgress = getXpProgress(xp)
  const archetype = profile?.quiz_result?.archetype ? ARCHETYPES[profile.quiz_result.archetype as ArchetypeKey] : undefined
  const trophies = [
    { earned: streak > 0,              icon: Flame,      label: streak > 0 ? `Série ${streak} j` : 'Série active', color: '#FB923C' },
    { earned: xp >= 1000,              icon: Crown,      label: xp >= 1000 ? `Niveau ${Math.floor(xp / 1000) + 1}` : 'Niveau 2',       color: '#C084FC' },
    { earned: profileScore >= 80,      icon: ScrollText, label: 'Profil complet', color: '#4ADE80' },
    { earned: hasCv,                   icon: FileText,   label: 'CV uploadé',     color: '#22D3EE' },
    { earned: !!profile?.video_pitch_url, icon: Video,   label: 'Pitch vidéo',    color: '#F472B6' },
    { earned: applications.length >= 5, icon: Swords,    label: applications.length >= 5 ? `${applications.length} candidatures` : '5 candidatures', color: '#FACC15' },
  ]

  return (
    <div className="max-w-[1180px] mx-auto">
      <QuestPageHeader
        eyebrow="Fiche du héros"
        title="Feuille de"
        accent="personnage"
        icon={<User size={20} />}
        subtitle="Identité, talents et inventaire : ce que les recruteurs découvrent de toi."
      >
        {!editing ? (
          <Button kind="outline" size="md" icon={<Edit3 size={15} />} onClick={() => setEditing(true)}>Modifier</Button>
        ) : (
          <>
            <Button kind="soft" size="md" onClick={() => setEditing(false)}>Annuler</Button>
            <Button kind="primary" size="md" icon={<Check size={15} />} loading={saving} onClick={handleSave}>Sauvegarder</Button>
          </>
        )}
      </QuestPageHeader>

      {saveError && (
        <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <X size={15} />{saveError}
        </div>
      )}

      {uploadError && (
        <div role="alert" className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <X size={15} />{uploadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-5">
        {/* ── Colonne gauche : le héros ── */}
        <div className="flex flex-col gap-5 min-w-0">
          <div className="qx-panel p-5 sm:p-6 text-center overflow-hidden qx-rise">
            <div aria-hidden className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(232,121,249,0.25),transparent)] pointer-events-none rounded-t-[18px]" />
            <div className="relative flex justify-center mt-3 mb-5">
              <div className="qxc-portrait">
                <Avatar name={profile?.full_name ?? 'KZ'} src={profile?.avatar_url} avatarConfig={profile?.avatar_config} size={112} color="var(--kz-violet-soft)" badge />
                {/* Zone de clic pour changer l'avatar */}
                <FileUpload
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeMb={5}
                  onFile={handleAvatarFile}
                  variant="avatar"
                  uploading={uploadingAvatar}
                  className="absolute inset-0 rounded-full z-10"
                />
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1 h-6 px-2.5 rounded-md text-[11px] font-bold text-[#1A0B2E] bg-[linear-gradient(120deg,#FDE68A,#FACC15,#F59E0B)] shadow-[0_0_14px_rgba(250,204,21,0.7)] whitespace-nowrap pointer-events-none">
                  <Crown size={11} aria-hidden />Niv. {level.level}
                </span>
              </div>
            </div>
            {uploadingAvatar && (
              <p className="text-xs text-[var(--kz-mute)] mb-2">Upload de la photo...</p>
            )}
            <div className="relative text-[22px] font-bold text-white font-[family-name:var(--font-epic)] leading-tight break-words">{profile?.full_name}</div>
            <div className="relative text-[13px] font-semibold mt-1" style={{ color: archetype ? `color-mix(in srgb, ${archetype.color} 70%, white)` : 'var(--qx-neon)' }}>
              {level.title}{archetype ? ` · ${archetype.label}` : ''}
            </div>
            <div className="relative text-xs text-[var(--kz-mute)] mt-1 flex items-center justify-center gap-1"><MapPin size={11} aria-hidden />{profile?.location ?? 'La Reunion'}</div>
            {!archetype && (
              <Link href="/candidat/quiz" className="relative mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--qx-cyan)] hover:text-white">
                <Compass size={11} aria-hidden />Découvre ta classe en 2 min
              </Link>
            )}

            <div className="relative flex justify-center gap-2 mt-4">
              <Button kind="outline" size="sm" icon={<Palette size={13} />} onClick={() => setAvatarOpen(true)}>
                {hasAvatarConfig(profile?.avatar_config) ? 'Modifier mon perso' : 'Créer mon perso'}
              </Button>
            </div>

            <div className="relative mt-5 text-left flex flex-col gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold uppercase tracking-[0.12em] text-[var(--kz-mute)]">Expérience</span>
                  <span className="font-bold text-[var(--qx-gold)] tabular-nums">{xp.toLocaleString('fr-FR')} XP</span>
                </div>
                <div className="qx-xp" role="progressbar" aria-valuenow={xpProgress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progression vers ${nextLevel.title}`}><span style={{ width: `${Math.max(xpProgress, 3)}%` }} /></div>
                <div className="text-[10px] text-[var(--kz-mute)] mt-1">{xpProgress} % vers {nextLevel.title}</div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-bold uppercase tracking-[0.12em] text-[var(--kz-mute)]">Profil complété</span>
                  <span className="font-bold text-white tabular-nums">{profileScore} %</span>
                </div>
                <div className="qxc-stat" style={{ ['--r' as string]: '#4ADE80' }} role="progressbar" aria-valuenow={profileScore} aria-valuemin={0} aria-valuemax={100} aria-label="Profil complété"><span style={{ width: `${profileScore}%` }} /></div>
              </div>
            </div>

            <p className="relative text-[11px] text-[var(--kz-mute)] mt-4 flex items-center justify-center gap-1">
              <Camera size={11} aria-hidden /> Clique sur l&apos;avatar pour utiliser une photo
            </p>
          </div>

          {/* Caractéristiques */}
          <div className="qx-panel p-5">
            <PanelTitle icon={<Gem size={13} />} as="h2">Caractéristiques</PanelTitle>
            <dl className="grid grid-cols-2 gap-2.5">
              {[
                { v: xp.toLocaleString('fr-FR'), l: 'XP total', icon: Sparkles, c: '#FACC15' },
                { v: streak, l: 'Jours de série', icon: Flame, c: '#FB923C' },
                { v: skills.length, l: 'Talents', icon: Gem, c: '#22D3EE' },
                { v: applications.length, l: 'Candidatures', icon: Swords, c: '#C084FC' },
              ].map((s) => (
                <div key={s.l} className="p-3 rounded-xl border bg-[rgba(12,5,24,0.5)]" style={{ borderColor: `color-mix(in srgb, ${s.c} 30%, transparent)` }}>
                  <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--kz-mute)]"><s.icon size={11} style={{ color: s.c }} aria-hidden />{s.l}</dt>
                  <dd className="text-[22px] font-bold text-white font-[family-name:var(--font-epic)] mt-0.5 tabular-nums">{String(s.v)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Trophées */}
          <div className="qx-panel p-5">
            <PanelTitle icon={<Crown size={13} />} as="h2" extra={<span className="text-[11px] font-bold text-[var(--kz-mute)]">{trophies.filter(t => t.earned).length}/{trophies.length}</span>}>Trophées</PanelTitle>
            <ul className="grid grid-cols-3 gap-2">
              {trophies.map((t) => (
                <li key={t.label} className="qxc-trophy" data-earned={t.earned} style={{ ['--r' as string]: t.color }} aria-label={`${t.label}${t.earned ? ' : obtenu' : ' : à débloquer'}`}>
                  <span className="w-8 h-8 rounded-md rotate-45 grid place-items-center border" style={{ borderColor: `color-mix(in srgb, ${t.color} 60%, transparent)`, background: `color-mix(in srgb, ${t.color} 14%, transparent)`, color: t.color }}>
                    <span className="-rotate-45 inline-flex">{t.earned ? <t.icon size={14} /> : <Lock size={12} />}</span>
                  </span>
                  <span className="text-[10px] font-bold leading-tight">{t.label}</span>
                </li>
              ))}
            </ul>
            {streak === 0 && xp === 0 && !hasCv && (
              <p className="text-xs text-[var(--kz-mute)] mt-3">Complète ton profil pour obtenir des trophées.</p>
            )}
          </div>

          {/* KazaBoost */}
          <div className="qx-panel p-5">
            <PanelTitle icon={<Rocket size={13} />} color="var(--qx-magenta)" as="h2"
              extra={<span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#FACC15]/45 text-[#FDE68A] bg-[rgba(250,204,21,0.1)]">48h</span>}>
              KazaBoost
            </PanelTitle>
            <p className="text-xs text-[var(--kz-mute)] mb-3 leading-relaxed">
              Élixir de renommée : apparais en priorité dans les recherches recruteurs pendant 48h.
            </p>
            {profile && (
              <KazaBoostButton
                profileId={profile.id}
                xp={profile.xp ?? 0}
                boostedUntil={profile.boosted_until ?? null}
                onBoost={refetch}
              />
            )}

            {/* Boost premium payant (durée longue) */}
            <div className="mt-3 pt-3 border-t border-[#C084FC]/20">
              <p className="text-[11px] text-[var(--kz-mute)] mb-2 leading-relaxed">
                Pas assez d&apos;XP ou besoin de plus longtemps ? Optez pour le boost premium (7 à 30 jours).
              </p>
              {profile && <ProfileBoostPaid boostedUntil={profile.boosted_until ?? null} />}
            </div>
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div className="flex flex-col gap-5 min-w-0">
          {/* Identité */}
          <div className={`qx-panel p-5 sm:p-6 transition-shadow ${editing ? 'qxc-editing' : ''}`}>
            <PanelTitle icon={<User size={13} />} extra={editing ? <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--qx-cyan)]">Édition</span> : null}>Identité</PanelTitle>
            {editing ? (
              <div className="flex flex-col gap-4">
                <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Textarea label="Bio / Presentation" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Parle de toi en quelques lignes..." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Localisation" value={location} onChange={(e) => setLocation(e.target.value)} icon={<MapPin size={15} />} placeholder="Saint-Denis" />
                  <Input label="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={15} />} placeholder="+262 692 ..." />
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--kz-mute)] mb-1">Nom complet</dt>
                  <dd className="text-sm font-semibold text-white">{profile?.full_name || '—'}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--kz-mute)] mb-1">Email</dt>
                  <dd className="flex items-center gap-2 text-sm text-[var(--kz-ink)] min-w-0"><Mail size={13} className="shrink-0 text-[var(--kz-mute)]" aria-hidden /><span className="truncate">{profile?.email}</span></dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--kz-mute)] mb-1">Bio</dt>
                  <dd className="text-sm text-[var(--kz-text)] leading-relaxed break-words">{profile?.bio || <span className="text-[var(--kz-mute)] italic">Aucune bio — clique sur Modifier</span>}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--kz-mute)] mb-1">Localisation</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-[var(--kz-ink)]"><MapPin size={13} className="text-[var(--qx-cyan)]" aria-hidden />{profile?.location || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--kz-mute)] mb-1">Telephone</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-[var(--kz-ink)]"><Phone size={13} className="text-[var(--kz-mute)]" aria-hidden />{profile?.phone || '—'}</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Talents */}
          <div className="qx-panel p-5 sm:p-6">
            <PanelTitle icon={<Gem size={13} />} color="var(--qx-cyan)"
              extra={<span className="text-[11px] font-bold text-[#67E8F9]">{skills.length} talent{skills.length > 1 ? 's' : ''}</span>}>
              Talents
            </PanelTitle>
            <p className="text-xs text-[var(--kz-mute)] -mt-2 mb-4">Tes compétences : ce sont elles qui déclenchent les matchs avec les offres.</p>
            <SkillSelector selected={skills} onAdd={addSkill} onRemove={removeSkill} placeholder="Rechercher React, Python, Figma..." />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Aptitudes (soft skills) */}
            <div className={`qx-panel p-5 transition-shadow ${editing ? 'qxc-editing' : ''}`}>
              <PanelTitle icon={<Shield size={13} />} color="var(--qx-neon)">Aptitudes</PanelTitle>
              <p className="text-xs text-[var(--kz-mute)] -mt-2 mb-4">Soft skills · savoir-être, visible sur ton CV.</p>
              {editing ? (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Soft skills">
                  {SOFT_SKILLS.map(s => {
                    const on = softSkills.includes(s)
                    return (
                      <button key={s} type="button" aria-pressed={on}
                        onClick={() => setSoftSkills(prev => on ? prev.filter(x => x !== s) : [...prev, s])}
                        className="qxc-chip h-8">
                        {on && <Check size={11} aria-hidden />}{s}
                      </button>
                    )
                  })}
                </div>
              ) : softSkills.length === 0 ? (
                <div className="qxc-slot text-sm text-[var(--kz-mute)] py-5 text-center">
                  Aucune aptitude — clique sur &quot;Modifier&quot;.
                </div>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {softSkills.map(s => (
                    <li key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-white border border-[#C084FC]/40 bg-[rgba(168,85,247,0.14)]">
                      <span className="qxc-gem" style={{ ['--r' as string]: 'var(--qx-neon)' }} aria-hidden />{s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Passions (loisirs) */}
            <div className={`qx-panel p-5 transition-shadow ${editing ? 'qxc-editing' : ''}`}>
              <PanelTitle icon={<Heart size={13} />} color="#4ADE80">Passions</PanelTitle>
              <p className="text-xs text-[var(--kz-mute)] -mt-2 mb-4">Loisirs · centres d&apos;intérêt, visibles sur ton CV.</p>
              {editing ? (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Loisirs">
                  {HOBBIES.map(h => {
                    const on = hobbies.includes(h)
                    return (
                      <button key={h} type="button" aria-pressed={on}
                        onClick={() => setHobbies(prev => on ? prev.filter(x => x !== h) : [...prev, h])}
                        className="qxc-chip h-8">
                        {on && <Check size={11} aria-hidden />}{h}
                      </button>
                    )
                  })}
                </div>
              ) : hobbies.length === 0 ? (
                <div className="qxc-slot text-sm text-[var(--kz-mute)] py-5 text-center">
                  Aucune passion — clique sur &quot;Modifier&quot;.
                </div>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {hobbies.map(h => (
                    <li key={h} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-white border border-[#4ADE80]/35 bg-[rgba(74,222,128,0.1)]">
                      <span className="qxc-gem" style={{ ['--r' as string]: '#4ADE80' }} aria-hidden />{h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Inventaire */}
          <div className="qx-panel p-5 sm:p-6">
            <PanelTitle icon={<Backpack size={13} />}>Inventaire</PanelTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Parchemin : CV */}
              <div className="qxc-slot p-4" data-filled={hasCv || hasCvBuilder} style={{ ['--r' as string]: 'var(--qx-cyan)' }}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                  <ScrollText size={15} className="text-[var(--qx-cyan)]" aria-hidden />Parchemin · Mon CV
                </h3>

                {/* CV Builder (cv_data) */}
                {hasCvBuilder && (
                  <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[#A855F7]/45 bg-[rgba(168,85,247,0.14)]">
                      <Check size={16} className="text-[var(--qx-neon)]" aria-hidden />
                      <span className="text-sm font-semibold text-[var(--kz-ink)] flex-1">CV Builder — créé</span>
                    </div>
                    <Link href="/premiers-pas/cv"
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold uppercase tracking-[0.08em] text-white border border-[#C084FC]/60 bg-[#6D28D9] shadow-[0_0_20px_-6px_rgba(168,85,247,0.8)] hover:bg-[#7C3AED] transition">
                      <ExternalLink size={13} aria-hidden />Modifier / Télécharger
                    </Link>
                  </div>
                )}

                {/* CV uploadé (cv_url) */}
                {hasCv ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[#4ADE80]/40 bg-[rgba(74,222,128,0.1)]">
                      <Check size={16} className="text-[#86EFAC]" aria-hidden />
                      <span className="text-sm font-semibold text-[var(--kz-ink)] flex-1 min-w-0 truncate">
                        {cvFileName ?? 'CV uploadé'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button kind="soft" size="sm" full icon={<Download size={13} />} onClick={handleDownloadCv}>
                        Télécharger
                      </Button>
                      <Button kind="outline" size="sm" icon={<ExternalLink size={13} />} onClick={() => setCvFileName(null)}>
                        Changer
                      </Button>
                    </div>
                  </div>
                ) : !hasCvBuilder ? (
                  <div className="flex flex-col gap-2">
                    <Link href="/premiers-pas/cv"
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold uppercase tracking-[0.08em] text-white border border-[#F0ABFC]/60 bg-[linear-gradient(120deg,#7C3AED,#A855F7_45%,#E879F9)] shadow-[0_0_22px_-4px_rgba(232,121,249,0.75)] hover:-translate-y-0.5 transition">
                      <ExternalLink size={13} aria-hidden />Créer mon CV avec le Builder
                    </Link>
                    <div className="text-center text-xs text-[var(--kz-mute)] py-1">ou</div>
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
                  <div className="mt-3">
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
              </div>

              {/* Cristal : pitch vidéo */}
              <div className="qxc-slot p-4" data-filled={!!profile?.video_pitch_url} style={{ ['--r' as string]: '#F472B6' }}>
                <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                  <Video size={15} className="text-[#F472B6]" aria-hidden />Cristal · Pitch vidéo
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#FB923C]/45 text-[#FDBA74] bg-[rgba(251,146,60,0.12)]">60s max</span>
                </h3>
                <p className="text-xs text-[var(--kz-mute)] mb-3 leading-relaxed">
                  Présente-toi en 60 secondes. Les recruteurs peuvent voir ton pitch directement sur ton profil — un vrai avantage pour te démarquer !
                </p>
                <VideoPitchRecorder
                  currentUrl={profile?.video_pitch_url ?? null}
                  onUpload={handleVideoPitchUpload}
                  onDelete={handleVideoPitchDelete}
                />
              </div>
            </div>

            {/* KazaPortfolio */}
            <div className="mt-4">
              <KazaPortfolioSection profile={profile as unknown as Record<string, unknown> | null} onSaved={refetch} />
            </div>
          </div>
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
