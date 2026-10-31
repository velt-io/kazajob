/**
 * Tests des helpers de présentation des pages candidat (thème Quest).
 * Lancement : npx tsx --test src/components/quest/candidat/quest-ui.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  bountyRarity, monthlyReference, rarityCounts, isFresh, applicationQuest,
  countdownLabel, monthGrid, dayKey, projectIsland, findCityCoords,
} from './quest-ui'

test('salaire de référence : annuel ramené au mois, vide ignoré', () => {
  assert.equal(monthlyReference(null, null), null)
  assert.equal(monthlyReference(1800, 2200), 1800)
  assert.equal(monthlyReference(null, 2400), 2400)
  assert.equal(monthlyReference(36_000, 42_000), 3000)
})

test('rareté dérivée des vraies données uniquement', () => {
  assert.equal(bountyRarity({}).rarity, 'commune')
  assert.deepEqual(bountyRarity({}).reasons, [])
  assert.equal(bountyRarity({ match_score: 92 }).rarity, 'legendaire')
  assert.equal(bountyRarity({ match_score: 80 }).rarity, 'epique')
  assert.equal(bountyRarity({ match_score: 65 }).rarity, 'rare')
  assert.equal(bountyRarity({ match_score: 40 }).rarity, 'commune')
  assert.equal(bountyRarity({ is_boosted: true }).rarity, 'epique')
  assert.equal(bountyRarity({ is_boosted: true, salary_min: 2600 }).rarity, 'legendaire')
  assert.equal(bountyRarity({ salary_min: 3200 }).rarity, 'epique')
  assert.equal(bountyRarity({ salary_min: 2100 }).rarity, 'rare')
  assert.equal(bountyRarity({ salary_min: 1500 }).rarity, 'commune')
})

test('rareté : raisons lisibles', () => {
  const r = bountyRarity({ match_score: 91, is_boosted: true, salary_min: 2600 })
  assert.equal(r.reasons[0], 'Compatibilité 91 %')
  assert.equal(r.reasons[1], 'Offre à la une')
  assert.match(r.reasons[2], /^Prime ≥ 2.500 €\/mois$/)
})

test('comptage par rareté', () => {
  const c = rarityCounts([{ match_score: 95 }, { is_boosted: true }, { salary_min: 2100 }, {}, {}])
  assert.deepEqual(c, { legendaire: 1, epique: 1, rare: 1, commune: 2 })
})

test('offre récente : moins de 3 jours', () => {
  const now = new Date('2026-10-31T12:00:00Z').getTime()
  assert.equal(isFresh('2026-10-30T12:00:00Z', now), true)
  assert.equal(isFresh('2026-10-27T12:00:00Z', now), false)
  assert.equal(isFresh(null, now), false)
  assert.equal(isFresh('pas une date', now), false)
})

test('candidature → étape de quête', () => {
  assert.deepEqual(applicationQuest('pending'), { step: 0, state: 'active', progress: 0, rarity: 'commune' })
  assert.equal(applicationQuest('viewed').step, 1)
  assert.equal(applicationQuest('interview').rarity, 'epique')
  assert.equal(applicationQuest('offer').progress, 75)
  assert.equal(applicationQuest('hired').state, 'won')
  assert.equal(applicationQuest('rejected').state, 'lost')
  assert.equal(applicationQuest('withdrawn').step, -1)
  assert.equal(applicationQuest('inconnu').step, 0)
})

test('compte à rebours', () => {
  const now = new Date(2026, 9, 31, 9, 0)
  assert.equal(countdownLabel(new Date(2026, 9, 31, 8, 0), now), 'Passé')
  assert.equal(countdownLabel(new Date(2026, 9, 31, 9, 20), now), 'Dans 20 min')
  assert.equal(countdownLabel(new Date(2026, 9, 31, 14, 0), now), 'Aujourd’hui · dans 5 h')
  assert.equal(countdownLabel(new Date(2026, 10, 1, 8, 0), now), 'Demain')
  assert.equal(countdownLabel(new Date(2026, 10, 4, 8, 0), now), 'Dans 4 jours')
})

test('grille du mois : semaines du lundi au dimanche', () => {
  const oct = monthGrid(2026, 9) // octobre 2026 commence un jeudi
  assert.ok(oct.every((w) => w.length === 7))
  assert.deepEqual(oct[0], [null, null, null, 1, 2, 3, 4])
  assert.equal(oct.flat().filter((d) => d !== null).length, 31)
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05')
})

test('carte de l’île : projection et recherche de ville', () => {
  const [x, y] = projectIsland(-20.85, 55.2, 200, 100)
  assert.deepEqual([x, y], [0, 0])
  const [x2, y2] = projectIsland(-21.4, 55.85, 200, 100)
  assert.deepEqual([x2, y2], [200, 100])
  const coords = { 'Saint-Pierre': [-21.33, 55.48] as [number, number], 'Saint-Paul': [-21.0, 55.27] as [number, number] }
  assert.equal(findCityCoords('Saint-Pierre', coords)?.city, 'Saint-Pierre')
  assert.equal(findCityCoords('saint-paul (974)', coords)?.city, 'Saint-Paul')
  assert.equal(findCityCoords('Télétravail', coords), null)
  assert.equal(findCityCoords(null, coords), null)
})
