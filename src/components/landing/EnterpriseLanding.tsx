import Link from 'next/link'
import { ArrowRight, Check, Users, BarChart2, Zap, Shield, Globe, Landmark, Target, Briefcase, Search, Rss, Lock, HeartHandshake, Clock, FileText, Gift, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { KZ, SUBSCRIPTION_PLANS, PARTNERS, MULTIDIFFUSION_ENABLED, planFeatures } from '@/lib/constants'
import { PartnerCarousel } from './PartnerCarousel'
import { QualityModerationSection } from './QualityModerationSection'
import { EnterpriseComparisonSection } from './EnterpriseComparisonSection'
import { RiskReversalSection } from './RiskReversalSection'
import { RecruiterPainSection } from './RecruiterPainSection'
import { ProductPreviewSection } from './ProductPreviewSection'
import { SectorsSection } from './SectorsSection'
import { IllustratedCta } from './IllustratedCta'
import { GuildRoster } from '@/components/quest/GuildRoster'

const PARTNER_ICON_MAP: Record<string, React.ReactNode> = {
  Landmark:  <Landmark  size={16} />,
  Target:    <Target    size={16} />,
  Briefcase: <Briefcase size={16} />,
  Search:    <Search    size={16} />,
  Rss:       <Rss       size={16} />,
}

interface EnterpriseLandingProps {
  stats: { jobs: number; companies: number; users: number }
  launchDays?: number | null
}

function PriceCard({ plan, isHighlight, launchDays }: { plan: typeof SUBSCRIPTION_PLANS[0]; isHighlight?: boolean; launchDays?: number | null }) {
  const euros = Math.floor(plan.priceCts / 100)
  return (
    <div
      className="kz-card p-6 flex flex-col relative"
      style={{
        background: isHighlight ? 'linear-gradient(180deg, rgba(88,28,135,0.95), rgba(30,12,60,0.95))' : KZ.paper,
        color: isHighlight ? 'white' : KZ.ink,
        boxShadow: isHighlight ? '6px 6px 0 var(--kz-shadow)' : '3px 3px 0 var(--kz-shadow)',
        transform: isHighlight ? 'scale(1.03)' : 'none',
      }}
    >
      {isHighlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <Badge color="orange" size="md">⭐ Le plus populaire</Badge>
        </div>
      )}
      <div className="text-sm font-bold mb-1 opacity-70">{plan.name}</div>
      <div className="text-[42px] font-extrabold tracking-tight leading-none mb-1">
        {euros}€
        <span className="text-base font-semibold opacity-60">/mois</span>
      </div>
      <div className="text-xs opacity-60 mb-4">
        {launchDays ? `Lancement · ${launchDays} jours restants` : "30 jours d'essai · 1er débit après l'essai"}
      </div>

      <div className="flex flex-col gap-2 mb-6 flex-1">
        {planFeatures(plan).map(f => (
          <div key={f} className="flex items-start gap-2 text-sm">
            <Check size={14} className="mt-0.5 shrink-0" style={{ color: isHighlight ? KZ.orange : KZ.green }} />
            <span style={{ opacity: isHighlight ? 0.9 : 0.85 }}>{f}</span>
          </div>
        ))}
        {/* Partenaires (multidiffusion — masqué tant que OFF) */}
        {MULTIDIFFUSION_ENABLED && plan.partners.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20">
            <div className="text-xs font-bold mb-1.5 opacity-70">Diffusion incluse :</div>
            {plan.partners.map(p => {
              const partner = PARTNERS[p]
              return partner ? (
                <div key={p} className="text-xs flex items-center gap-1.5 mb-1">
                  {PARTNER_ICON_MAP[partner.icon]}
                  <span style={{ opacity: 0.85 }}>{partner.name}</span>
                </div>
              ) : null
            })}
          </div>
        )}
        {plan.apiAccess && (
          <div className="flex items-center gap-2 text-sm">
            <Check size={14} className="shrink-0" style={{ color: KZ.orange }} />
            <span>Accès API complet</span>
          </div>
        )}
      </div>

      <Link href={`/inscription?role=recruiter&plan=${plan.id}`}>
        <Button
          kind={isHighlight ? 'primary' : 'outline'}
          size="lg"
          full
          iconRight={<ArrowRight size={14} />}
        >
          {launchDays ? 'Démarrer gratuitement' : 'Essai gratuit 30 jours'}
        </Button>
      </Link>
    </div>
  )
}

// Personnage de la carte flottante du hero (exemple illustratif)
const HERO_CANDIDATE = {
  skinColor: 'd08b5b', top: 'curvy', hairColor: '2c1b18', eyes: 'happy', eyebrow: 'defaultNatural',
  mouth: 'smile', clothes: 'blazerAndShirt', clothesColor: 'ff488e', accessories: 'blank', facialHair: 'blank',
}

export function EnterpriseLanding({ stats, launchDays }: EnterpriseLandingProps) {
  const topPlan = SUBSCRIPTION_PLANS[SUBSCRIPTION_PLANS.length - 1]
  const VALUE_PROPS = [
    { icon: <Users size={24} />, color: KZ.violetSoft, title: 'Gestion d\'équipe', desc: 'Plusieurs recruteurs sur un même compte. Rôles, permissions, KazaScore collectif.' },
    ...(MULTIDIFFUSION_ENABLED ? [{ icon: <Globe size={24} />, color: KZ.blueSoft, title: 'Multi-diffusion', desc: 'Publiez une fois, diffusez partout : France Travail, Mission Locale, APEC, Indeed et plus.' }] : []),
    { icon: <Zap size={24} />, color: KZ.yellowSoft, title: 'IA de tri', desc: 'KazaIA analyse chaque candidature et propose une recommandation : à contacter, à étudier…' },
    { icon: <BarChart2 size={24} />, color: KZ.greenSoft, title: 'Analytics RH', desc: 'Pipeline de candidatures, taux de conversion, temps de réponse, KazaScore recruteur.' },
    { icon: <Shield size={24} />, color: KZ.orangeSoft, title: 'Conformité RGPD', desc: 'Données hébergées en Europe, chiffrées en transit et au repos. Droit à l\'oubli sur demande.' },
  ]

  // Preuves concrètes : on n'affiche un chiffre que s'il est parlant
  const TRUST = [
    stats.users >= 20 ? { icon: <Users size={14} />, label: `${stats.users.toLocaleString('fr-FR')} candidats inscrits` } : { icon: <MapPin size={14} />, label: '100 % La Réunion' },
    { icon: <Clock size={14} />, label: 'Offre en ligne en 5 min' },
    { icon: <Check size={14} />, label: 'Sans engagement' },
  ]

  const ctaLabel = launchDays ? 'Publier gratuitement' : 'Essai gratuit 30 jours'

  return (
    <>
      {/* HERO B2B ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 pt-10 lg:pt-16 pb-14 lg:pb-20 relative overflow-hidden" style={{ background: KZ.cream }}>
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-center">
          <div>
            <Badge color="violet" size="lg" className="mb-5">Kazajob Entreprises · 974</Badge>
            <h1 className="text-[40px] sm:text-[56px] lg:text-[66px] font-extrabold tracking-[-0.04em] leading-[0.95] text-[var(--kz-ink)] mb-5">
              Recrutez votre<br />
              <span className="qx-text-arcane">guilde de talents</span><br />
              à La Réunion.
            </h1>
            <p className="text-base lg:text-lg leading-relaxed text-[var(--kz-text)] mb-7 max-w-[520px]">
              Publiez vos offres, recevez des candidats locaux triés par l&apos;IA et gérez tout votre recrutement
              au même endroit. Simple, rapide, pensé pour les entreprises du 974.
            </p>
            <div className="flex flex-wrap gap-3 mb-5">
              <Link href="/inscription?role=recruiter">
                <Button kind="primary" size="lg" iconRight={<ArrowRight size={15} />}>{ctaLabel}</Button>
              </Link>
              <a href="#tarifs-pro">
                <Button kind="outline" size="lg">Voir les tarifs</Button>
              </a>
            </div>
            <p className="text-xs text-[var(--kz-mute)] mb-6">
              {launchDays
                ? `Offre de lancement · encore ${launchDays} jours · sans carte bancaire`
                : 'Carte requise · 1er débit après 30 jours · annulable à tout moment'}
            </p>
            <div className="flex flex-wrap gap-2">
              {TRUST.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--kz-edge)] bg-[var(--kz-paper)] text-xs font-bold text-[var(--kz-ink)]">
                  <span style={{ color: KZ.violet }}>{t.icon}</span>{t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Votre future guilde */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-8 bg-[radial-gradient(closest-side,rgba(168,85,247,0.35),transparent)] blur-2xl" />
            <div className="relative">
              <div className="kz-eyebrow text-[var(--qx-gold)] mb-3 text-center">Votre future guilde</div>
              <GuildRoster />
              <div className="mt-4 mx-auto w-fit flex items-center gap-2 px-4 py-2 rounded-lg border border-[#FACC15]/40 bg-[rgba(250,204,21,0.08)] text-[12px] font-bold uppercase tracking-[0.1em] text-[#FDE68A]">
                {launchDays ? <><Gift size={14} /> Gratuit pendant le lancement</> : <><Sparkles size={14} /> Tri des CV par KazaIA</>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARTENAIRES (multidiffusion — masqué tant que OFF) ───── */}
      {MULTIDIFFUSION_ENABLED && (
        <section className="px-4 sm:px-8 lg:px-16 py-10 border-y border-[var(--kz-edge)]" style={{ background: KZ.cream2 }}>
          <p className="text-center text-xs font-bold text-[var(--kz-mute)] uppercase tracking-widest mb-6">
            Multi-diffusion automatique vers
          </p>
          <div className="max-w-[1100px] mx-auto">
            <PartnerCarousel />
          </div>
        </section>
      )}

      {/* PROBLÈMES → SOLUTIONS ───────────────────────────────── */}
      <RecruiterPainSection />

      {/* APERÇU PRODUIT ──────────────────────────────────────── */}
      <ProductPreviewSection />

      {/* VALEUR AJOUTÉE ─────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-20 border-t border-[var(--kz-edge)]" style={{ background: KZ.cream }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Pourquoi Kazajob Pro</p>
            <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[var(--kz-ink)]">
              Une plateforme RH pensée pour La Réunion.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUE_PROPS.map(p => (
              <div key={p.title} className="kz-card p-6 bg-[var(--kz-paper)]">
                <div className="w-12 h-12 rounded-xl border border-[var(--kz-edge)] flex items-center justify-center mb-4 text-[var(--kz-ink)]"
                  style={{ background: p.color }}>
                  {p.icon}
                </div>
                <h3 className="text-base font-bold text-[var(--kz-ink)] mb-2">{p.title}</h3>
                <p className="text-sm text-[var(--kz-mute)] leading-relaxed">{p.desc}</p>
              </div>
            ))}
            {/* Carte CTA */}
            <div className="kz-card p-6 flex flex-col justify-between" style={{ background: KZ.violet }}>
              <div>
                <Badge color="orange" size="md" className="mb-4">Nouveau</Badge>
                <h3 className="text-base font-bold text-white mb-2">Groupe recruteurs</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  Invitez votre équipe RH. Chaque recruteur a son tableau de bord, les offres sont partagées.
                </p>
              </div>
              <Link href="/inscription?role=recruiter" className="mt-4">
                <Button kind="primary" size="md" full>Créer mon compte entreprise</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE — recruteur ─────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-16 lg:py-20 border-t border-[var(--kz-edge)]" style={{ background: KZ.cream2 }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Processus de recrutement</p>
            <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[var(--kz-ink)]">
              Recruter sur Kazajob, c&apos;est simple.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 gap-y-9">
            {[
              { n: '1', color: KZ.violetSoft, icon: <Briefcase size={26} />, title: 'Créez votre compte', desc: 'Inscription en 3 minutes. Configurez votre entreprise, logo, secteur, équipe RH.' },
              { n: '2', color: KZ.yellowSoft, icon: <FileText size={26} />, title: 'Publiez votre offre', desc: 'Formulaire guidé, mention H/F vérifiée, questions de préqualification, fourchette salariale.' },
              { n: '3', color: KZ.greenSoft, icon: <Users size={26} />, title: 'Recevez les candidatures', desc: 'KazaIA trie et classe les dossiers. Pipeline intégré. Messagerie directe avec les candidats.' },
              { n: '4', color: KZ.orangeSoft, icon: <HeartHandshake size={26} />, title: 'Recrutez & mesurez', desc: 'Suivi du temps de réponse (KazaScore), analytics de conversion, historique complet.' },
            ].map((step) => (
              <div key={step.n} className="kz-card p-6 relative pt-10 bg-[var(--kz-paper)]">
                <div className="absolute -top-5 left-6 w-11 h-11 rounded-full flex items-center justify-center text-lg font-extrabold border border-[var(--kz-edge)]"
                  style={{ background: KZ.inverse, color: KZ.onInverse, boxShadow: '3px 3px 0 var(--kz-orange)' }}>
                  {step.n}
                </div>
                <div className="w-12 h-12 rounded-xl border border-[var(--kz-edge)] flex items-center justify-center mb-4 text-[var(--kz-ink)]"
                  style={{ background: step.color }}>
                  {step.icon}
                </div>
                <h3 className="text-base font-bold text-[var(--kz-ink)] mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--kz-mute)] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTEURS ───────────────────────────────────────────── */}
      <SectorsSection variant="entreprise" />

      {/* OFFRE DE LANCEMENT ─────────────────────────────────── */}
      {launchDays ? (
        <IllustratedCta
          image="/assets/img/scenes/cadre-tropical-1.webp"
          eyebrow={<Badge color="orange" size="lg" icon={<Gift size={13} />}>Offre de lancement · {launchDays} jours restants</Badge>}
          title={<>Publiez vos offres<br /><span style={{ color: KZ.violet }}>gratuitement.</span></>}
          text="Pendant le lancement de Kazajob, les entreprises réunionnaises publient sans payer et sans carte bancaire. Profitez-en pour constituer votre vivier de talents."
          actions={
            <Link href="/inscription?role=recruiter">
              <Button kind="primary" size="lg" iconRight={<ArrowRight size={15} />}>J&apos;en profite</Button>
            </Link>
          }
          footnote="Aucun prélèvement automatique à la fin du lancement : vous choisissez ensuite librement."
        />
      ) : null}

      {/* QUALITÉ & MODÉRATION ───────────────────────────────── */}
      <QualityModerationSection />

      {/* GARANTIES ──────────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-16 border-t border-[var(--kz-edge)]" style={{ background: KZ.inverse }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-10">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.orange }}>Nos engagements</p>
            <h2 className="text-2xl lg:text-[32px] font-extrabold tracking-tight" style={{ color: KZ.onInverse }}>
              Ce que Kazajob garantit à chaque recruteur.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Lock size={22} />, color: KZ.violetSoft, title: 'RGPD & Données sécurisées', desc: 'Hébergement européen (Neon/Vercel EU). Chiffrement en transit et au repos. Droit à l\'oubli sur simple demande. Aucune revente de données candidates.' },
              { icon: <Clock size={22} />, color: KZ.greenSoft, title: 'Disponibilité 99,9 %', desc: 'Infrastructure serverless Vercel. Pas de maintenance programmée. Monitoring temps réel. Vos offres restent en ligne même en pic d\'activité.' },
              { icon: <HeartHandshake size={22} />, color: KZ.yellowSoft, title: 'Support local réactif', desc: 'Une équipe réunionnaise disponible du lundi au vendredi. Réponse garantie sous 24h. Accompagnement à l\'onboarding inclus dans tous les plans.' },
              { icon: <BarChart2 size={22} />, color: KZ.orangeSoft, title: 'Transparence des données', desc: 'Statistiques réelles affichées : vues, candidatures, taux d\'ouverture. Aucune donnée gonflée. Vos performances, telles qu\'elles sont.' },
              { icon: <Shield size={22} />, color: KZ.blueSoft, title: 'Conformité légale 974', desc: 'Mention H/F vérifiée à la publication. Aide à la rédaction d\'offres conformes au Code du Travail. Archivage légal des candidatures pendant 2 ans.' },
              { icon: <Users size={22} />, color: KZ.cream2, title: 'Candidats qualifiés locaux', desc: 'Plateforme 100% tournée vers La Réunion et Mayotte. Matching géographique inclus d\'office.' },
            ].map((g) => (
              <div key={g.title} className="flex gap-4 p-5 rounded-2xl border border-white/10"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center shrink-0"
                  style={{ background: g.color, color: KZ.ink }}>
                  {g.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: KZ.onInverse }}>{g.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,247,238,0.6)' }}>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARATIF ─────────────────────────────────────────── */}
      <EnterpriseComparisonSection />

      {/* PRICING ─────────────────────────────────────────────── */}
      <section id="tarifs-pro" className="px-4 sm:px-8 lg:px-16 py-16 lg:py-20 border-t border-[var(--kz-edge)] scroll-mt-20"
        style={{ background: KZ.cream2 }}>
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Tarifs</p>
            <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[var(--kz-ink)]">
              Un forfait pour chaque taille d&apos;entreprise.
            </h2>
            <p className="text-sm text-[var(--kz-mute)] mt-2">
              {launchDays
                ? `Phase de lancement · ${launchDays} jours restants · accès gratuit sans carte bancaire`
                : "30 jours d'essai sur tous les plans · Carte requise · 1er débit après l'essai"}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 gap-y-8 items-end">
            {SUBSCRIPTION_PLANS.map(plan => (
              <PriceCard key={plan.id} plan={plan} isHighlight={plan.highlight} launchDays={launchDays} />
            ))}
          </div>
          <p className="text-center text-xs text-[var(--kz-mute)] mt-6">
            Tarifs nets · TVA non applicable, art. 293 B du CGI (micro-entreprise) · Paiement mensuel
          </p>
        </div>
      </section>

      {/* RÉASSURANCE SANS RISQUE ────────────────────────────── */}
      <RiskReversalSection launchDays={launchDays} />

      {/* FAQ RECRUTEUR ──────────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-14 lg:py-16 border-t border-[var(--kz-edge)]" style={{ background: KZ.cream }}>
        <div className="max-w-[860px] mx-auto">
          <div className="text-center mb-10">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Questions fréquentes</p>
            <h2 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[var(--kz-ink)]">
              Vous avez des questions. On a les réponses.
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { q: 'Puis-je annuler à tout moment ?', a: 'Oui. L\'annulation est effective immédiatement depuis votre espace recruteur. Aucun frais de résiliation, aucun engagement. Le prochain débit est simplement annulé.' },
              { q: 'Combien de recruteurs peuvent utiliser le même compte ?', a: `Cela dépend de votre forfait : ${SUBSCRIPTION_PLANS.map((p) => `${p.name} ${p.maxMembers} recruteur${p.maxMembers > 1 ? 's' : ''}`).join(', ')}. Vous invitez vos collègues depuis Paramètres > Équipe.` },
              { q: 'Mes offres sont-elles visibles immédiatement après publication ?', a: 'Oui, dès la validation du formulaire votre offre est en ligne. Les candidats la voient en temps réel. Les offres boostées apparaissent en tête de liste pendant la durée du boost.' },
              { q: launchDays ? 'Comment fonctionne la période de lancement ?' : 'Comment fonctionne l\'essai gratuit ?', a: launchDays ? `Kazajob est en phase de lancement. Vous pouvez accéder à la plateforme gratuitement encore ${launchDays} jours, sans carte bancaire. À l'issue du lancement, vous choisissez un forfait payant ou votre accès passe en lecture seule.` : "Votre carte est débitée automatiquement du montant du plan choisi à la fin des 30 jours. Vous recevez un email de rappel 3 jours avant. Si vous annulez avant la fin de l'essai, aucun débit n'est effectué." },
              { q: 'Les données de mes candidats sont-elles sécurisées ?', a: 'Absolument. Les données sont hébergées en Europe, chiffrées en transit (HTTPS/TLS) et au repos. Kazajob est conforme RGPD. Les candidats peuvent exercer leur droit à l\'effacement à tout moment.' },
              { q: 'Je suis une grande structure ou un cabinet RH, est-ce adapté ?', a: `Oui. Le forfait ${topPlan.name} accueille jusqu'à ${topPlan.maxMembers} recruteurs avec des offres illimitées. Pour un besoin spécifique, écrivez-nous : on construit la solution avec vous.` },
            ].map((item) => (
              <details key={item.q} className="kz-card bg-[var(--kz-paper)] group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none">
                  <h3 className="text-sm font-bold text-[var(--kz-ink)]">{item.q}</h3>
                  <span className="w-7 h-7 rounded-full border border-[var(--kz-edge)] flex items-center justify-center shrink-0 text-lg leading-none transition-transform group-open:rotate-45" style={{ background: KZ.violetSoft }}>+</span>
                </summary>
                <p className="text-sm text-[var(--kz-mute)] leading-relaxed px-5 pb-5 -mt-1">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-[var(--kz-mute)]">Une autre question ?{' '}
              <a href="mailto:contact@kazajob.re" className="font-bold text-[var(--kz-ink)] hover:underline">contact@kazajob.re</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL ───────────────────────────────────────────── */}
      <IllustratedCta
        image="/assets/img/scenes/coucher-soleil.webp"
        title={<>Prêt à recruter<br /><span style={{ color: KZ.violet }}>différemment ?</span></>}
        text="Créez votre compte entreprise en 3 minutes et publiez votre première offre dès aujourd'hui."
        actions={
          <>
            <Link href="/inscription?role=recruiter">
              <Button kind="primary" size="lg" iconRight={<ArrowRight size={15} />}>{ctaLabel}</Button>
            </Link>
            <Link href="/contact">
              <Button kind="outline" size="lg">Parler à l&apos;équipe</Button>
            </Link>
          </>
        }
        footnote={launchDays ? 'Sans carte bancaire · Sans engagement · Support local' : 'Sans engagement · Annulable à tout moment · Support local'}
      />
    </>
  )
}
