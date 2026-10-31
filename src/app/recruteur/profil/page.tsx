'use client'

import { useEffect, useState } from 'react'
import { CheckCheck, Mail } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { AccountActions } from '@/components/account/AccountActions'
import { useAuth } from '@/features/auth/useAuth'
import { ACCENT, PageHeader, StatusPill, accentStyle } from '@/components/os/recruiter/primitives'
import { SettingsGroup } from '@/components/os/recruiter/secondary-ui'

export default function RecruiterProfilePage() {
  const { profile, refetch } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) { setFullName(profile.full_name ?? ''); setPhone(profile.phone ?? '') }
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return <PageLoader />

  const save = async () => {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() || null }),
    })
    await refetch?.()
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-[680px] mx-auto">
      <PageHeader eyebrow="Mon compte" title="Profil recruteur" />

      {/* Carte d'identité (façon identifiant Apple) */}
      <div className="os-glass osr-glow rounded-[26px] p-6 mb-6 flex flex-col items-center text-center" style={accentStyle(ACCENT.violet)}>
        <div className="rounded-full p-[3px] mb-3" style={{ background: 'var(--os-aurora)' }}>
          <div className="rounded-full p-[3px] bg-[var(--kz-cream)]">
            <Avatar name={profile.full_name} src={profile.avatar_url} avatarConfig={profile.avatar_config} size={84} color="var(--kz-violet-soft)" />
          </div>
        </div>
        <div className="text-[22px] font-semibold tracking-[-0.02em] text-white truncate max-w-full">{profile.full_name}</div>
        <div className="text-[14px] text-[var(--kz-mute)] max-w-full flex items-center gap-1.5 mt-0.5 min-w-0">
          <Mail size={13} className="shrink-0" /><span className="truncate">{profile.email}</span>
        </div>
        <StatusPill accent={ACCENT.violet} className="mt-3">Recruteur</StatusPill>
      </div>

      <SettingsGroup
        title="Informations personnelles"
        footer={<>L&apos;e-mail de connexion n&apos;est pas modifiable ici. Les informations de l&apos;entreprise se gèrent dans « Mon entreprise ».</>}
        className="mb-6"
      >
        <div className="flex flex-col gap-4">
          <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0692 ..." />
          <div className="flex items-center gap-3 pt-1">
            <Button kind="primary" size="md" loading={saving} onClick={save}>Enregistrer</Button>
            <span aria-live="polite">
              {saved && <span className="os-pop flex items-center gap-1.5 text-[13px] font-semibold text-[var(--kz-green)]"><CheckCheck size={15} /> Enregistré</span>}
            </span>
          </div>
        </div>
      </SettingsGroup>

      <AccountActions />
    </div>
  )
}
