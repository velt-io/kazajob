'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Shield, CheckCheck, Gamepad2, Check, Zap, Clock, CalendarDays, Lock, Globe, Ban } from 'lucide-react'
import { AccountActions } from '@/components/account/AccountActions'
import { useGamification } from '@/features/gamification/useGamification'
import { useApplications } from '@/features/applications/useApplications'
import { useFavorites } from '@/features/favorites/useFavorites'
import { Switch } from '@/components/ui/radix'
import { useAuth } from '@/features/auth/useAuth'
import { ActivityRings, RING_COLORS } from '@/components/os/ActivityRings'
import { InsetGroup, InsetRow, LargeTitle } from '@/components/os/candidate/primitives'
import { cn } from '@/lib/utils'

async function patchProfile(patch: Record<string, unknown>) {
  await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

interface SettingRow {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  key: string
  value: boolean
  badge?: string
}

export default function CandidateSettingsPage() {
  const { profile, refetch } = useAuth()
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const { applications } = useApplications(profile?.id)
  const { favorites } = useFavorites(profile?.id)
  const gami = useGamification(profile, applications.length, favorites.length)

  const [settings, setSettings] = useState({
    email_alerts_enabled:  true,
    email_alert_frequency: 'daily' as 'instant' | 'daily' | 'weekly',
  })

  useEffect(() => {
    if (profile) {
      // Logique d'origine conservée : synchronise les réglages avec le profil chargé.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSettings({
        email_alerts_enabled:  profile.email_alerts_enabled ?? true,
        email_alert_frequency: (profile.email_alert_frequency as 'instant' | 'daily' | 'weekly') ?? 'daily',
      })
    }
  }, [profile])

  const handleToggle = async (key: string, value: boolean) => {
    if (!profile) return
    setSaving(key)
    await patchProfile({ [key]: value })
    setSettings(prev => ({ ...prev, [key]: value }))
    await refetch?.()
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  const handleFrequency = async (freq: 'instant' | 'daily' | 'weekly') => {
    if (!profile) return
    setSaving('freq')
    await patchProfile({ email_alert_frequency: freq })
    setSettings(prev => ({ ...prev, email_alert_frequency: freq }))
    await refetch?.()
    setSaving(null)
    setSaved('freq')
    setTimeout(() => setSaved(null), 2000)
  }

  const NOTIF_SETTINGS: SettingRow[] = [
    {
      icon: <Bell size={16} />,
      iconBg: 'var(--kz-orange-deep)',
      title: 'Notifications dans l\'app',
      description: 'Alertes en temps réel quand le statut de tes candidatures change ou qu\'un entretien est planifié.',
      key: 'app_notifications',
      value: true,
      badge: 'Toujours actif',
    },
    {
      icon: <Mail size={16} />,
      iconBg: 'var(--kz-blue)',
      title: 'Alertes e-mail',
      description: 'Reçois par e-mail les nouvelles offres qui correspondent à ton profil.',
      key: 'email_alerts_enabled',
      value: settings.email_alerts_enabled,
    },
  ]

  const FREQ_OPTIONS = [
    { value: 'instant', label: 'En temps réel', desc: 'Dès qu\'une offre correspond', icon: <Zap size={16} />, bg: 'var(--kz-yellow)' },
    { value: 'daily',   label: 'Résumé quotidien', desc: 'Un e-mail par jour maximum', icon: <Clock size={16} />, bg: 'var(--kz-blue)' },
    { value: 'weekly',  label: 'Résumé hebdomadaire', desc: 'Un e-mail par semaine', icon: <CalendarDays size={16} />, bg: 'var(--kz-violet)' },
  ] as const

  return (
    <div className="max-w-[680px] mx-auto">
      <LargeTitle eyebrow="Compte" title="Réglages" subtitle="Notifications, préférences et confidentialité." />

      <div className="flex flex-col gap-8">
        {/* Notifications */}
        <InsetGroup title="Notifications et alertes">
          {NOTIF_SETTINGS.map((s) => (
            <div key={s.key} className="flex items-start gap-3 px-4 py-3.5">
              <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-white shrink-0 mt-0.5" style={{ background: s.iconBg }}>{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] text-[var(--kz-ink)]">{s.title}</span>
                  {s.badge && <span className="text-[11px] font-medium text-[var(--kz-mute)]">{s.badge}</span>}
                  {saved === s.key && <CheckCheck size={14} className="text-[var(--kz-green)] osc-fade" aria-label="Enregistré" />}
                </div>
                <p className="text-[12px] text-[var(--kz-mute)] leading-relaxed mt-0.5">{s.description}</p>
              </div>
              <Switch
                checked={s.value}
                onCheckedChange={(v) => handleToggle(s.key, v)}
                disabled={!!s.badge || saving === s.key}
                aria-label={s.title}
              />
            </div>
          ))}
        </InsetGroup>

        {/* Fréquence des alertes e-mail */}
        {settings.email_alerts_enabled && (
          <InsetGroup
            className="osc-drop"
            title="Fréquence des alertes e-mail"
            footer={saved === 'freq' ? <span className="text-[var(--kz-green)] font-medium">Préférence enregistrée</span> : undefined}
          >
            <div role="radiogroup" aria-label="Fréquence des alertes e-mail" className="divide-y divide-[var(--osc-hairline)]">
              {FREQ_OPTIONS.map((f) => {
                const active = settings.email_alert_frequency === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleFrequency(f.value)}
                    className="osc-row w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-left transition-colors hover:bg-[var(--osc-surface)]"
                  >
                    <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-black shrink-0" style={{ background: f.bg }}>{f.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] text-[var(--kz-ink)]">{f.label}</span>
                      <span className="block text-[12px] text-[var(--kz-mute)]">{f.desc}</span>
                    </span>
                    <Check size={18} strokeWidth={2.6} className={cn('text-[var(--kz-blue)] shrink-0 transition-all duration-300', active ? 'opacity-100 scale-100' : 'opacity-0 scale-50')} />
                  </button>
                )
              })}
            </div>
          </InsetGroup>
        )}

        {/* Expérience — Gamification */}
        <InsetGroup title="Expérience" footer="Anneaux d'activité, niveaux et quêtes. Désactive pour retrouver une interface épurée.">
          <InsetRow icon={<Gamepad2 size={16} />} iconBg="var(--kz-violet)" label="Anneaux et récompenses">
            <Switch
              checked={gami.enabled}
              onCheckedChange={() => gami.toggle()}
              disabled={saving === 'gami'}
              aria-label="Anneaux et récompenses"
            />
          </InsetRow>
          {gami.enabled && (
            <div className="osc-drop flex items-center gap-4 px-4 py-4">
              <ActivityRings size={64} stroke={8} gap={2} rings={[
                { value: gami.xpProgress, ...RING_COLORS.move, label: 'Niveau' },
              ]} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--kz-mute)]">Ton niveau</div>
                <div className="text-[17px] font-semibold text-[var(--kz-ink)] truncate">{gami.level.title}</div>
                <div className="text-[12px] text-[var(--kz-mute)]">
                  {gami.xp.toLocaleString('fr-FR')} XP · {gami.doneQuests.length}/{gami.quests.length} quêtes accomplies
                </div>
              </div>
            </div>
          )}
        </InsetGroup>

        {/* Confidentialité */}
        <InsetGroup title="Confidentialité" footer="Kazajob ne revend jamais tes informations personnelles et ne t'envoie jamais d'e-mails commerciaux non sollicités.">
          <InsetRow icon={<Shield size={16} />} iconBg="var(--kz-green)" label="RGPD" value="Conforme" />
          <InsetRow icon={<Globe size={16} />} iconBg="var(--kz-blue)" label="Hébergement" value="Union européenne" />
          <InsetRow icon={<Lock size={16} />} iconBg="var(--kz-mute)" label="Chiffrement" value="Au repos et en transit" />
          <InsetRow icon={<Ban size={16} />} iconBg="var(--kz-violet)" label="Revente de données" value="Jamais" />
        </InsetGroup>

        <AccountActions />
      </div>
    </div>
  )
}
