/**
 * Tests des jetons de réinitialisation de mot de passe.
 * Lancement : npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createResetToken, verifyResetToken, readResetToken, RESET_TTL_MS } from './password-reset'

// Le secret est lu à l'appel, pas à l'import.
process.env.AUTH_SECRET ??= 'test-secret'

const USER = '3f1c2a9e-0000-4000-8000-000000000001'

test('un jeton valide est accepté', () => {
  const token = createResetToken(USER, 'hash-1')
  assert.equal(readResetToken(token)?.userId, USER)
  assert.equal(verifyResetToken(token, 'hash-1'), true)
})

test('le jeton expire après 1 h', () => {
  const t0 = Date.now()
  const token = createResetToken(USER, 'hash-1', t0)
  assert.equal(verifyResetToken(token, 'hash-1', t0 + RESET_TTL_MS - 1), true)
  assert.equal(verifyResetToken(token, 'hash-1', t0 + RESET_TTL_MS + 1), false)
})

test('changer le mot de passe invalide le jeton', () => {
  const token = createResetToken(USER, 'hash-1')
  assert.equal(verifyResetToken(token, 'hash-2'), false)
})

test('un jeton modifié ou malformé est refusé', () => {
  const token = createResetToken(USER, 'hash-1')
  const other = createResetToken('3f1c2a9e-0000-4000-8000-000000000002', 'hash-1')
  assert.equal(verifyResetToken(`${other.split('.')[0]}.${token.split('.')[1]}`, 'hash-1'), false)
  assert.equal(verifyResetToken('nimporte-quoi', 'hash-1'), false)
  assert.equal(verifyResetToken('', null), false)
})

test('compte sans mot de passe (Google/LinkedIn) : jeton utilisable une fois', () => {
  const token = createResetToken(USER, null)
  assert.equal(verifyResetToken(token, null), true)
  assert.equal(verifyResetToken(token, 'nouveau-hash'), false)
})
