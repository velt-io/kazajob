/**
 * KAZAJOB — Résumé facturation entreprise.
 *
 * `getCompanyBillingSummary` retourne un objet prêt à consommer par les dashboards
 * recruteur et admin, sans redériver la logique dans les composants.
 *
 * Sources utilisées (dans l'ordre de priorité) :
 *   1. Dérogation admin active
 *   2. Abonnement payant actif
 *   3. Campagne de lancement (phase de déploiement)
 *   4. Aucun accès
 */
import { and, count, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { companySubscriptions, jobs, subscriptionPlans } from '@/lib/db/schema'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'
import { getActiveCampaignEnrollment } from '@/lib/queries/launch'

export type BillingSeverity = 'info' | 'warning' | 'danger' | 'success'
export type BillingSource = 'admin_override' | 'subscription' | 'campaign' | 'none'

export interface CompanyBillingSummary {
  source: BillingSource
  // ── Abonnement ──
  subscriptionStatus: string | null   // trial | active | cancelled | expired | null
  planId:    string | null
  planName:  string | null
  trialEndsAt:      string | null
  currentPeriodEnd: string | null
  // ── Dérogation admin ──
  adminOverrideEnabled:  boolean
  overrideMaxActiveJobs: number | null
  overrideUntil:         string | null
  // ── Campagne (phase de déploiement) ──
  campaignName:    string | null
  campaignExpires: string | null      // expiration de l'enrollment individuel
  // ── Usage ──
  activeJobs:  number
  maxJobs:     number    // -1 = illimité
  remaining:   number    // -1 = illimité
  isOverLimit: boolean
  // ── Permissions ──
  canPublishJob:  boolean
  canRenewJob:    boolean
  // ── Message UI ──
  message: {
    title:                string
    description:          string
    severity:             BillingSeverity
    primaryActionLabel?:  string
    primaryActionHref?:   string
    secondaryActionLabel?: string
    secondaryActionHref?:  string
  }
}

export async function getCompanyBillingSummary(companyId: string): Promise<CompanyBillingSummary> {
  // 1. Charger abonnement + plan
  const [subRow] = await db
    .select({
      planId:                companySubscriptions.planId,
      status:                companySubscriptions.status,
      trialEndsAt:           companySubscriptions.trialEndsAt,
      currentPeriodEnd:      companySubscriptions.currentPeriodEnd,
      adminOverrideEnabled:  companySubscriptions.adminOverrideEnabled,
      overrideMaxActiveJobs: companySubscriptions.overrideMaxActiveJobs,
      overrideReason:        companySubscriptions.overrideReason,
      overrideUntil:         companySubscriptions.overrideUntil,
      planName:              subscriptionPlans.name,
    })
    .from(companySubscriptions)
    .leftJoin(subscriptionPlans, eq(companySubscriptions.planId, subscriptionPlans.id))
    .where(eq(companySubscriptions.companyId, companyId))
    .limit(1)

  // 2. Compter les jobs actifs
  const [{ value: activeJobs }] = await db
    .select({ value: count() })
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.isActive, true)))

  // 3. Campagne de lancement
  const enrollment = await getActiveCampaignEnrollment(companyId)

  // ── Déterminer la source et les droits effectifs ──
  const overrideActive = !!(subRow?.adminOverrideEnabled &&
    (!subRow.overrideUntil || subRow.overrideUntil > new Date()))

  let source: BillingSource = 'none'
  let maxJobs = 0
  let canPublishJob = false

  if (overrideActive) {
    source = 'admin_override'
    maxJobs = subRow!.overrideMaxActiveJobs ?? -1
    canPublishJob = maxJobs === -1 || activeJobs < maxJobs
  } else if (subRow && !['expired', 'cancelled'].includes(subRow.status)) {
    source = 'subscription'
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subRow.planId)
    maxJobs = plan?.maxJobs ?? 0
    canPublishJob = maxJobs === -1 || activeJobs < maxJobs
  } else if (enrollment?.effectiveActive && enrollment.freePublishingEnabled) {
    source = 'campaign'
    maxJobs = enrollment.maxActiveJobsPerCompany
    canPublishJob = maxJobs === -1 || activeJobs < maxJobs
  }

  const isOverLimit = maxJobs !== -1 && activeJobs > maxJobs
  // Renouvellement d'annonce expirée = même règle que publication
  const canRenewJob = canPublishJob

  const remaining = maxJobs === -1 ? -1 : Math.max(0, maxJobs - activeJobs)

  // ── Construire le message selon le cas ──
  const message = buildMessage({ source, subRow, enrollment, canPublishJob, activeJobs, maxJobs, isOverLimit })

  return {
    source,
    subscriptionStatus: subRow?.status ?? null,
    planId:    subRow?.planId ?? null,
    planName:  subRow?.planName ?? null,
    trialEndsAt:      subRow?.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: subRow?.currentPeriodEnd?.toISOString() ?? null,
    adminOverrideEnabled:  subRow?.adminOverrideEnabled ?? false,
    overrideMaxActiveJobs: subRow?.overrideMaxActiveJobs ?? null,
    overrideUntil:         subRow?.overrideUntil?.toISOString() ?? null,
    campaignName:    enrollment?.campaignName ?? null,
    campaignExpires: enrollment?.expiresAt.toISOString() ?? null,
    activeJobs,
    maxJobs,
    remaining,
    isOverLimit,
    canPublishJob,
    canRenewJob,
    message,
  }
}

// ── Helpers de message ────────────────────────────────────────────

interface MessageContext {
  source: BillingSource
  subRow: { status: string; planName: string | null; trialEndsAt: Date | null; overrideUntil: Date | null; overrideMaxActiveJobs: number | null } | undefined
  enrollment: { campaignName: string; expiresAt: Date } | null
  canPublishJob: boolean
  activeJobs: number
  maxJobs: number
  isOverLimit: boolean
}

function buildMessage(ctx: MessageContext): CompanyBillingSummary['message'] {
  const { source, subRow, enrollment, canPublishJob, activeJobs, maxJobs, isOverLimit } = ctx
  const limitLabel = maxJobs === -1 ? 'illimité' : String(maxJobs)

  // Cas F : dérogation admin
  if (source === 'admin_override') {
    const until = subRow?.overrideUntil
      ? `jusqu'au ${new Date(subRow.overrideUntil).toLocaleDateString('fr-FR')}`
      : '(sans date de fin)'
    return {
      title: 'Dérogation admin active',
      description: `Une dérogation spéciale est active sur votre compte. Vous pouvez publier jusqu'à ${limitLabel} annonces actives ${until}.`,
      severity: 'info',
      primaryActionLabel: 'Publier une annonce',
      primaryActionHref:  '/recruiter/jobs/new',
    }
  }

  // Cas A : phase de déploiement (campagne active)
  if (source === 'campaign') {
    if (!canPublishJob) {
      return {
        title: 'Limite atteinte',
        description: `Vous utilisez ${activeJobs}/${limitLabel} annonces actives pendant la phase de déploiement. Attendez l'expiration d'une annonce pour en publier une nouvelle.`,
        severity: 'warning',
        primaryActionLabel: 'Voir mes annonces',
        primaryActionHref:  '/recruiter/jobs',
        secondaryActionLabel: 'Contacter Kazajob',
        secondaryActionHref:  '/contact',
      }
    }
    return {
      title: 'Phase de déploiement active',
      description: `Kazajob est en phase de déploiement. Vous pouvez publier vos annonces (${maxJobs === -1 ? '∞' : `${activeJobs}/${limitLabel}`}). Les offres d'abonnement seront disponibles prochainement.`,
      severity: 'success',
      primaryActionLabel: 'Publier une annonce',
      primaryActionHref:  '/recruiter/jobs/new',
    }
  }

  // Cas B : abonnements actifs, aucun plan
  if (source === 'none') {
    return {
      title: 'Aucun abonnement actif',
      description: 'Vos annonces actuelles restent visibles jusqu\'à leur expiration. Pour publier de nouvelles annonces, choisissez une offre adaptée.',
      severity: 'warning',
      primaryActionLabel: 'Voir les offres',
      primaryActionHref:  '/pricing',
      secondaryActionLabel: 'Contacter Kazajob',
      secondaryActionHref:  '/contact',
    }
  }

  // Abonnement présent — vérifier statuts spéciaux
  const status = subRow?.status
  if (status === 'trial') {
    const daysLeft = subRow?.trialEndsAt
      ? Math.max(0, Math.ceil((subRow.trialEndsAt.getTime() - Date.now()) / 86_400_000))
      : 0
    return {
      title: `Période d'essai — ${daysLeft} jour(s) restant(s)`,
      description: `Vous bénéficiez des fonctionnalités ${subRow?.planName ?? ''} pendant votre essai (${activeJobs}/${limitLabel === '-1' ? '∞' : limitLabel} annonces actives).`,
      severity: daysLeft <= 7 ? 'warning' : 'info',
      primaryActionLabel: 'Activer mon abonnement',
      primaryActionHref:  '/recruiter/company',
    }
  }
  if (status === 'expired' || status === 'cancelled') {
    return {
      title: 'Abonnement inactif',
      description: 'Votre abonnement est expiré ou résilié. Vos annonces existantes restent visibles. Choisissez une offre pour reprendre la publication.',
      severity: 'danger',
      primaryActionLabel: 'Voir les offres',
      primaryActionHref:  '/pricing',
    }
  }

  // Cas E : au-dessus de la limite
  if (isOverLimit) {
    return {
      title: 'Vos annonces actuelles restent visibles',
      description: `Votre offre permet ${limitLabel} annonces actives. Vous en avez ${activeJobs}. Vous ne pouvez pas publier de nouvelle annonce pour le moment.`,
      severity: 'warning',
      primaryActionLabel: 'Passer à une offre supérieure',
      primaryActionHref:  '/pricing',
      secondaryActionLabel: 'Contacter Kazajob',
      secondaryActionHref:  '/contact',
    }
  }

  // Cas C/D : abonnement actif dans les limites
  return {
    title: 'Votre offre est active',
    description: maxJobs === -1
      ? `Vous pouvez publier un nombre illimité d'annonces actives (forfait ${subRow?.planName ?? ''}).`
      : `Vous utilisez ${activeJobs}/${maxJobs} annonces actives (forfait ${subRow?.planName ?? ''}).`,
    severity: 'success',
    primaryActionLabel: 'Publier une annonce',
    primaryActionHref:  '/recruiter/jobs/new',
  }
}
