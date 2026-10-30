'use client'

/**
 * Page pricing publique.
 * Affiche les forfaits actifs et publics, ou un message "phase de déploiement"
 * si aucun forfait n'est visible. Pilotée par les flags admin (is_active, is_public).
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Rocket, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { KZ, SUBSCRIPTION_PLANS, planFeatures } from '@/lib/constants'

interface PublicPlanRow {
  id: string; name: string; price_cts: number; max_jobs: number; max_members: number
  is_selectable: boolean; is_featured: boolean; sort_order: number; stripe_ready: string | null
}

interface MonetizationStatus {
  billingEnabled: boolean
  pricingPageVisible: boolean
  campaignName: string | null
  subscriptionsAllowed: boolean
  campaignEndsAt: string | null
}

export default function PricingPage() {
  const [plans, setPlans] = useState<PublicPlanRow[]>([])
  const [status, setStatus] = useState<MonetizationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/plans').then(r => r.ok ? r.json() : { plans: [] }),
      fetch('/api/monetization-status').then(r => r.ok ? r.json() : null),
    ]).then(([plansData, statusData]) => {
      setPlans(plansData.plans ?? [])
      setStatus(statusData)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-20 text-center">
        <div className="h-8 w-48 mx-auto rounded-xl bg-[var(--kz-cream2)] animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl bg-[var(--kz-cream2)] animate-pulse" />)}
        </div>
      </div>
    )
  }

  // Phase de déploiement : pas de plans publics
  if (!status?.pricingPageVisible || plans.length === 0) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: KZ.orangeSoft }}>
          <Rocket size={28} color={KZ.orange} />
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--kz-ink)] mb-4">
          Kazajob est en phase de déploiement
        </h1>
        <p className="text-[var(--kz-mute)] leading-relaxed mb-8">
          Les offres d'abonnement seront disponibles prochainement.
          {status?.campaignName && (
            <><br /><span className="font-medium text-[var(--kz-ink)]">
              Vous bénéficiez actuellement de l'accès "{status.campaignName}".
            </span></>
          )}
          <br /><br />
          Pour devenir entreprise partenaire du lancement, contactez l'équipe Kazajob.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact">
            <Button kind="primary" size="lg" icon={<Mail size={16} />}>Contacter Kazajob</Button>
          </Link>
          <Link href="/recruiter/jobs/new">
            <Button kind="outline" size="lg">Publier une annonce</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Tarifs</p>
        <h1 className="text-3xl font-extrabold text-[var(--kz-ink)] mb-3">
          Choisissez votre offre
        </h1>
        <p className="text-[var(--kz-mute)] max-w-md mx-auto">
          Publiez vos offres d'emploi et trouvez les meilleurs talents de La Réunion.
          {!status?.subscriptionsAllowed && (
            <span className="block mt-2 text-sm font-medium" style={{ color: KZ.violet }}>
              Les nouvelles souscriptions ouvrent bientôt.
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => {
          // Récupère les features depuis les constantes (source de vérité côté affichage)
          const staticPlan = SUBSCRIPTION_PLANS.find(p => p.id === plan.id)
          const features = staticPlan ? planFeatures(staticPlan) : []
          const stripeOk = !!plan.stripe_ready
          const canSubscribe = plan.is_selectable && status?.subscriptionsAllowed && stripeOk

          return (
            <div key={plan.id} className="kz-card p-6 bg-[var(--kz-paper)] flex flex-col relative"
              style={{ borderColor: plan.is_featured ? KZ.violet : undefined,
                       borderWidth: plan.is_featured ? 2 : undefined }}>
              {plan.is_featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge color="violet" size="sm">Recommandé</Badge>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-xl font-extrabold text-[var(--kz-ink)] mb-1">{plan.name}</h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[var(--kz-ink)]">
                    {Math.round(plan.price_cts / 100)}€
                  </span>
                  <span className="text-sm text-[var(--kz-mute)]">/mois HT</span>
                </div>
                <p className="text-xs text-[var(--kz-mute)] mt-1">
                  {plan.max_jobs === -1 ? 'Offres illimitées' : `${plan.max_jobs} offres actives`}
                  {' · '}
                  {plan.max_members === -1 ? 'Recruteurs illimités' : `${plan.max_members} recruteur(s)`}
                </p>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--kz-text)]">
                    <Check size={14} className="mt-0.5 shrink-0" color={KZ.green} />
                    {f}
                  </li>
                ))}
              </ul>

              {canSubscribe ? (
                <Link href={`/recruiter/company?plan=${plan.id}`}>
                  <Button kind={plan.is_featured ? 'primary' : 'outline'} size="md" className="w-full">
                    Choisir {plan.name}
                  </Button>
                </Link>
              ) : (
                <Link href="/contact">
                  <Button kind="soft" size="md" className="w-full">
                    {stripeOk ? 'Contacter Kazajob' : 'Offre bientôt disponible'}
                  </Button>
                </Link>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-10 text-center text-sm text-[var(--kz-mute)]">
        {status?.campaignEndsAt
          ? (() => {
              const days = Math.ceil((new Date(status.campaignEndsAt).getTime() - Date.now()) / 86_400_000)
              return days > 0
                ? `Phase de lancement — accès gratuit encore ${days} jours · sans carte bancaire.`
                : "Toutes les offres incluent un essai de 30 jours sans engagement."
            })()
          : "Toutes les offres incluent un essai de 30 jours sans engagement."
        }{' '}
        <Link href="/contact" className="text-[var(--kz-violet)] hover:underline">Une question ? Contactez-nous.</Link>
      </div>
    </div>
  )
}
