import { NextResponse } from 'next/server'
import { checkNewSubscriptionsAllowed } from '@/lib/queries/launch'
import { db } from '@/lib/db'
import { and, eq } from 'drizzle-orm'
import { subscriptionPlans } from '@/lib/db/schema'

/**
 * GET /api/monetization-status — état global de la monétisation.
 * Utilisé par la page pricing pour décider quoi afficher.
 */
export async function GET() {
  const [{ allowed: subscriptionsAllowed, campaignName }, publicPlansCount] = await Promise.all([
    checkNewSubscriptionsAllowed(),
    db.select({ id: subscriptionPlans.id })
      .from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.isActive, true), eq(subscriptionPlans.isPublic, true)))
      .then(rows => rows.length),
  ])

  return NextResponse.json({
    // Les abonnements payants sont disponibles si : souscriptions autorisées ET au moins 1 plan public
    billingEnabled:     subscriptionsAllowed && publicPlansCount > 0,
    pricingPageVisible: publicPlansCount > 0,
    campaignName,        // non-null = phase de déploiement active (campagne ouverte)
    subscriptionsAllowed,
  })
}
