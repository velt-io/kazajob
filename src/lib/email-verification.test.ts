/**
 * Tests de la vérification d'email (jetons, séparation des usages, fail-open).
 * Lancement : npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createVerifyToken, verifyVerifyToken, readVerifyToken, isEmailVerified, VERIFY_TTL_MS } from './email-verification'
import { createResetToken, verifyResetToken } from './password-reset'

// Le secret est lu à l'appel, pas à l'import.
process.env.AUTH_SECRET ??= 'test-secret'

const USER = '3f1c2a9e-0000-4000-8000-000000000001'

test('lien de confirmation valide pour son adresse, insensible à la casse', () => {
  const token = createVerifyToken(USER, 'Marie@Email.re')
  assert.equal(readVerifyToken(token)?.userId, USER)
  assert.equal(verifyVerifyToken(token, 'marie@email.re'), true)
})

test('lien invalide si l’adresse du compte a changé', () => {
  const token = createVerifyToken(USER, 'marie@email.re')
  assert.equal(verifyVerifyToken(token, 'autre@email.re'), false)
})

test('lien valable 7 jours', () => {
  const t0 = Date.now()
  const token = createVerifyToken(USER, 'marie@email.re', t0)
  assert.equal(verifyVerifyToken(token, 'marie@email.re', t0 + VERIFY_TTL_MS - 1), true)
  assert.equal(verifyVerifyToken(token, 'marie@email.re', t0 + VERIFY_TTL_MS + 1), false)
})

test('un lien de réinitialisation ne confirme pas un email (et inversement)', () => {
  const reset = createResetToken(USER, 'marie@email.re')
  assert.equal(verifyVerifyToken(reset, 'marie@email.re'), false)
  const verify = createVerifyToken(USER, 'marie@email.re')
  assert.equal(verifyResetToken(verify, 'marie@email.re'), false)
})

test('base ou table indisponible : compte considéré vérifié (fail-open)', async () => {
  if (!process.env.DATABASE_URL?.includes('.invalid')) return // ne pas interroger une vraie base
  assert.equal(await isEmailVerified(USER), true)
})
