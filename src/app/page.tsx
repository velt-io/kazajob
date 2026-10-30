import Link from 'next/link'
import { ArrowRight, Sparkles, Users, Briefcase, MapPin } from 'lucide-react'
import { NavLanding } from '@/components/layout/NavLanding'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { SearchBarLanding } from '@/components/ui/SearchBarLanding'
import { HeroWidgets } from '@/components/os/HeroWidgets'
import { RecruiterWindow } from '@/components/os/RecruiterWindow'
import { WhySection }         from '@/components/landing/WhySection'
import { KazaIASpotlight }    from '@/components/landing/KazaIASpotlight'
import { RoadmapSection }     from '@/components/landing/RoadmapSection'
import { FaqSection }         from '@/components/landing/FaqSection'
import { SectorsSection }     from '@/components/landing/SectorsSection'
import { AvatarShowcaseSection } from '@/components/landing/AvatarShowcaseSection'
import { IllustratedCta }     from '@/components/landing/IllustratedCta'
import { KZ } from '@/lib/constants'
import { getCachedLandingData, getCachedLaunchPublicData } from '@/lib/queries/cached'
import { formatSalary } from '@/lib/utils'

import { launchDaysLeft } from '@/lib/launch'

// Page pré-générée (ISR) : servie instantanément, régénérée en arrière-plan toutes les 5 min.
export const revalidate = 300

// Contenu marketing statique — ne change pas en fonction des données
const HOW_STEPS = [
  {
    n: '1', color: KZ.violetSoft, icon: <Users size={28} />,
    title: 'Crée ton profil',
    desc: "3 minutes chrono. Importe ton CV, on l'analyse, on remplit pour toi.",
  },
  {
    n: '2', color: KZ.yellowSoft, icon: <Sparkles size={28} />,
    title: 'On matche pour toi',
    desc: 'Notre IA croise tes compétences avec les offres locales et te montre celles qui te correspondent.',
  },
  {
    n: '3', color: KZ.greenSoft, icon: <ArrowRight size={28} />,
    title: 'Postule en 1 clic',
    desc: 'CV pré-rempli, message personnalisé suggéré. Le recruteur te répond directement.',
  },
]

const CARD_COLORS = [KZ.orangeSoft, KZ.violetSoft, KZ.greenSoft, KZ.yellowSoft, KZ.blueSoft]

// Badge « Nouveau » : offre publiée il y a moins de 3 jours (évalué à chaque régénération ISR)
function isRecent(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 86_400_000 * 3
}

export default async function LandingPage() {
  const [{ featuredJobs, companies, stats }, launchData] = await Promise.all([
    getCachedLandingData(),
    getCachedLaunchPublicData(),
  ])
  const launchDays = launchDaysLeft(launchData?.endsAt ?? null)

  // Bande stats — vraies données si disponibles, sinon labels clairs
  const STATS_BAND = [
    stats.jobs > 0 ? { v: stats.jobs.toLocaleString('fr-FR'), l: 'Offres actives' } : { v: '24', l: 'Communes couvertes' },
    stats.companies > 0 ? { v: `${stats.companies}`, l: 'Entreprises locales' } : { v: '100 %', l: 'Local 974' },
    stats.users > 0 ? { v: stats.users.toLocaleString('fr-FR'), l: 'Candidats inscrits' } : { v: '3 min', l: 'Pour créer ton profil' },
    { v: '0 €', l: 'Pour les candidats' },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: KZ.cream }}>
      <NavLanding view="candidat" />

      {/* HERO « écran d'accueil » ───────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 pt-14 lg:pt-24 pb-10 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full os-glass text-xs font-medium text-[var(--kz-text)] mb-7 os-pop">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shadow-[0_0_10px_#30D158]" />
            <MapPin size={12} className="text-[var(--kz-mute)]" /> 974 · La Réunion · Nouvelle génération
          </div>
          <h1 className="text-[52px] sm:text-[80px] lg:text-[112px] font-semibold tracking-[-0.06em] leading-[0.9] text-white mb-6 os-pop" style={{ animationDelay: '0.05s' }}>
            Ton kaz. <span className="os-text-aurora">Ton job.</span><br className="hidden sm:block" /> Ton péi.
          </h1>
          <p className="text-[17px] lg:text-[21px] leading-relaxed text-[var(--kz-mute)] max-w-[680px] mx-auto mb-9 os-pop" style={{ animationDelay: '0.1s' }}>
            L&apos;emploi à La Réunion, enfin aussi fluide que ton téléphone.
            Un profil, un match intelligent, une candidature en un geste.
          </p>

          <div className="max-w-[760px] mx-auto text-left os-pop" style={{ animationDelay: '0.15s' }}>
            <SearchBarLanding />
          </div>

          <div className="flex gap-2 flex-wrap items-center justify-center mb-14 os-pop" style={{ animationDelay: '0.2s' }}>
            <span className="text-xs text-[var(--kz-mute)]">Populaire :</span>
            {['Développeur', 'BTP', 'Tourisme', 'Comptable', 'Infirmier'].map((k) => (
              <Link key={k} href={`/candidate/jobs?q=${k}`}>
                <Tag color="cream">{k}</Tag>
              </Link>
            ))}
          </div>

          <HeroWidgets />
        </div>
      </section>

      {/* CHIFFRES — vraies données ──────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-8 lg:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 max-w-[1280px] mx-auto">
          {STATS_BAND.map((s) => (
            <div key={s.l} className="rounded-[24px] os-glass px-5 py-5 lg:px-6 lg:py-6">
              <div className="text-[34px] lg:text-[48px] font-semibold tracking-[-0.05em] leading-none text-white">{s.v}</div>
              <div className="text-[13px] text-[var(--kz-mute)] mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>
      
      {/* LOGOS ENTREPRISES — vraies entreprises ─────────────── */}
      {companies.length > 0 && (
        <section className="px-4 sm:px-8 lg:px-16 py-8 lg:py-10" style={{ background: KZ.cream }}>
          <p className="kz-eyebrow text-[var(--kz-mute)] text-center mb-6">Ils recrutent sur Kazajob</p>
          <div className="flex justify-center items-center gap-10 flex-wrap max-w-[1280px] mx-auto">
            {companies.map((c) => (
              <div key={c.id} className="text-2xl font-extrabold tracking-tight opacity-40 italic text-[var(--kz-ink)]">
                {c.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* OFFRES VEDETTES — vraies offres ───────────────────── */}
      <section className="py-12 lg:py-20 relative overflow-hidden">

        <div className="px-4 sm:px-8 lg:px-16 max-w-[1280px] mx-auto relative z-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-7">
            <div>
              <p className="kz-eyebrow mb-2" style={{ color: KZ.orange }}>Offres du moment</p>
              <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[var(--kz-ink)] max-w-[600px]">Des opportunités fraîches, mises à jour chaque jour.</h2>
            </div>
            <Link href="/candidate/jobs" className="shrink-0">
              <Button kind="outline" iconRight={<ArrowRight size={14} />}>Toutes les offres</Button>
            </Link>
          </div>

          {featuredJobs.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="mx-auto mb-4 text-[var(--kz-mute)]" size={40} />
              <p className="text-lg font-bold text-[var(--kz-ink)] mb-2">Les offres arrivent bientôt</p>
              <p className="text-sm text-[var(--kz-mute)] mb-6">Crée ton profil dès maintenant : tu seras parmi les premiers à être contactés.</p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/register"><Button kind="primary">Créer un compte</Button></Link>
                <Link href="/auth/register?role=recruiter"><Button kind="outline">Publier une offre</Button></Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {featuredJobs.map((job, i) => {
                const color = CARD_COLORS[i % CARD_COLORS.length]
                const isNew = isRecent(job.created_at)
                const jobSkills = job.skills?.map((s) => s.skill?.name).filter(Boolean).slice(0, 3) ?? []

                return (
                  <Link key={job.id} href={`/candidate/jobs/${job.id}`} className="block">
                    <div className="kz-card p-5 flex flex-col gap-3.5 relative bg-[var(--kz-paper)] hover:-translate-y-1 hover:bg-white/[0.07] transition-all duration-300">
                      {isNew && (
                        <div className="absolute -top-3 right-4 rotate-6">
                          <Badge color="orange" size="sm">Nouveau</Badge>
                        </div>
                      )}
                      {job.is_boosted && (
                        <div className="absolute -top-3 left-4 -rotate-6">
                          <Badge color="violet" size="sm">En avant</Badge>
                        </div>
                      )}
                      <div className="flex gap-3 items-start">
                        <div
                          className="w-12 h-12 rounded-lg border border-[var(--kz-edge)] flex items-center justify-center font-bold text-[var(--kz-ink)] shrink-0"
                          style={{ background: color }}
                        >
                          {(job.company?.name ?? 'CO').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[var(--kz-mute)]">{job.company?.name}</div>
                          <div className="text-base font-bold text-[var(--kz-ink)] mt-0.5 truncate">{job.title}</div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <Tag color="cream">{job.job_type}</Tag>
                        {job.remote && <Tag color="green">Remote</Tag>}
                        {jobSkills.map((s) => <Tag key={s}>{s}</Tag>)}
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-[var(--kz-line)]">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-[var(--kz-text)]">
                            <MapPin size={11} />{job.location}
                          </div>
                          <div className="text-xs font-semibold text-[var(--kz-text)] mt-0.5">
                            {formatSalary(job.salary_min, job.salary_max)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTEURS ─────────────────────────────────────────────── */}
      <SectorsSection variant="candidat" />

      {/* COMMENT CA MARCHE ──────────────────────────────────── */}
      <section id="comment" className="px-4 sm:px-8 lg:px-16 py-12 lg:py-20 relative overflow-hidden" style={{ background: KZ.cream }}>
        {/* <SectionDecor src="/assets/img/deco/comment.png" opacity={0.08} position="left center" size="contain" /> */}
        <div className="max-w-[1280px] mx-auto relative z-10">
          <div className="text-center mb-10 lg:mb-14">
            <p className="kz-eyebrow mb-2" style={{ color: KZ.orange }}>Comment ça marche</p>
            <h2 className="text-2xl lg:text-[36px] font-extrabold tracking-tight text-[var(--kz-ink)] max-w-[720px] mx-auto">
              Trois étapes, zéro chichi : crée ton profil, matche, postule en 1 clic.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_STEPS.map((step) => (
              <div key={step.n} className="kz-card p-7 relative pt-10" style={{ background: step.color }}>
                <div
                  className="absolute -top-5 left-6 w-11 h-11 rounded-full flex items-center justify-center text-lg font-extrabold border border-[var(--kz-edge)]"
                  style={{ background: KZ.inverse, color: KZ.onInverse, boxShadow: 'none' }}
                >
                  {step.n}
                </div>
                <div className="w-14 h-14 rounded-xl border border-[var(--kz-edge)] flex items-center justify-center mb-5 text-[var(--kz-ink)]" style={{ background: KZ.paper }}>
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-[var(--kz-ink)] mb-2.5">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--kz-text)]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AVATAR — postuler sans photo ───────────────────────── */}
      <AvatarShowcaseSection />

      {/* POURQUOI KAZAJOB + COMPARATIF ──────────────────────── */}
      <WhySection />

      {/* KAZAIA SPOTLIGHT ───────────────────────────────────── */}
      <KazaIASpotlight />

      {/* BANNIERE RECRUTEURS ────────────────────────────────── */}
      <section className="px-4 sm:px-8 lg:px-16 py-12 lg:py-16 relative overflow-hidden" style={{ background: KZ.inverse }}>
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-center relative z-10">
          <div>
            <Badge color="yellow" size="lg" className="mb-4">Recruteurs</Badge>
            <h2 className="text-3xl lg:text-[44px] font-extrabold tracking-tight leading-tight mb-4" style={{ color: KZ.onInverse }}>
              Trouvez les meilleurs talents de l&apos;île.<br />
              <span style={{ color: KZ.orange }}>Pas de spam. Pas de bruit.</span>
            </h2>
            <p className="text-base leading-relaxed opacity-80 mb-6 max-w-[520px]" style={{ color: KZ.onInverse }}>
              Publiez vos offres, recevez des candidats locaux triés par l&apos;IA et suivez tout votre recrutement au même endroit.{' '}
              {launchDays ? `Offre de lancement : gratuit encore ${launchDays} jours, sans carte bancaire.` : 'Essai gratuit 30 jours.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register?role=recruiter">
                <Button kind="primary" size="lg">Publier une offre — gratuit</Button>
              </Link>
              <Link href="/entreprise">
                <Button kind="outline" size="lg" className="!text-[var(--kz-on-inverse)] !border-white/20 !bg-white/[0.04]">
                  Découvrir Kazajob Entreprises
                </Button>
              </Link>
            </div>
          </div>
          <Link href="/entreprise" aria-label="Découvrir l'espace recruteur" className="block transition-transform duration-500 hover:scale-[1.02]">
            <RecruiterWindow />
          </Link>
        </div>
      </section>

      {/* ROADMAP ─────────────────────────────────────────────── */}
      <RoadmapSection />

      {/* FAQ ─────────────────────────────────────────────────── */}
      <FaqSection />

      {/* CTA FINAL ─────────────────────────────────────────── */}
      <IllustratedCta
        image="/assets/img/scenes/cadre-tropical-2.webp"
        title={<>Alon commencé&nbsp;?</>}
        text="3 minutes pour créer ton profil. 0 € pour postuler. Ton prochain job t'attend quelque part sur l'île."
        actions={
          <>
            <Link href="/auth/register">
              <Button kind="primary" size="lg" className="w-full sm:w-auto">Créer mon profil — gratuit</Button>
            </Link>
            <Link href="/candidate/jobs">
              <Button kind="outline" size="lg" className="w-full sm:w-auto">Parcourir les offres</Button>
            </Link>
          </>
        }
        footnote={launchDays
          ? `Candidats : 100 % gratuit · Recruteurs : publication gratuite encore ${launchDays} jours · Données hébergées en Europe`
          : 'Candidats : 100 % gratuit · Recruteurs : essai 30 jours · Données hébergées en Europe'}
      />

      <Footer />
    </div>
  )
}
