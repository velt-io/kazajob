'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Gift, Users, Share2, Link as LinkIcon, Smartphone, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { SITE_URL } from '@/lib/constants'
import { island } from '@/lib/island'
import { LargeTitle } from '@/components/os/candidate/primitives'
import { cn } from '@/lib/utils'

interface ReferralStats {
  count: number
  rewarded: number
}

export default function ReferralPage() {
  const { profile, refetch } = useAuth()
  const [stats, setStats] = useState<ReferralStats>({ count: 0, rewarded: 0 })
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const referralCode = profile?.referral_code
  const referralLink = referralCode ? `${SITE_URL}/auth/register?ref=${referralCode}` : null

  useEffect(() => {
    if (!profile?.id) return
    fetch('/api/referral')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStats(d as ReferralStats) })
      .catch(() => {})
  }, [profile?.id])

  const handleCopy = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    island({ title: 'Lien copié', subtitle: 'Colle-le où tu veux', tone: 'success' })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    if (!referralLink) return
    const text = `Rejoins-moi sur Kazajob — la plateforme emploi pour La Réunion ! Utilise mon lien : ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const generateCode = async () => {
    if (!profile?.id || referralCode) return
    setGenerating(true)
    await fetch('/api/referral', { method: 'POST' })
    await refetch?.()
    setGenerating(false)
  }

  const XP_PER_REFERRAL = 200

  return (
    <div className="max-w-[680px] mx-auto">
      <LargeTitle
        eyebrow="Communauté"
        title="Parrainage"
        accent="974"
        subtitle="Invite tes proches à rejoindre Kazajob et gagnez des XP tous les deux."
      />

      {/* Carte « invitation » */}
      <section className="osc-mesh relative overflow-hidden rounded-[30px] border border-[var(--kz-edge)] p-6 sm:p-8 mb-6 shadow-[var(--os-elevation)]">
        <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[color-mix(in_srgb,var(--kz-ink)_70%,transparent)]">Ton lien de parrainage</div>
        {referralCode ? (
          <>
            <div className="mt-3 text-[34px] sm:text-[44px] font-semibold tracking-[0.18em] text-[var(--kz-ink)] leading-none font-mono break-all">{referralCode}</div>

            <button type="button" onClick={handleCopy} aria-label="Copier le lien de parrainage"
              className="osc-press mt-6 w-full flex items-center gap-3 h-12 pl-4 pr-1.5 rounded-full bg-[color-mix(in_srgb,var(--kz-cream)_55%,transparent)] border border-[var(--kz-edge)] text-left hover:bg-[color-mix(in_srgb,var(--kz-cream)_40%,transparent)]">
              <LinkIcon size={15} className="text-[var(--kz-mute)] shrink-0" />
              <span className="flex-1 min-w-0 text-[13px] text-[var(--kz-text)] truncate font-mono">{referralLink}</span>
              <span className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300', copied ? 'bg-[var(--kz-green)] text-black' : 'bg-[var(--kz-ink)] text-[var(--kz-inverse)]')}>
                {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={15} />}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <Button kind="primary" size="lg" icon={<Copy size={15} />} onClick={handleCopy} full>
                {copied ? 'Copié' : 'Copier'}
              </Button>
              <Button kind="outline" size="lg" icon={<Share2 size={15} />} onClick={handleWhatsApp} full>
                WhatsApp
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <p className="text-[15px] text-[var(--kz-text)] mb-5">Tu n&apos;as pas encore de code de parrainage.</p>
            <Button kind="primary" size="lg" icon={<Gift size={16} />} loading={generating} onClick={generateCode}>
              Générer mon code
            </Button>
          </div>
        )}
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="osc-card p-5">
          <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[var(--kz-blue)] bg-[var(--kz-blue-soft)]"><Users size={15} /></span>
          <div className="text-[34px] font-semibold tracking-[-0.05em] text-[var(--kz-ink)] mt-3 leading-none tabular-nums">{stats.count}</div>
          <div className="text-[12px] text-[var(--kz-mute)] mt-1.5">Filleuls inscrits</div>
        </div>
        <div className="osc-card p-5">
          <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[var(--kz-violet)] bg-[var(--kz-violet-soft)]"><Gift size={15} /></span>
          <div className="text-[34px] font-semibold tracking-[-0.05em] mt-3 leading-none tabular-nums os-text-aurora">+{stats.rewarded * XP_PER_REFERRAL}</div>
          <div className="text-[12px] text-[var(--kz-mute)] mt-1.5">XP gagnés</div>
        </div>
      </div>

      {/* Comment ça marche */}
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--kz-mute)] px-4 mb-2">Comment ça marche</h2>
      <ol className="osc-card !rounded-[20px] divide-y divide-[var(--osc-hairline)] mb-6">
        {[
          { icon: <LinkIcon size={16} />, bg: 'var(--kz-blue)', text: 'Copie ton lien de parrainage unique' },
          { icon: <Smartphone size={16} />, bg: 'var(--kz-green)', text: 'Partage-le à tes amis ou sur les réseaux' },
          { icon: <Gift size={16} />, bg: 'var(--kz-violet)', text: `+${XP_PER_REFERRAL} XP pour toi et ton filleul à l'inscription` },
        ].map((s, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3.5">
            <span className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-white shrink-0" style={{ background: s.bg }}>{s.icon}</span>
            <span className="flex-1 text-[15px] text-[var(--kz-ink)]">{s.text}</span>
            <span className="text-[13px] font-semibold text-[var(--kz-mute)] tabular-nums">{i + 1}</span>
          </li>
        ))}
      </ol>

      {/* Note */}
      <div className="flex gap-3 p-4 rounded-[20px] text-[13px] text-[var(--kz-text)] leading-relaxed bg-[var(--kz-yellow-soft)] border border-[color-mix(in_srgb,var(--kz-yellow)_22%,transparent)]">
        <Info size={16} className="shrink-0 mt-0.5 text-[var(--kz-yellow)]" />
        <p>Les XP sont crédités lorsque ton filleul complète son profil à plus de 50 %. Les parrainages sont limités à des profils réels : tout abus entraîne la suspension du compte.</p>
      </div>
    </div>
  )
}
