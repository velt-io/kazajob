import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSkillName, matchLevel, type SkillLike } from './skills'

test('normalizeSkillName : casse, accents, espaces', () => {
  assert.equal(normalizeSkillName('JavaScript'), 'javascript')
  assert.equal(normalizeSkillName('Java Script'), 'java script')
  assert.equal(normalizeSkillName('java-script'), 'java script')
  assert.equal(normalizeSkillName('Réseaux sociaux'), 'reseaux sociaux')
  assert.equal(normalizeSkillName('Reseaux   sociaux'), 'reseaux sociaux')
})

test('normalizeSkillName : Next.js et variantes convergent', () => {
  const variants = ['Next.js', 'Next JS', 'Next-JS'].map(normalizeSkillName)
  assert.equal(new Set(variants).size, 1)
})

test('normalizeSkillName : apostrophes normalisées', () => {
  assert.equal(normalizeSkillName('Gestion d’équipe'), normalizeSkillName('Gestion d\'équipe'))
})

const catalog: SkillLike[] = [
  { id: '1', name: 'JavaScript', normalizedName: 'javascript' },
  { id: '2', name: 'Java', normalizedName: 'java' },
  { id: '3', name: 'React', normalizedName: 'react' },
  { id: '4', name: 'React Native', normalizedName: 'react native' },
  { id: '5', name: 'Gestion de projet', normalizedName: 'gestion de projet' },
]

test('matchLevel : correspondance exacte', () => {
  const r = matchLevel('javascript', catalog)
  assert.equal(r.level, 'exact')
  assert.equal(r.exact?.id, '1')
})

test('matchLevel : aucune correspondance', () => {
  const r = matchLevel('devops kubernetes', catalog)
  assert.equal(r.level, 'none')
})

test('matchLevel : Java et JavaScript ne se confondent jamais (faux positif)', () => {
  const r = matchLevel('java', catalog)
  assert.equal(r.level, 'exact')
  assert.equal(r.exact?.id, '2')
  assert.ok(!r.suggestions.some((s) => s.id === '1'))
})

test('matchLevel : React et React Native ne se confondent jamais (faux positif)', () => {
  const r = matchLevel('react', catalog)
  assert.equal(r.level, 'exact')
  assert.ok(!r.suggestions.some((s) => s.id === '4'))
})

test('matchLevel : variante proche suggérée sans création automatique', () => {
  const r = matchLevel('gestion de projets', catalog)
  assert.equal(r.level, 'close')
  assert.equal(r.suggestions[0]?.id, '5')
})
