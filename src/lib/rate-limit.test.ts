/**
 * Tests des utilitaires anti-abus (clés, IP, messages, fail-open).
 * Lancement : npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { rateLimitKey, clientIp, retryMessage, hitRateLimit, AUTH_LIMITS } from './rate-limit'

test('clé hachée, stable, insensible à la casse et aux espaces', () => {
  const k = rateLimitKey('login', 'Marie@Email.re ')
  assert.equal(k, rateLimitKey('login', 'marie@email.re'))
  assert.match(k, /^login:[0-9a-f]{32}$/)
  assert.ok(!k.includes('marie'))
  assert.notEqual(k, rateLimitKey('forgot', 'marie@email.re'))
})

test('IP du client : première adresse de x-forwarded-for', () => {
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7')
  assert.equal(clientIp(new Headers({ 'x-real-ip': '198.51.100.2' })), '198.51.100.2')
  assert.equal(clientIp(new Headers()), 'unknown')
})

test('message de nouvel essai en minutes', () => {
  assert.equal(retryMessage(30), 'Trop de tentatives. Réessaie dans 1 minute.')
  assert.equal(retryMessage(600), 'Trop de tentatives. Réessaie dans 10 minutes.')
})

test('première tentative toujours autorisée, y compris base indisponible (fail-open)', async () => {
  // Hôte invalide → la requête échoue et la tentative passe ; base réelle → 1 ≤ limite.
  const r = await hitRateLimit(rateLimitKey('test', 'premiere-tentative'), AUTH_LIMITS.loginEmail)
  assert.equal(r.allowed, true)
})
