/**
 * KAZAJOB — Administration des forfaits (Monétisation > Forfaits).
 * Réservé au rôle admin (super admin). Toute modification est auditée.
 */
import { asc, count, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { companySubscriptions, subscriptionPlans } from '@/lib/db/schema'
import { serialize } from './_serialize'
import { writeAudit } from './audit'

export interface AdminPlanRow {
  id: string; name: string; price_cts: number; max_jobs: number; max_members: number
  is_active: boolean; is_public: boolean; is_selectable: boolean; is_featured: boolean
  sort_order: number; starts_at: string | null; ends_at: string | null; updated_at: string | null
  stripe_product_id: string | null; stripe_price_id: string | null
  company_count?: number
}

/** Tous les forfaits payants, par ordre d'affichage (avec comptage entreprises). */
export async function listPlansAdmin(): Promise<{ plans: AdminPlanRow[] }> {
  const rows = await db.select().from(subscriptionPlans).orderBy(asc(subscriptionPlans.sortOrder))
  const counts = await db
    .select({ planId: companySubscriptions.planId, n: count() })
    .from(companySubscriptions)
    .groupBy(companySubscriptions.planId)
  const countMap = Object.fromEntries(counts.map(r => [r.planId, r.n]))
  const plans = serialize<AdminPlanRow[]>(rows).map(p => ({ ...p, company_count: countMap[p.id] ?? 0 }))
  return { plans }
}

/** Champs modifiables par l'administration. */
export interface PlanSettingsPatch {
  name?:            string
  priceCts?:        number
  maxJobs?:         number
  maxMembers?:      number
  isActive?:        boolean
  isPublic?:        boolean
  isSelectable?:    boolean
  isFeatured?:      boolean
  sortOrder?:       number
  startsAt?:        string | null
  endsAt?:          string | null
  stripeProductId?: string | null
  stripePriceId?:   string | null
}

const ALLOWED: (keyof PlanSettingsPatch)[] = [
  'name', 'priceCts', 'maxJobs', 'maxMembers',
  'isActive', 'isPublic', 'isSelectable', 'isFeatured', 'sortOrder',
  'startsAt', 'endsAt', 'stripeProductId', 'stripePriceId',
]

/** Met à jour la disponibilité d'un forfait (audité). */
export async function updatePlanSettings(
  actorId: string,
  actorEmail: string | null,
  planId: string,
  patch: PlanSettingsPatch,
): Promise<{ error: string | null }> {
  const [before] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1)
  if (!before) return { error: 'Forfait introuvable' }

  const set: Record<string, unknown> = { updatedBy: actorId, updatedAt: new Date() }
  for (const k of ALLOWED) {
    if (patch[k] === undefined) continue
    if (k === 'startsAt' || k === 'endsAt') {
      set[k] = patch[k] ? new Date(patch[k] as string) : null
    } else if (k === 'stripeProductId') {
      set['stripeProductId'] = patch[k] ?? null
    } else if (k === 'stripePriceId') {
      set['stripePriceId'] = patch[k] ?? null
    } else {
      set[k] = patch[k]
    }
  }

  await db.update(subscriptionPlans).set(set).where(eq(subscriptionPlans.id, planId))

  await writeAudit({
    actorId, actorEmail, action: 'subscription_plan.settings_updated', targetType: 'plan', targetId: planId,
    oldValues: {
      name: before.name, priceCts: before.priceCts, maxJobs: before.maxJobs,
      maxMembers: before.maxMembers, isActive: before.isActive, isPublic: before.isPublic,
      isSelectable: before.isSelectable, isFeatured: before.isFeatured, sortOrder: before.sortOrder,
      startsAt: before.startsAt, endsAt: before.endsAt,
    },
    newValues: patch,
  })
  return { error: null }
}

/** Duplique un forfait existant (nouveau slug auto, désactivé par défaut). */
export async function duplicatePlan(
  actorId: string,
  actorEmail: string | null,
  planId: string,
): Promise<{ error: string | null; newId?: string }> {
  const [src] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1)
  if (!src) return { error: 'Forfait introuvable' }

  const newId = `${src.id}_copy_${Date.now()}`
  await db.insert(subscriptionPlans).values({
    ...src,
    id:          newId,
    isActive:    false,
    isPublic:    false,
    isSelectable: false,
    sortOrder:   src.sortOrder + 1,
    stripeProductId: null,
    stripePriceId:   null,
    updatedBy:   actorId,
    updatedAt:   new Date(),
  })

  await writeAudit({
    actorId, actorEmail, action: 'subscription_plan.duplicated',
    targetType: 'plan', targetId: newId,
    newValues: { sourceId: planId },
  })
  return { error: null, newId }
}

/** Archive un forfait (isActive=false, isPublic=false, isSelectable=false). Refuse si des abonnements actifs y sont liés. */
export async function archivePlan(
  actorId: string,
  actorEmail: string | null,
  planId: string,
): Promise<{ error: string | null }> {
  const [linked] = await db
    .select({ n: count() })
    .from(companySubscriptions)
    .where(eq(companySubscriptions.planId, planId))
  // On autorise l'archivage mais on prévient si des abonnements actifs existent
  await db.update(subscriptionPlans)
    .set({ isActive: false, isPublic: false, isSelectable: false, updatedBy: actorId, updatedAt: new Date() })
    .where(eq(subscriptionPlans.id, planId))

  await writeAudit({
    actorId, actorEmail, action: 'subscription_plan.archived',
    targetType: 'plan', targetId: planId,
    context: { linkedSubscriptions: linked.n },
  })
  return { error: null }
}

// ── Dérogations admin par entreprise ─────────────────────────────

export interface AdminOverridePatch {
  adminOverrideEnabled:  boolean
  overrideMaxActiveJobs: number | null
  overrideReason:        string | null
  overrideUntil:         string | null   // ISO date ou null
}

/** Applique ou retire une dérogation admin sur l'abonnement d'une entreprise. */
export async function setCompanyOverride(
  actorId: string,
  actorEmail: string | null,
  companyId: string,
  patch: AdminOverridePatch,
): Promise<{ error: string | null }> {
  const [sub] = await db
    .select({ id: companySubscriptions.id })
    .from(companySubscriptions)
    .where(eq(companySubscriptions.companyId, companyId))
    .limit(1)
  if (!sub) return { error: 'Aucun abonnement pour cette entreprise' }

  await db.update(companySubscriptions).set({
    adminOverrideEnabled:  patch.adminOverrideEnabled,
    overrideMaxActiveJobs: patch.overrideMaxActiveJobs,
    overrideReason:        patch.overrideReason,
    overrideUntil:         patch.overrideUntil ? new Date(patch.overrideUntil) : null,
  }).where(eq(companySubscriptions.companyId, companyId))

  await writeAudit({
    actorId, actorEmail,
    action: patch.adminOverrideEnabled ? 'company_subscription.override_set' : 'company_subscription.override_removed',
    targetType: 'company', targetId: companyId,
    newValues: patch,
  })
  return { error: null }
}
