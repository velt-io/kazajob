'use client'

import { useState, type ReactNode } from 'react'
import { Sparkles, GraduationCap, Lightbulb, TrendingUp, CheckCircle2, Target, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineLoader } from '@/components/ui/LogoLoader'
import { useKazaCoach } from '@/features/ai/useKazaIA'
import { LargeTitle, MatchRing } from '@/components/os/candidate/primitives'

function Block({ icon, tint, title, children, i }: { icon: ReactNode; tint: string; title: string; children: ReactNode; i: number }) {
  return (
    <section className="osc-card osc-in p-5 sm:p-6" style={{ ['--i' as string]: i }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ color: tint, background: `color-mix(in srgb, ${tint} 16%, transparent)` }}>{icon}</span>
        <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--kz-ink)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function KazaCoachPage() {
  const { generating, coach, raw, error, generate } = useKazaCoach()
  const [targetRole, setTargetRole] = useState('')

  return (
    <div className="max-w-[760px] mx-auto">
      <LargeTitle
        eyebrow="Assistant candidat"
        title="KazaCoach"
        subtitle="Ton coach emploi IA analyse ton profil et te propose un plan d'action concret pour le marché 974."
      />

      {/* Saisie */}
      <form
        onSubmit={(e) => { e.preventDefault(); generate(targetRole || undefined) }}
        className="os-glass os-ring-aurora rounded-[26px] p-2 flex flex-col sm:flex-row gap-2 mb-8 shadow-[var(--os-elevation)]"
      >
        <label className="flex-1 flex items-center gap-3 h-12 px-4 rounded-[20px] bg-[var(--osc-surface)] focus-within:bg-[var(--osc-surface-hi)]">
          <Target size={17} className="text-[var(--kz-mute)] shrink-0" />
          <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} aria-label="Métier visé (optionnel)"
            placeholder="Métier visé (optionnel) : développeur web, aide-soignant…"
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[var(--kz-ink)] placeholder:text-[var(--kz-mute)]" />
        </label>
        <Button type="submit" kind="primary" size="lg" icon={<Sparkles size={15} />} loading={generating}>
          Analyser mon profil
        </Button>
      </form>

      {generating && (
        <div className="flex flex-col items-center gap-3 py-10 osc-fade">
          <InlineLoader size={48} />
          <p className="text-sm text-[var(--kz-mute)]">KazaCoach analyse ton profil…</p>
        </div>
      )}

      {error && <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {coach && !generating && (
        <div className="flex flex-col gap-4">
          {/* Force du profil */}
          <section className="osc-mesh osc-in relative overflow-hidden rounded-[28px] border border-[var(--kz-edge)] p-6 flex items-center gap-5">
            <MatchRing value={coach.compatibilite} size={88} stroke={8} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[color-mix(in_srgb,var(--kz-ink)_70%,transparent)]">Force de ton profil</p>
              <p className="text-[26px] sm:text-[30px] font-semibold tracking-[-0.04em] text-[var(--kz-ink)] leading-tight mt-1">{coach.compatibilite} % sur le marché 974</p>
            </div>
          </section>

          {coach.competences_manquantes?.length > 0 && (
            <Block i={1} icon={<GraduationCap size={15} />} tint="var(--kz-orange)" title="Compétences à acquérir">
              <div className="flex gap-2 flex-wrap">
                {coach.competences_manquantes.map((c, i) => (
                  <span key={i} className="inline-flex items-center h-8 px-3.5 rounded-full text-[13px] font-medium text-[var(--kz-ink)] bg-[var(--kz-line)]">{c}</span>
                ))}
              </div>
            </Block>
          )}

          {coach.experience_recommandee && (
            <Block i={2} icon={<TrendingUp size={15} />} tint="var(--kz-green)" title="Expérience recommandée">
              <p className="text-[15px] text-[var(--kz-text)] leading-relaxed">{coach.experience_recommandee}</p>
            </Block>
          )}

          {coach.conseils?.length > 0 && (
            <Block i={3} icon={<Lightbulb size={15} />} tint="var(--kz-violet)" title="Conseils de candidature">
              <ul className="flex flex-col gap-3">
                {coach.conseils.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[15px] text-[var(--kz-text)] leading-relaxed"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[var(--kz-green)]" />{c}</li>
                ))}
              </ul>
            </Block>
          )}

          {coach.ameliorations?.length > 0 && (
            <Block i={4} icon={<Sparkles size={15} />} tint="var(--kz-blue)" title="Pistes d'amélioration">
              <ul className="flex flex-col gap-3">
                {coach.ameliorations.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[15px] text-[var(--kz-text)] leading-relaxed"><ArrowUpRight size={17} className="mt-0.5 shrink-0 text-[var(--kz-blue)]" />{c}</li>
                ))}
              </ul>
            </Block>
          )}

          <p className="text-[12px] text-[var(--kz-mute)] text-center mt-2">Généré par KazaCoach, à titre indicatif. Complète ton profil pour des conseils plus précis.</p>
        </div>
      )}

      {raw && !coach && !generating && (
        <div className="osc-card p-5 text-[15px] text-[var(--kz-text)] leading-relaxed whitespace-pre-wrap">{raw}</div>
      )}
    </div>
  )
}
