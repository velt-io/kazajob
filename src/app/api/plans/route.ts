import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptionPlans } from '@/lib/db/schema'
import { serialize } from '@/lib/queries/_serialize'

/**
 * GET /api/plans — Forfaits publics (is_active=true, is_public=true).
 * Utilisé par la page pricing publique. Ne renvoie jamais de données sensibles (Stripe IDs masqués).
 */
export async function GET() {
  const rows = await db
    .select({
      id:          subscriptionPlans.id,
      name:        subscriptionPlans.name,
      priceCts:    subscriptionPlans.priceCts,
      maxJobs:     subscriptionPlans.maxJobs,
      maxMembers:  subscriptionPlans.maxMembers,
      isSelectable: subscriptionPlans.isSelectable,
      isFeatured:  subscriptionPlans.isFeatured,
      sortOrder:   subscriptionPlans.sortOrder,
      // Stripe disponible = Product ET Price configurés
      stripeReady: subscriptionPlans.stripeProductId,
    })
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.isActive, true), eq(subscriptionPlans.isPublic, true)))
    .orderBy(asc(subscriptionPlans.sortOrder))

  return NextResponse.json({ plans: serialize(rows) })
}
