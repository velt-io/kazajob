import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeCvCompletion } from './cv'

test('computeCvCompletion : profil vide', () => {
  assert.equal(computeCvCompletion({}), 0)
})

test('computeCvCompletion : profil de base complet, pas de CV', () => {
  const score = computeCvCompletion({
    full_name: 'Test', avatar_url: 'x', location: 'Saint-Denis', phone: '0600000000',
  })
  assert.equal(score, 40) // 4 champs de base sur 10 critères
})

test('computeCvCompletion : profil + CV entièrement rempli', () => {
  const score = computeCvCompletion({
    full_name: 'Test', avatar_url: 'x', location: 'Saint-Denis', phone: '0600000000',
    cv_url: 'x',
    cv_data: {
      title: 'Développeur', bio: 'Bio', skills: ['React'], experiences: [{}], education: [{}],
    },
  })
  assert.equal(score, 100)
})

test('computeCvCompletion : cv_data présent mais vide compte comme "un CV existe"', () => {
  const score = computeCvCompletion({ cv_data: {} })
  assert.equal(score, 10) // seul le critère "un CV existe" est vrai
})
