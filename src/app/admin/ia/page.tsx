'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Sparkles, ExternalLink, Zap, MessageCircle, FileText, Brain, Info, LayoutGrid } from 'lucide-react'
import { ACCENT, CountUp, PageHeader, SkeletonList, Widget, accentStyle, tint } from '@/components/os/recruiter/primitives'

interface AIStats {
  totalApplications: number
  applicationsWithCoverLetter: number
  totalConversations: number
  coverLettersEstimated: number
  interviewPrepsEstimated: number
  chatsEstimated: number
}

// Coût estimé Groq (llama-3.3-70b-versatile) au 2024
// ~$0.59 / M tokens input, ~$0.79 / M tokens output
// Estimation : cover letter ~800 tokens, interview prep ~1200 tokens, chat ~400 tokens
const COST_PER = {
  coverLetter:   0.0009,  // $ par génération
  interviewPrep: 0.0015,
  chat:          0.0005,
}

function StatBlock({ icon, label, value, format, sub, accent, i }: {
  icon: React.ReactNode; label: string; value: number; format?: (n: number) => string; sub: string; accent: string; i: number
}) {
  return (
    <div className="osr-in osr-glow rounded-[24px] os-glass p-5 flex items-start gap-4 min-w-0" style={{ ...accentStyle(accent), '--i': i } as CSSProperties}>
      <span className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 text-white" style={{ background: accent }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[30px] font-semibold tracking-[-0.05em] leading-none text-white"><CountUp value={value} format={format} /></div>
        <div className="text-[14px] font-medium text-white mt-1.5">{label}</div>
        <div className="text-[12px] text-[var(--kz-mute)]">{sub}</div>
      </div>
    </div>
  )
}

export default function AdminAIPage() {
  const [stats, setStats] = useState<AIStats>({
    totalApplications: 0,
    applicationsWithCoverLetter: 0,
    totalConversations: 0,
    coverLettersEstimated: 0,
    interviewPrepsEstimated: 0,
    chatsEstimated: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/ai-stats')
        if (res.ok) {
          const { totalApplications, applicationsWithCoverLetter, totalConversations } = await res.json()
          const clCount   = applicationsWithCoverLetter ?? 0
          const chatCount = (totalConversations ?? 0) * 3  // estimation moyenne 3 messages par conversation
          const ipCount   = Math.round((totalApplications ?? 0) * 0.15)  // estimation 15% utilisent interview prep

          setStats({
            totalApplications:          totalApplications ?? 0,
            applicationsWithCoverLetter: clCount,
            totalConversations:          totalConversations ?? 0,
            coverLettersEstimated:       clCount,
            interviewPrepsEstimated:     ipCount,
            chatsEstimated:              chatCount,
          })
        }
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [])

  const estimatedCost = (
    stats.coverLettersEstimated * COST_PER.coverLetter +
    stats.interviewPrepsEstimated * COST_PER.interviewPrep +
    stats.chatsEstimated * COST_PER.chat
  )

  const totalRequests = stats.coverLettersEstimated + stats.interviewPrepsEstimated + stats.chatsEstimated

  const rows = [
    {
      icon: <FileText size={16} />,
      label: 'Lettres de motivation',
      count: stats.coverLettersEstimated,
      cost: stats.coverLettersEstimated * COST_PER.coverLetter,
      desc: `${stats.applicationsWithCoverLetter} candidatures avec lettre`,
      accent: ACCENT.violet,
    },
    {
      icon: <Brain size={16} />,
      label: 'Préparations entretien',
      count: stats.interviewPrepsEstimated,
      cost: stats.interviewPrepsEstimated * COST_PER.interviewPrep,
      desc: `~15% des ${stats.totalApplications} candidatures`,
      accent: ACCENT.blue,
    },
    {
      icon: <MessageCircle size={16} />,
      label: 'Messages Chat Assistant',
      count: stats.chatsEstimated,
      cost: stats.chatsEstimated * COST_PER.chat,
      desc: `${stats.totalConversations} conversations · ~3 msg/conv`,
      accent: ACCENT.green,
    },
  ]
  const maxCount = Math.max(1, ...rows.map((r) => r.count))

  return (
    <div className="max-w-[1000px] mx-auto">
      <PageHeader eyebrow="Intelligence" title={<>Kaza<span className="os-text-aurora">IA</span> — Statistiques</>} subtitle="Usage de l'IA et estimation des coûts Groq" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonList rows={1} height={110} />
          <SkeletonList rows={1} height={110} />
        </div>
      ) : (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <StatBlock i={0}
              icon={<Sparkles size={18} />}
              label="Requêtes IA estimées"
              value={totalRequests}
              sub="Lettres + entretiens + chats"
              accent={ACCENT.violet}
            />
            <StatBlock i={1}
              icon={<Zap size={18} />}
              label="Coût Groq estimé"
              value={estimatedCost}
              format={(n) => `~$${n.toFixed(2)}`}
              sub="Estimation · modèle openai/gpt-oss-120b"
              accent={ACCENT.orange}
            />
          </div>

          {/* Détail par feature */}
          <Widget title="Détail par fonctionnalité" icon={<LayoutGrid size={14} />} accent={ACCENT.indigo} className="mb-4" bodyClassName="px-2 pb-2">
            <div className="flex flex-col">
              {rows.map((row, i) => (
                <div key={row.label} className="osr-row flex items-center gap-3 sm:gap-4 px-3 py-3">
                  <span className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: tint(row.accent, 18), color: row.accent }}>
                    {row.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white">{row.label}</div>
                    <div className="text-[12px] text-[var(--kz-mute)] truncate">{row.desc}</div>
                    <div className="osr-bar !h-1 mt-2" style={{ '--i': i } as CSSProperties}>
                      <span style={{ width: `${(row.count / maxCount) * 100}%`, background: row.accent }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[18px] font-semibold tracking-[-0.03em] text-white tabular-nums">{row.count.toLocaleString('fr-FR')}</div>
                    <div className="text-[11px] text-[var(--kz-mute)] tabular-nums">~${row.cost.toFixed(3)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Widget>

          {/* Note + liens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Widget title="Note sur les estimations" icon={<Info size={14} />} accent={ACCENT.blue}>
              <p className="text-[13px] text-[var(--kz-mute)] leading-relaxed">
                Ces chiffres sont des <strong className="text-white font-semibold">estimations</strong> basées sur les données Supabase (candidatures, conversations).
                Pour un suivi exact, activez les logs IA dans les routes API ({' '}
                <code className="osr-chip font-mono !h-5 !text-[10px]">/api/kaza-ia/*</code>).
              </p>
            </Widget>

            <Widget title="Tableaux de bord fournisseurs" bodyClassName="px-2 pb-2">
              <div className="flex flex-col">
                {[
                  { label: 'Console Groq', url: 'https://console.groq.com', accent: ACCENT.orange },
                  { label: 'Supabase Studio', url: 'https://supabase.com/dashboard', accent: ACCENT.green },
                  { label: 'Resend (emails)', url: 'https://resend.com/emails', accent: ACCENT.violet },
                ].map(link => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="osr-row group flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-white"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: link.accent, boxShadow: `0 0 8px ${link.accent}` }} />
                    <span className="flex-1">{link.label}</span>
                    <ExternalLink size={13} className="shrink-0 text-[var(--kz-mute)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ))}
              </div>
            </Widget>
          </div>
        </>
      )}
    </div>
  )
}
