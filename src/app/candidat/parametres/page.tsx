'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Shield, CheckCheck, Gamepad2, Settings, Crown } from 'lucide-react'
import { AccountActions } from '@/components/account/AccountActions'
import { useGamification } from '@/features/gamification/useGamification'
import { useApplications } from '@/features/applications/useApplications'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { QuestPageHeader } from '@/components/quest/candidat/QuestKit'

async function patchProfile(patch: Record<string, unknown>) {
  await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}

/** Interrupteur « rune » : allumé = dégradé néon. */
function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-[28px] w-[48px] items-center rounded-full border transition-all shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/40 disabled:opacity-50 ${checked
        ? 'border-[#F0ABFC]/70 bg-[linear-gradient(120deg,#7C3AED,#E879F9)] shadow-[0_0_16px_-4px_rgba(232,121,249,0.9)]'
        : 'border-[#C084FC]/40 bg-[rgba(168,85,247,0.2)]'}`}
    >
      <span
        className="inline-block w-[22px] h-[22px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

interface SettingRow {
  icon: React.ReactNode
  title: string
  description: string
  key: string
  value: boolean
  badge?: string
}

function SectionHead({ icon, children, extra, color = 'var(--qx-gold)' }: { icon: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode; color?: string }) {
  return (
    <div className="px-5 sm:px-6 py-4 border-b border-[#C084FC]/20 flex items-center gap-2.5">
      <span aria-hidden className="w-7 h-7 rounded-md rotate-45 grid place-items-center shrink-0 border"
        style={{ color, borderColor: `color-mix(in srgb, ${color} 55%, transparent)`, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
        <span className="-rotate-45 inline-flex">{icon}</span>
      </span>
      <h2 className="text-[15px] font-bold text-white font-[family-name:var(--font-epic)] tracking-wide">{children}</h2>
      {extra && <div className="ml-auto">{extra}</div>}
    </div>
  )
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
      icon: <Bell size={18} />,
      title: 'Notifications dans l\'app',
      description: 'Alertes temps réel quand le statut de tes candidatures change ou qu\'un entretien est planifié.',
      key: 'app_notifications',
      value: true,
      badge: 'Toujours actif',
    },
    {
      icon: <Mail size={18} />,
      title: 'Alertes email — offres matchantes',
      description: 'Reçois par email les nouvelles offres qui correspondent à ton profil. Tu contrôles la fréquence ci-dessous.',
      key: 'email_alerts_enabled',
      value: settings.email_alerts_enabled,
    },
  ]

  const FREQ_OPTIONS = [
    { value: 'instant', label: 'En temps réel', desc: 'Dès qu\'une offre correspond' },
    { value: 'daily',   label: 'Résumé quotidien', desc: 'Un email par jour max' },
    { value: 'weekly',  label: 'Résumé hebdo', desc: 'Un email par semaine' },
  ] as const

  return (
    <div className="max-w-[760px] mx-auto">
      <QuestPageHeader
        eyebrow="Réglages du héros"
        title="Paramètres"
        icon={<Settings size={20} />}
        subtitle="Contrôle tes notifications et préférences de communication."
      />

      {/* Notifications */}
      <section className="qx-panel mb-5">
        <SectionHead icon={<Bell size={13} />}>Notifications &amp; alertes</SectionHead>
        <div className="divide-y divide-[#C084FC]/15">
          {NOTIF_SETTINGS.map((s) => (
            <div key={s.key} className="flex items-start gap-4 px-5 sm:px-6 py-4">
              <div className="w-9 h-9 rounded-xl border border-[#C084FC]/25 flex items-center justify-center shrink-0 text-[var(--qx-neon)] bg-[rgba(168,85,247,0.1)]" aria-hidden>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-bold text-white">{s.title}</span>
                  {s.badge && <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md text-[var(--kz-text)] border border-[#C084FC]/25 bg-[rgba(168,85,247,0.08)]">{s.badge}</span>}
                  {saved === s.key && <CheckCheck size={13} className="text-[#86EFAC]" aria-label="Enregistré" />}
                </div>
                <p className="text-xs text-[var(--kz-mute)] leading-relaxed">{s.description}</p>
              </div>
              <Toggle
                label={s.title}
                checked={s.value}
                onChange={(v) => handleToggle(s.key, v)}
                disabled={!!s.badge || saving === s.key}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Fréquence des alertes email */}
      {settings.email_alerts_enabled && (
        <section className="qx-panel mb-5">
          <SectionHead icon={<Mail size={13} />} color="var(--qx-cyan)">Fréquence des alertes email</SectionHead>
          <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Fréquence des alertes email">
            {FREQ_OPTIONS.map((f) => {
              const active = settings.email_alert_frequency === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleFrequency(f.value)}
                  className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E879F9]/40 ${active
                    ? 'border-[#FACC15]/70 bg-[rgba(250,204,21,0.1)] shadow-[0_0_22px_-8px_rgba(250,204,21,0.9)]'
                    : 'border-[#C084FC]/25 bg-[rgba(12,5,24,0.5)] hover:border-[#E879F9]/50'}`}
                >
                  <div className="flex items-center justify-between w-full mb-1 gap-2">
                    <span className="text-sm font-bold text-white">{f.label}</span>
                    <span aria-hidden className={`w-3.5 h-3.5 rotate-45 rounded-[3px] border shrink-0 ${active ? 'bg-[#FACC15] border-[#FEF3C7] shadow-[0_0_8px_rgba(250,204,21,0.9)]' : 'border-[#C084FC]/50'}`} />
                  </div>
                  <span className="text-xs text-[var(--kz-mute)]">{f.desc}</span>
                </button>
              )
            })}
          </div>
          {saved === 'freq' && (
            <div className="px-6 pb-4" role="status">
              <p className="text-xs font-semibold text-[#86EFAC]">Préférence sauvegardée</p>
            </div>
          )}
        </section>
      )}

      {/* Expérience — Gamification */}
      <section className="qx-panel mb-5">
        <SectionHead icon={<Gamepad2 size={13} />} color="var(--qx-magenta)"
          extra={<span className="text-[9px] font-bold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-md text-[#D8B4FE] border border-[#A855F7]/45 bg-[rgba(168,85,247,0.16)]">Beta</span>}>
          Expérience &amp; mode quête
        </SectionHead>
        <div className="px-5 sm:px-6 py-5">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-9 h-9 rounded-xl border border-[#E879F9]/35 flex items-center justify-center shrink-0 text-[var(--qx-magenta)] bg-[rgba(232,121,249,0.1)]" aria-hidden>
              <Gamepad2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-white">Mode Quête actif</span>
                {gami.enabled && <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded-md text-[#1A0B2E] bg-[#E879F9]">ON</span>}
              </div>
              <p className="text-xs text-[var(--kz-mute)] leading-relaxed">
                Transforme ton tableau de bord en jeu de quêtes — niveaux, XP, défis à accomplir.
                Désactive pour retrouver l&apos;interface classique.
              </p>
            </div>
            <Toggle
              label="Mode Quête"
              checked={gami.enabled}
              onChange={() => gami.toggle()}
              disabled={saving === 'gami'}
            />
          </div>

          {/* Aperçu du niveau quand actif */}
          {gami.enabled && (
            <div className="rounded-xl border border-[#FACC15]/35 p-4 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(250,204,21,0.12),transparent_60%),rgba(12,5,24,0.6)] qx-rise">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span aria-hidden className="w-8 h-8 rounded-md rotate-45 grid place-items-center shrink-0 bg-[linear-gradient(135deg,#FDE68A,#FACC15,#F59E0B)] shadow-[0_0_12px_rgba(250,204,21,0.6)]">
                    <Crown size={14} className="-rotate-45 text-[#1A0B2E]" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--kz-mute)]">Ton niveau</div>
                    <div className="text-sm font-bold text-white font-[family-name:var(--font-epic)] truncate">{gami.level.title}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold qx-text-legend">{gami.xp.toLocaleString('fr-FR')} XP</div>
                  <div className="text-[10px] text-[var(--kz-mute)]">{gami.doneQuests.length}/{gami.quests.length} quêtes accomplies</div>
                </div>
              </div>
              <div className="qx-xp"><span style={{ width: `${Math.max(gami.xpProgress, 3)}%` }} /></div>
            </div>
          )}
        </div>
      </section>

      {/* Confidentialité */}
      <section className="qx-panel mb-5">
        <SectionHead icon={<Shield size={13} />} color="#4ADE80">Confidentialité</SectionHead>
        <div className="px-5 sm:px-6 py-5 flex flex-col gap-3">
          <p className="text-xs text-[var(--kz-mute)] leading-relaxed">
            Tes données sont hébergées en Europe, chiffrées au repos et en transit.
            Kazajob ne revend jamais tes informations personnelles et ne t&apos;envoie
            jamais d&apos;emails commerciaux non sollicités.
          </p>
          <div className="flex gap-2 flex-wrap">
            {[['RGPD conforme', '#4ADE80'], ['Hébergé en EU', '#22D3EE'], ['0 revente de données', '#C084FC']].map(([l, c]) => (
              <span key={l} className="text-[10px] font-bold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md border"
                style={{ color: `color-mix(in srgb, ${c} 75%, white)`, borderColor: `color-mix(in srgb, ${c} 45%, transparent)`, background: `color-mix(in srgb, ${c} 12%, transparent)` }}>{l}</span>
            ))}
          </div>
        </div>
      </section>

      <AccountActions />
    </div>
  )
}
