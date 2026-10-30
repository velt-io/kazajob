/**
 * Tests du parcours d'aventure candidat.
 * Lancement : npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { computeJourney, journeySummary, CHAPTERS, type JourneyInput } from './quest-journey'

const EMPTY: JourneyInput = { hasAvatar: false, profileFields: 0, skills: 0, hasCv: false, favorites: 0, applications: 0, interviews: 0, hired: 0 }

test('nouveau candidat : 1er chapitre = quête principale, rien de terminé', () => {
  const j = computeJourney(EMPTY)
  assert.equal(j.length, CHAPTERS.length)
  assert.equal(j[0].status, 'current')
  assert.ok(j.slice(1).every((c) => c.status === 'open'))
  assert.equal(journeySummary(j).done, 0)
})

test('progression partielle mesurée sur les vraies données', () => {
  const j = computeJourney({ ...EMPTY, hasAvatar: true, profileFields: 2, skills: 1 })
  assert.equal(j[0].status, 'done')
  assert.equal(j[1].status, 'current')
  assert.equal(j[1].progress, 67)
  assert.equal(j[2].progress, 33)
})

test('une seule quête principale, même si des chapitres suivants sont faits', () => {
  const j = computeJourney({ ...EMPTY, hasAvatar: true, applications: 3 })
  assert.equal(j.filter((c) => c.status === 'current').length, 1)
  assert.equal(j.find((c) => c.id === 'guilde')?.status, 'done')
  assert.equal(j.find((c) => c.id === 'grimoire')?.status, 'current')
})

test('embauche : trésor légendaire et XP cumulée', () => {
  const j = computeJourney({ hasAvatar: true, profileFields: 3, skills: 5, hasCv: true, favorites: 2, applications: 4, interviews: 1, hired: 1 })
  const s = journeySummary(j)
  assert.equal(s.done, 9)
  assert.equal(s.current, null)
  assert.equal(s.xpEarned, s.xpTotal)
  assert.equal(j[8].rarity, 'legendaire')
})
