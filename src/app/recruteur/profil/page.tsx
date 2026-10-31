'use client'

import { useEffect, useState } from 'react'
import { CheckCheck, UserRound } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { AccountActions } from '@/components/account/AccountActions'
import { useAuth } from '@/features/auth/useAuth'
import { QuestHeader } from '@/components/quest/recruteur/QuestChrome'
import { KZ } from '@/lib/constants'

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
      <QuestHeader eyebrow="Mon compte" icon={<UserRound size={18} />} title={<>Profil du <span className="qx-text-arcane">maître de guilde</span></>}
        subtitle="Profil recruteur : vos informations personnelles." />

      <div className="qx-panel p-6 mb-5">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={profile.full_name} src={profile.avatar_url} avatarConfig={profile.avatar_config} size={56} color={KZ.violetSoft} />
          <div className="min-w-0">
            <div className="text-base font-bold text-[var(--kz-ink)] truncate">{profile.full_name}</div>
            <div className="text-sm text-[var(--kz-mute)] truncate">{profile.email}</div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0692 ..." />
          <div className="flex items-center gap-3">
            <Button kind="primary" size="md" loading={saving} onClick={save}>Enregistrer</Button>
            {saved && <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: KZ.green }}><CheckCheck size={15} /> Enregistré</span>}
          </div>
          <p className="text-xs text-[var(--kz-mute)]">
            L&apos;e-mail de connexion n&apos;est pas modifiable ici. Les informations de l&apos;entreprise se gèrent dans « Mon entreprise ».
          </p>
        </div>
      </div>

      <AccountActions />
    </div>
  )
}
