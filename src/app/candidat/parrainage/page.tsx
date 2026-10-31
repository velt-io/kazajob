'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Gift, Users, Share2, Link as LinkIcon, Smartphone, Info, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { SITE_URL } from '@/lib/constants'
import { island } from '@/lib/island'
import { PanelTitle, QuestPageHeader } from '@/components/quest/candidat/QuestKit'

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
  const referralLink = referralCode ? `${SITE_URL}/inscription?ref=${referralCode}` : null

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
    island({ title: 'Lien de guilde copié', subtitle: 'Partage-le pour recruter tes compagnons', tone: 'info' })
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
    <div className="max-w-[760px] mx-auto">
      <QuestPageHeader
        eyebrow="Recrute ta compagnie"
        title="Parrainage"
        accent="974"
        icon={<Users size={20} />}
        subtitle="Invitez vos proches à rejoindre Kazajob et gagnez des XP tous les deux."
      />

      {/* Comment ça marche */}
      <section className="qx-panel p-5 sm:p-6 mb-5">
        <PanelTitle icon={<Sparkles size={13} />}>Le rituel en trois étapes</PanelTitle>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <LinkIcon size={18} />, step: 'I', text: 'Copiez votre lien de parrainage unique' },
            { icon: <Smartphone size={18} />, step: 'II', text: 'Partagez-le à vos amis ou sur les réseaux' },
            { icon: <Gift size={18} />, step: 'III', text: `+${XP_PER_REFERRAL} XP pour vous ET votre filleul à l'inscription` },
          ].map(s => (
            <li key={s.step} className="flex flex-col items-center text-center gap-2.5 p-4 rounded-xl border border-[#C084FC]/20 bg-[rgba(12,5,24,0.5)]">
              <span className="qxc-crest w-12 h-12 text-[var(--qx-gold)]" aria-hidden><span className="qxc-crest-frame" /><span>{s.icon}</span></span>
              <span className="text-[11px] font-bold text-[var(--qx-gold)] font-[family-name:var(--font-epic)] tracking-[0.2em]">{s.step}</span>
              <p className="text-xs text-[var(--kz-text)] font-medium">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Votre code */}
      <section className="qx-panel p-5 sm:p-6 mb-5">
        <PanelTitle icon={<LinkIcon size={13} />} color="var(--qx-magenta)">Votre lien de parrainage</PanelTitle>
        {referralCode ? (
          <>
            {/* Sceau du code */}
            <div className="relative flex items-center justify-center p-5 rounded-xl border border-dashed border-[#FACC15]/50 mb-4 overflow-hidden bg-[radial-gradient(60%_120%_at_50%_0%,rgba(250,204,21,0.14),transparent_70%),rgba(12,5,24,0.55)]">
              <span className="text-[22px] sm:text-[28px] font-bold tracking-[0.25em] qx-text-legend font-[family-name:var(--font-epic)] break-all text-center">
                {referralCode}
              </span>
            </div>

            {/* Lien complet */}
            <div className="flex items-center gap-2 p-2.5 pl-3 rounded-xl border border-[#C084FC]/25 mb-4 bg-[rgba(12,5,24,0.6)] min-w-0">
              <span className="flex-1 text-xs text-[var(--kz-mute)] truncate font-mono">{referralLink}</span>
              <button
                type="button"
                onClick={handleCopy}
                className={`w-8 h-8 grid place-items-center rounded-lg border transition-colors shrink-0 ${copied ? 'border-[#4ADE80]/60 bg-[rgba(74,222,128,0.15)]' : 'border-[#C084FC]/30 bg-[rgba(168,85,247,0.1)] hover:bg-[rgba(168,85,247,0.22)]'}`}
                aria-label="Copier le lien"
                title="Copier le lien"
              >
                {copied ? <Check size={14} className="text-[#86EFAC]" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Partage */}
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button kind="primary" size="md" icon={<Copy size={14} />} onClick={handleCopy} full>
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </Button>
              <Button kind="outline" size="md" icon={<Share2 size={14} />} onClick={handleWhatsApp} full>
                WhatsApp
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-[var(--kz-mute)] mb-3">Vous n&apos;avez pas encore de code de parrainage.</p>
            <Button kind="primary" size="md" icon={<Gift size={15} />} loading={generating} onClick={generateCode}>
              Générer mon code
            </Button>
          </div>
        )}
      </section>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="qxc-card p-5 text-center" style={{ ['--r' as string]: 'var(--qx-cyan)' }}>
          <div className="text-3xl font-bold text-white mb-1 font-[family-name:var(--font-epic)] tabular-nums">{stats.count}</div>
          <div className="text-xs text-[var(--kz-mute)] font-medium flex items-center justify-center gap-1">
            <Users size={12} className="text-[var(--qx-cyan)]" aria-hidden /> Filleuls inscrits
          </div>
        </div>
        <div className="qxc-card p-5 text-center" style={{ ['--r' as string]: 'var(--qx-gold)' }}>
          <div className="text-3xl font-bold mb-1 qx-text-legend font-[family-name:var(--font-epic)] tabular-nums">
            +{stats.rewarded * XP_PER_REFERRAL}
          </div>
          <div className="text-xs text-[var(--kz-mute)] font-medium flex items-center justify-center gap-1">
            <Gift size={12} className="text-[var(--qx-gold)]" aria-hidden /> XP gagnés
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="p-4 rounded-xl border border-[#FACC15]/30 bg-[rgba(250,204,21,0.07)] text-sm text-[var(--kz-text)] leading-relaxed">
        <strong className="flex items-center gap-1.5 mb-1 text-[#FDE68A]"><Info size={14} aria-hidden /> Note :</strong> Les XP sont crédités lorsque votre filleul complète son profil à plus de 50%.
        Les parrainages sont limités à des profils réels — tout abus entraîne la suspension du compte.
      </div>
    </div>
  )
}
