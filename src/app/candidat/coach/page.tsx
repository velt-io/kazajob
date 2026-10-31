'use client'

import { useState } from 'react'
import { Sparkles, GraduationCap, Lightbulb, TrendingUp, Check, Target, Compass, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { InlineLoader } from '@/components/ui/LogoLoader'
import { useKazaCoach } from '@/features/ai/useKazaIA'
import { PanelTitle, QuestPageHeader } from '@/components/quest/candidat/QuestKit'

export default function KazaCoachPage() {
  const { generating, coach, raw, error, generate } = useKazaCoach()
  const [targetRole, setTargetRole] = useState('')

  return (
    <div className="max-w-[820px] mx-auto">
      <QuestPageHeader
        eyebrow="Mentor de la guilde"
        title="KazaCoach"
        icon={<Compass size={20} />}
        subtitle={<>Ton coach emploi IA : il analyse ton profil et te donne un plan d&apos;action concret pour le marché 974.</>}
      />

      <div className="qx-panel p-5 sm:p-6 mb-5 qx-rise" style={{ animationDelay: '0.08s' }}>
        <label htmlFor="coach-target" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--qx-gold)] mb-2">Métier visé (optionnel)</label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 min-w-0">
            <Input id="coach-target" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Ex : Développeur web, Aide-soignant, Commercial…" icon={<Target size={15} />} />
          </div>
          <Button kind="primary" size="md" className="h-11" icon={<Sparkles size={15} />} loading={generating}
            onClick={() => generate(targetRole || undefined)}>
            Analyser mon profil
          </Button>
        </div>
      </div>

      {generating && (
        <div className="flex flex-col items-center gap-3 py-10" role="status">
          <InlineLoader size={48} />
          <p className="text-sm text-[var(--kz-mute)]">KazaCoach consulte les astres de ton profil…</p>
        </div>
      )}

      {error && <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {coach && !generating && (
        <div className="flex flex-col gap-4 qxc-stagger">
          {/* Compatibilité */}
          <div className="qxc-card qxc-legend p-5 sm:p-6" style={{ ['--r' as string]: 'var(--qx-magenta)' }}>
            <div className="flex items-center justify-between mb-3 gap-3">
              <span className="text-sm font-bold text-white font-[family-name:var(--font-epic)] tracking-wide">Puissance de ton profil (974)</span>
              <span className="text-[30px] font-bold qx-text-arcane font-[family-name:var(--font-epic)] tabular-nums leading-none">{coach.compatibilite}%</span>
            </div>
            <div className="qx-xp" role="progressbar" aria-valuenow={coach.compatibilite} aria-valuemin={0} aria-valuemax={100} aria-label="Puissance du profil"><span style={{ width: `${coach.compatibilite}%` }} /></div>
          </div>

          {coach.competences_manquantes?.length > 0 && (
            <div className="qx-panel p-5">
              <PanelTitle icon={<GraduationCap size={13} />} color="#FB923C">Talents à acquérir</PanelTitle>
              <ul className="flex gap-2 flex-wrap">
                {coach.competences_manquantes.map((c, i) => (
                  <li key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md text-white border border-dashed border-[#FB923C]/50 bg-[rgba(251,146,60,0.08)]">
                    <span className="qxc-gem" style={{ ['--r' as string]: '#FB923C' }} aria-hidden />{c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {coach.experience_recommandee && (
            <div className="qx-panel p-5">
              <PanelTitle icon={<TrendingUp size={13} />} color="#4ADE80">Expérience recommandée</PanelTitle>
              <p className="text-sm text-[var(--kz-text)] leading-relaxed">{coach.experience_recommandee}</p>
            </div>
          )}

          {coach.conseils?.length > 0 && (
            <div className="qx-panel p-5">
              <PanelTitle icon={<Lightbulb size={13} />} color="var(--qx-neon)">Conseils de candidature</PanelTitle>
              <ul className="flex flex-col gap-2">
                {coach.conseils.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--kz-text)]"><Check size={14} className="mt-0.5 shrink-0 text-[#86EFAC]" aria-hidden />{c}</li>
                ))}
              </ul>
            </div>
          )}

          {coach.ameliorations?.length > 0 && (
            <div className="qx-panel p-5">
              <PanelTitle icon={<Sparkles size={13} />}>Pistes d&apos;amélioration</PanelTitle>
              <ul className="flex flex-col gap-2">
                {coach.ameliorations.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--kz-text)]"><ChevronRight size={14} className="mt-0.5 shrink-0 text-[var(--qx-gold)]" aria-hidden />{c}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-[var(--kz-mute)] italic text-center">Généré par KazaCoach — à titre indicatif. Complète ton profil pour des conseils plus précis.</p>
        </div>
      )}

      {raw && !coach && !generating && (
        <div className="qx-panel p-5 text-sm text-[var(--kz-text)] leading-relaxed whitespace-pre-wrap">{raw}</div>
      )}
    </div>
  )
}
