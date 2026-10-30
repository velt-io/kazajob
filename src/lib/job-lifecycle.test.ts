/**
 * Tests du cycle de vie des offres.
 * Lancement : npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  nextJobStatus, recruiterActions, jobStatusPatch, daysUntilExpiry, resolveJobStatus,
  JOB_DURATION_DAYS,
} from './job-lifecycle'

test('brouillon → publiée, publiée → en pause → publiée', () => {
  assert.equal(nextJobStatus('draft', 'publish', 'recruiter'), 'published')
  assert.equal(nextJobStatus('published', 'pause', 'recruiter'), 'paused')
  assert.equal(nextJobStatus('paused', 'publish', 'recruiter'), 'published')
})

test('une offre expirée ou archivée peut être republiée', () => {
  assert.equal(nextJobStatus('expired', 'publish', 'recruiter'), 'published')
  assert.equal(nextJobStatus('archived', 'publish', 'recruiter'), 'published')
})

test('transitions impossibles refusées', () => {
  assert.equal(nextJobStatus('draft', 'pause', 'recruiter'), null)
  assert.equal(nextJobStatus('published', 'publish', 'recruiter'), null)
  assert.equal(nextJobStatus('archived', 'archive', 'recruiter'), null)
})

test('suspension : réservée à l’admin, et seul l’admin rétablit', () => {
  assert.equal(nextJobStatus('published', 'suspend', 'recruiter'), null)
  assert.equal(nextJobStatus('published', 'suspend', 'admin'), 'suspended')
  assert.equal(nextJobStatus('suspended', 'publish', 'recruiter'), null)
  assert.equal(nextJobStatus('suspended', 'archive', 'recruiter'), null)
  assert.equal(nextJobStatus('suspended', 'publish', 'admin'), 'published')
})

test('actions proposées au recruteur', () => {
  assert.deepEqual(recruiterActions('draft'), ['publish', 'archive'])
  assert.deepEqual(recruiterActions('published'), ['pause', 'archive'])
  assert.deepEqual(recruiterActions('expired'), ['publish', 'archive'])
  assert.deepEqual(recruiterActions('suspended'), [])
})

test('publier active l’offre pour 60 jours ; tout autre statut la masque', () => {
  const now = new Date('2026-10-30T08:00:00Z')
  const p = jobStatusPatch('published', now)
  assert.equal(p.isActive, true)
  assert.equal(p.publishedAt?.toISOString(), now.toISOString())
  assert.equal(daysUntilExpiry(p.expiresAt, now.getTime()), JOB_DURATION_DAYS)
  for (const s of ['draft', 'paused', 'expired', 'archived', 'suspended'] as const) {
    assert.deepEqual(jobStatusPatch(s, now), { status: s, isActive: false })
  }
})

test('jours restants avant expiration', () => {
  const now = Date.parse('2026-10-30T00:00:00Z')
  assert.equal(daysUntilExpiry('2026-11-02T00:00:00Z', now), 3)
  assert.equal(daysUntilExpiry('2026-10-30T01:00:00Z', now), 1)
  assert.equal(daysUntilExpiry('2026-10-01T00:00:00Z', now), 0)
  assert.equal(daysUntilExpiry(null, now), null)
})

test('statut déduit pour une offre sans colonne status', () => {
  assert.equal(resolveJobStatus({ is_active: true }), 'published')
  assert.equal(resolveJobStatus({ is_active: false }), 'paused')
  assert.equal(resolveJobStatus({ status: 'draft', is_active: false }), 'draft')
  assert.equal(resolveJobStatus({ status: 'bidon', is_active: true }), 'published')
})
