'use client'

import { useEffect, useState } from 'react'
import { Sparkles, ExternalLink, Zap, MessageCircle, FileText, Brain, Info } from 'lucide-react'
import { KZ } from '@/lib/constants'

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

function StatBlock({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; color: string
}) {
  return (
    <div className="qx-panel p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl border border-[var(--kz-edge)] flex items-center justify-center shrink-0" style={{ background: color }}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-extrabold text-[var(--kz-ink)]">{value}</div>
        <div className="text-sm font-bold text-[var(--kz-ink)]">{label}</div>
        <div className="text-xs text-[var(--kz-mute)]">{sub}</div>
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

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] sm:text-[30px] font-bold text-white leading-tight">KazaIA — Statistiques</h1>
        <p className="text-sm text-[var(--kz-mute)] mt-1">Usage de l&apos;IA et estimation des coûts Groq</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 qxr-skeleton" />)}
        </div>
      ) : (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <StatBlock
              icon={<Sparkles size={18} color={KZ.violet} />}
              label="Requêtes IA estimées"
              value={totalRequests.toLocaleString('fr-FR')}
              sub="Lettres + entretiens + chats"
              color={KZ.violetSoft}
            />
            <StatBlock
              icon={<Zap size={18} color={KZ.orange} />}
              label="Coût Groq estimé"
              value={`~$${estimatedCost.toFixed(2)}`}
              sub="Estimation · modèle openai/gpt-oss-120b"
              color={KZ.orangeSoft}
            />
          </div>

          {/* Détail par feature */}
          <div className="qx-panel p-5 mb-5">
            <h2 className="text-sm font-bold text-[var(--kz-ink)] mb-4">Détail par fonctionnalité</h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  icon: <FileText size={16} color={KZ.violet} />,
                  label: 'Lettres de motivation',
                  count: stats.coverLettersEstimated,
                  cost: stats.coverLettersEstimated * COST_PER.coverLetter,
                  desc: `${stats.applicationsWithCoverLetter} candidatures avec lettre`,
                  color: KZ.violetSoft,
                },
                {
                  icon: <Brain size={16} color={KZ.blue} />,
                  label: 'Préparations entretien',
                  count: stats.interviewPrepsEstimated,
                  cost: stats.interviewPrepsEstimated * COST_PER.interviewPrep,
                  desc: `~15% des ${stats.totalApplications} candidatures`,
                  color: KZ.blueSoft,
                },
                {
                  icon: <MessageCircle size={16} color={KZ.green} />,
                  label: 'Messages Chat Assistant',
                  count: stats.chatsEstimated,
                  cost: stats.chatsEstimated * COST_PER.chat,
                  desc: `${stats.totalConversations} conversations · ~3 msg/conv`,
                  color: KZ.greenSoft,
                },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--kz-line)]" style={{ background: KZ.cream2 }}>
                  <div className="w-8 h-8 rounded-lg border border-[var(--kz-edge)] flex items-center justify-center shrink-0" style={{ background: row.color }}>
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[var(--kz-ink)]">{row.label}</div>
                    <div className="text-xs text-[var(--kz-mute)]">{row.desc}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-extrabold text-[var(--kz-ink)]">{row.count.toLocaleString('fr-FR')}</div>
                    <div className="text-[11px] text-[var(--kz-mute)]">~${row.cost.toFixed(3)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note + liens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="qx-panel p-5">
              <h3 className="text-sm font-bold text-[var(--kz-ink)] mb-2 flex items-center gap-1.5"><Info size={14} /> Note sur les estimations</h3>
              <p className="text-xs text-[var(--kz-mute)] leading-relaxed">
                Ces chiffres sont des <strong>estimations</strong> basées sur les données Supabase (candidatures, conversations).
                Pour un suivi exact, activez les logs IA dans les routes API ({' '}
                <code className="bg-[var(--kz-cream2)] px-1 rounded text-[10px]">/api/kaza-ia/*</code>).
              </p>
            </div>

            <div className="qx-panel p-5">
              <h3 className="text-sm font-bold text-[var(--kz-ink)] mb-3">Tableaux de bord fournisseurs</h3>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Console Groq', url: 'https://console.groq.com', color: KZ.orangeSoft },
                  { label: 'Supabase Studio', url: 'https://supabase.com/dashboard', color: KZ.greenSoft },
                  { label: 'Resend (emails)', url: 'https://resend.com/emails', color: KZ.violetSoft },
                ].map(link => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--kz-edge)] text-sm font-semibold text-[var(--kz-ink)] transition-all hover:shadow-[2px_2px_0_var(--kz-shadow)]"
                    style={{ background: link.color }}
                  >
                    <ExternalLink size={13} className="shrink-0" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
