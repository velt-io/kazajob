'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Mail, Edit3, Check, X, Download, ExternalLink, Palette, Camera } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/ui/Avatar'
import { AvatarBuilder } from '@/components/ui/AvatarBuilder'
import { Modal } from '@/components/ui/Modal'
import { hasAvatarConfig, type AvatarConfig } from '@/lib/avatar'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
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
import { KZ, SOFT_SKILLS, HOBBIES } from '@/lib/constants'
import { SkillSelector } from '@/components/skills/SkillSelector'
import { computeCvCompletion } from '@/lib/cv'
import type { Skill } from '@/lib/types'
import { island } from '@/lib/island'

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

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[var(--kz-ink)]">Mon profil</h1>
        {!editing ? (
          <Button kind="outline" size="md" icon={<Edit3 size={15} />} onClick={() => setEditing(true)}>Modifier</Button>
        ) : (
          <div className="flex gap-2">
            <Button kind="soft" size="md" onClick={() => setEditing(false)}>Annuler</Button>
            <Button kind="primary" size="md" icon={<Check size={15} />} loading={saving} onClick={handleSave}>Sauvegarder</Button>
          </div>
        )}
      </div>

      {saveError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <X size={15} />{saveError}
        </div>
      )}

      {uploadError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <X size={15} />{uploadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Colonne gauche */}
        <div className="flex flex-col gap-4">
          {/* Avatar avec upload */}
          <div className="kz-card p-5 bg-[var(--kz-paper)] text-center">
            <div className="flex justify-center mb-4 relative">
              <div className="relative">
                <Avatar name={profile?.full_name ?? 'KZ'} src={profile?.avatar_url} avatarConfig={profile?.avatar_config} size={96} color={KZ.orangeSoft} badge />
                {/* Zone de click pour changer l'avatar */}
                <FileUpload
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeMb={5}
                  onFile={handleAvatarFile}
                  variant="avatar"
                  uploading={uploadingAvatar}
                  className="absolute inset-0 rounded-full"
                />
              </div>
            </div>
            <div className="flex justify-center gap-2 mb-4">
              <Button kind="outline" size="sm" icon={<Palette size={13} />} onClick={() => setAvatarOpen(true)}>
                {hasAvatarConfig(profile?.avatar_config) ? 'Modifier mon perso' : 'Créer mon perso'}
              </Button>
            </div>
            {uploadingAvatar && (
              <p className="text-xs text-[var(--kz-mute)] mb-2">Upload de la photo...</p>
            )}
            <div className="text-base font-bold text-[var(--kz-ink)]">{profile?.full_name}</div>
            <div className="text-xs text-[var(--kz-mute)] mt-0.5 mb-4">{profile?.location ?? 'La Reunion'}</div>
            <Progress value={profileScore} color={KZ.orange} label="Profil complete" />
            <p className="text-[11px] text-[var(--kz-mute)] mt-2 flex items-center justify-center gap-1">
              <Camera size={11} /> Clique sur l&apos;avatar pour utiliser une photo
            </p>
          </div>

          {/* CV */}
          <div className="kz-card p-5 bg-[var(--kz-paper)]">
            <h3 className="text-sm font-bold text-[var(--kz-ink)] mb-3">Mon CV</h3>

            {/* CV Builder (cv_data) */}
            {hasCvBuilder && (
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--kz-violet)] bg-[var(--kz-violet-soft)]">
                  <Check size={16} color={KZ.violet} />
                  <span className="text-sm font-semibold text-[var(--kz-ink)] flex-1">CV Builder — créé</span>
                </div>
                <div className="flex gap-2">
                  <Link href="/premiers-pas/cv" className="flex-1">
                    <Button kind="violet" size="sm" full icon={<ExternalLink size={13} />}>
                      Modifier / Télécharger
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* CV uploadé (cv_url) */}
            {hasCv ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--kz-green)] bg-[var(--kz-green-soft)]">
                  <Check size={16} color={KZ.green} />
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
                <Link href="/premiers-pas/cv">
                  <Button kind="primary" size="sm" full icon={<ExternalLink size={13} />}>
                    Créer mon CV avec le Builder
                  </Button>
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

          {/* Badges */}
          <div className="kz-card p-5 bg-[var(--kz-paper)]">
            <h3 className="text-sm font-bold text-[var(--kz-ink)] mb-3">Badges obtenus</h3>
            <div className="flex flex-wrap gap-2">
              {(profile?.streak ?? 0) > 0  && <Badge color="orange" size="md">Streak {profile!.streak}j</Badge>}
              {(profile?.xp ?? 0) >= 1000   && <Badge color="violet" size="md">Niveau {Math.floor((profile!.xp) / 1000) + 1}</Badge>}
              {profileScore >= 80            && <Badge color="green"  size="md">Profil complet</Badge>}
              {hasCv                         && <Badge color="blue"   size="md">CV uploade</Badge>}
              {!!profile?.video_pitch_url && <Badge color="orange" size="md">Pitch video</Badge>}
              {applications.length >= 5      && <Badge color="yellow" size="md">{applications.length} candidatures</Badge>}
              {(profile?.streak ?? 0) === 0 && (profile?.xp ?? 0) === 0 && !hasCv && (
                <p className="text-xs text-[var(--kz-mute)]">Complete ton profil pour obtenir des badges.</p>
              )}
            </div>
          </div>

          {/* Video Pitch */}
          <div className="kz-card p-5 bg-[var(--kz-paper)]">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-[var(--kz-ink)]">Pitch vidéo</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--kz-edge)]"
                style={{ background: KZ.orangeSoft, color: KZ.ink }}>
                60s max
              </span>
            </div>
            <p className="text-xs text-[var(--kz-mute)] mb-3 leading-relaxed">
              Présente-toi en 60 secondes. Les recruteurs peuvent voir ton pitch directement sur ton profil — un vrai avantage pour te démarquer !
            </p>
            <VideoPitchRecorder
              currentUrl={profile?.video_pitch_url ?? null}
              onUpload={handleVideoPitchUpload}
              onDelete={handleVideoPitchDelete}
            />
          </div>

          {/* KazaPortfolio */}
          <KazaPortfolioSection profile={profile as unknown as Record<string, unknown> | null} onSaved={refetch} />

          {/* KazaBoost */}
          <div className="kz-card p-5 bg-[var(--kz-paper)]">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-[var(--kz-ink)]">KazaBoost</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--kz-edge)]"
                style={{ background: KZ.yellowSoft, color: 'var(--kz-ink)' }}>
                48h
              </span>
            </div>
            <p className="text-xs text-[var(--kz-mute)] mb-3 leading-relaxed">
              Boostez votre profil et apparaissez en priorité dans les recherches recruteurs pendant 48h.
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
            <div className="mt-3 pt-3 border-t border-[var(--kz-line)]">
              <p className="text-[11px] text-[var(--kz-mute)] mb-2 leading-relaxed">
                Pas assez d&apos;XP ou besoin de plus longtemps ? Optez pour le boost premium (7 à 30 jours).
              </p>
              {profile && <ProfileBoostPaid boostedUntil={profile.boosted_until ?? null} />}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          {/* Infos personnelles */}
          <div className="kz-card p-5 bg-[var(--kz-paper)]">
            <h2 className="text-lg font-bold text-[var(--kz-ink)] mb-4">Informations personnelles</h2>
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
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-xs text-[var(--kz-mute)] mb-0.5">Nom complet</div>
                  <div className="text-sm font-semibold text-[var(--kz-ink)]">{profile?.full_name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--kz-mute)] mb-0.5">Email</div>
                  <div className="flex items-center gap-2 text-sm text-[var(--kz-ink)]"><Mail size={13} />{profile?.email}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--kz-mute)] mb-0.5">Bio</div>
                  <div className="text-sm text-[var(--kz-text)]">{profile?.bio || <span className="text-[var(--kz-mute)] italic">Aucune bio — clique sur Modifier</span>}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[var(--kz-mute)] mb-0.5">Localisation</div>
                    <div className="flex items-center gap-1 text-sm text-[var(--kz-ink)]"><MapPin size={13} />{profile?.location || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--kz-mute)] mb-0.5">Telephone</div>
                    <div className="flex items-center gap-1 text-sm text-[var(--kz-ink)]"><Phone size={13} />{profile?.phone || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compétences */}
          <div className="kz-card p-5 bg-[var(--kz-paper)]">
            <h2 className="text-lg font-bold text-[var(--kz-ink)] mb-4">Competences</h2>
            <SkillSelector selected={skills} onAdd={addSkill} onRemove={removeSkill} placeholder="Rechercher React, Python, Figma..." />
          </div>

          {/* Soft skills */}
          <div className="kz-card p-5 bg-[var(--kz-paper)]">
            <h2 className="text-lg font-bold text-[var(--kz-ink)] mb-1">Soft skills</h2>
            <p className="text-xs text-[var(--kz-mute)] mb-4">Savoir-être — visible sur ton CV.</p>
            {editing ? (
              <div className="flex flex-wrap gap-1.5">
                {SOFT_SKILLS.map(s => {
                  const on = softSkills.includes(s)
                  return (
                    <button key={s} type="button"
                      onClick={() => setSoftSkills(prev => on ? prev.filter(x => x !== s) : [...prev, s])}
                      className="px-2.5 py-1 text-xs font-semibold border rounded-full transition-all"
                      style={on ? { background: KZ.violet, color: 'white', borderColor: KZ.violet }
                                : { background: KZ.paper, color: 'var(--kz-text)', borderColor: 'var(--kz-line)' }}>
                      {on && '✓ '}{s}
                    </button>
                  )
                })}
              </div>
            ) : softSkills.length === 0 ? (
              <div className="text-sm text-[var(--kz-mute)] py-4 text-center border border-dashed border-[var(--kz-line)] rounded-lg">
                Aucun soft skill — clique sur &quot;Modifier&quot;.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {softSkills.map(s => (
                  <span key={s} className="px-2.5 py-1 text-xs font-semibold border border-[var(--kz-edge)] rounded-md" style={{ background: KZ.violetSoft }}>{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Loisirs */}
          <div className="kz-card p-5 bg-[var(--kz-paper)]">
            <h2 className="text-lg font-bold text-[var(--kz-ink)] mb-1">Loisirs</h2>
            <p className="text-xs text-[var(--kz-mute)] mb-4">Centres d&apos;intérêt — visible sur ton CV.</p>
            {editing ? (
              <div className="flex flex-wrap gap-1.5">
                {HOBBIES.map(h => {
                  const on = hobbies.includes(h)
                  return (
                    <button key={h} type="button"
                      onClick={() => setHobbies(prev => on ? prev.filter(x => x !== h) : [...prev, h])}
                      className="px-2.5 py-1 text-xs font-semibold border rounded-full transition-all"
                      style={on ? { background: KZ.green, color: 'white', borderColor: KZ.green }
                                : { background: KZ.paper, color: 'var(--kz-text)', borderColor: 'var(--kz-line)' }}>
                      {on && '✓ '}{h}
                    </button>
                  )
                })}
              </div>
            ) : hobbies.length === 0 ? (
              <div className="text-sm text-[var(--kz-mute)] py-4 text-center border border-dashed border-[var(--kz-line)] rounded-lg">
                Aucun loisir — clique sur &quot;Modifier&quot;.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hobbies.map(h => (
                  <span key={h} className="px-2.5 py-1 text-xs font-semibold border border-[var(--kz-edge)] rounded-md" style={{ background: KZ.greenSoft }}>{h}</span>
                ))}
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div className="kz-card p-5 bg-[var(--kz-paper)]">
            <h2 className="text-lg font-bold text-[var(--kz-ink)] mb-4">Statistiques</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { v: (profile?.xp ?? 0).toLocaleString('fr-FR'), l: 'XP total' },
                { v: profile?.streak ?? 0, l: 'Jours streak' },
                { v: applications.length, l: 'Candidatures' },
              ].map((s) => (
                <div key={s.l} className="text-center p-3 rounded-xl border border-[var(--kz-line)]" style={{ background: KZ.cream2 }}>
                  <div className="text-2xl font-extrabold text-[var(--kz-ink)]">{String(s.v)}</div>
                  <div className="text-xs text-[var(--kz-mute)] mt-0.5">{s.l}</div>
                </div>
              ))}
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
