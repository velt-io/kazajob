import { and, desc, eq, or, isNull, lte, gte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { trackingIntegrations, trackingIntegrationVersions } from '@/lib/db/schema'
import type { TrackingIntegration, TrackingIntegrationVersion } from '@/lib/types'
import { writeAudit } from './audit'
import { serialize } from './_serialize'

export async function listIntegrations(): Promise<TrackingIntegration[]> {
  const rows = await db.select().from(trackingIntegrations).orderBy(desc(trackingIntegrations.createdAt))
  return serialize<TrackingIntegration[]>(rows)
}

// Intégrations actives, filtrées env/dates côté serveur. Le ciblage de route et le
// consentement sont appliqués côté client (TrackingScripts) car ils dépendent du pathname
// courant et du choix de l'utilisateur, non disponibles de façon fiable côté serveur ici.
export async function getActiveIntegrations(environment: 'production' | 'staging'): Promise<TrackingIntegration[]> {
  const now = new Date()
  const rows = await db.select().from(trackingIntegrations).where(
    and(
      eq(trackingIntegrations.isActive, true),
      or(eq(trackingIntegrations.environment, environment), eq(trackingIntegrations.environment, 'all')),
      or(isNull(trackingIntegrations.startsAt), lte(trackingIntegrations.startsAt, now)),
      or(isNull(trackingIntegrations.endsAt), gte(trackingIntegrations.endsAt, now)),
    ),
  )
  return serialize<TrackingIntegration[]>(rows)
}

async function snapshotVersion(integrationId: string, actorId: string): Promise<void> {
  const [current] = await db.select().from(trackingIntegrations).where(eq(trackingIntegrations.id, integrationId))
  if (!current) return
  const [{ value: lastVersion }] = await db
    .select({ value: trackingIntegrationVersions.version })
    .from(trackingIntegrationVersions)
    .where(eq(trackingIntegrationVersions.integrationId, integrationId))
    .orderBy(desc(trackingIntegrationVersions.version))
    .limit(1)
    .then((r) => (r.length ? r : [{ value: 0 }]))

  await db.insert(trackingIntegrationVersions).values({
    integrationId, version: lastVersion + 1, snapshot: current as unknown as object, createdById: actorId,
  })
}

export interface IntegrationInput {
  name: string
  description?: string | null
  provider: string
  identifier?: string | null
  customCode?: string | null
  placement: string
  environment: string
  consentCategory: string
  routeScope?: object | null
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
}

export async function createIntegration(input: IntegrationInput, actorId: string): Promise<TrackingIntegration> {
  const [row] = await db.insert(trackingIntegrations).values({
    name: input.name,
    description: input.description ?? null,
    provider: input.provider,
    identifier: input.identifier ?? null,
    customCode: input.customCode ?? null,
    placement: input.placement,
    environment: input.environment,
    consentCategory: input.consentCategory,
    routeScope: (input.routeScope ?? null) as object | null,
    isActive: input.isActive ?? false,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    createdById: actorId,
    updatedById: actorId,
  }).returning()

  await snapshotVersion(row.id, actorId)
  await writeAudit({ actorId, action: 'tracking.create', targetType: 'tracking_integration', targetId: row.id, newValues: input })
  return serialize<TrackingIntegration>(row)
}

export async function updateIntegration(id: string, input: Partial<IntegrationInput>, actorId: string): Promise<void> {
  await snapshotVersion(id, actorId)

  const set: Record<string, unknown> = { updatedById: actorId, updatedAt: new Date() }
  if (input.name !== undefined) set.name = input.name
  if (input.description !== undefined) set.description = input.description
  if (input.provider !== undefined) set.provider = input.provider
  if (input.identifier !== undefined) set.identifier = input.identifier
  if (input.customCode !== undefined) set.customCode = input.customCode
  if (input.placement !== undefined) set.placement = input.placement
  if (input.environment !== undefined) set.environment = input.environment
  if (input.consentCategory !== undefined) set.consentCategory = input.consentCategory
  if (input.routeScope !== undefined) set.routeScope = input.routeScope
  if (input.isActive !== undefined) set.isActive = input.isActive
  if (input.startsAt !== undefined) set.startsAt = input.startsAt ? new Date(input.startsAt) : null
  if (input.endsAt !== undefined) set.endsAt = input.endsAt ? new Date(input.endsAt) : null

  await db.update(trackingIntegrations).set(set).where(eq(trackingIntegrations.id, id))
  await writeAudit({ actorId, action: 'tracking.update', targetType: 'tracking_integration', targetId: id, newValues: input })
}

export async function toggleIntegrationActive(id: string, isActive: boolean, actorId: string): Promise<void> {
  await db.update(trackingIntegrations).set({ isActive, updatedById: actorId, updatedAt: new Date() }).where(eq(trackingIntegrations.id, id))
  await writeAudit({ actorId, action: isActive ? 'tracking.activate' : 'tracking.deactivate', targetType: 'tracking_integration', targetId: id })
}

export async function deleteIntegration(id: string, actorId: string): Promise<void> {
  await writeAudit({ actorId, action: 'tracking.delete', targetType: 'tracking_integration', targetId: id })
  await db.delete(trackingIntegrations).where(eq(trackingIntegrations.id, id))
}

export async function listVersions(integrationId: string): Promise<TrackingIntegrationVersion[]> {
  const rows = await db
    .select()
    .from(trackingIntegrationVersions)
    .where(eq(trackingIntegrationVersions.integrationId, integrationId))
    .orderBy(desc(trackingIntegrationVersions.version))
  return serialize<TrackingIntegrationVersion[]>(rows)
}

export async function rollbackToVersion(integrationId: string, versionId: string, actorId: string): Promise<{ error: string | null }> {
  const [version] = await db.select().from(trackingIntegrationVersions).where(eq(trackingIntegrationVersions.id, versionId))
  if (!version || version.integrationId !== integrationId) return { error: 'Version introuvable' }

  await snapshotVersion(integrationId, actorId)

  const snap = version.snapshot as Record<string, unknown>
  const set: Partial<typeof trackingIntegrations.$inferInsert> = {
    name: snap.name as string, description: snap.description as string | null,
    provider: snap.provider as string, identifier: snap.identifier as string | null,
    customCode: snap.customCode as string | null, placement: snap.placement as string,
    environment: snap.environment as string, consentCategory: snap.consentCategory as string,
    routeScope: snap.routeScope as object | null, isActive: snap.isActive as boolean,
    startsAt: snap.startsAt ? new Date(snap.startsAt as string) : null,
    endsAt: snap.endsAt ? new Date(snap.endsAt as string) : null,
    updatedById: actorId, updatedAt: new Date(),
  }
  await db.update(trackingIntegrations).set(set).where(eq(trackingIntegrations.id, integrationId))

  await writeAudit({ actorId, action: 'tracking.rollback', targetType: 'tracking_integration', targetId: integrationId, newValues: { toVersion: version.version } })
  return { error: null }
}
