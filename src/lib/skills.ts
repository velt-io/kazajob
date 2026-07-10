export function normalizeSkillName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’´`]/g, "'")
    .replace(/[-_.]+/g, ' ')
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type SkillMatchLevel = 'exact' | 'close' | 'none'

export interface SkillLike {
  id: string
  name: string
  normalizedName: string | null
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const prev = new Array(n + 1)
  const curr = new Array(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j]
  }
  return prev[n]
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

// Seuil conservateur : évite les faux positifs comme Java/JavaScript, React/React Native.
const CLOSE_MATCH_THRESHOLD = 0.86
const MIN_LENGTH_FOR_FUZZY = 4

export interface MatchResult {
  level: SkillMatchLevel
  exact?: SkillLike
  suggestions: SkillLike[]
}

export function matchLevel(normalized: string, existing: SkillLike[]): MatchResult {
  const exact = existing.find((s) => s.normalizedName === normalized)
  if (exact) return { level: 'exact', exact, suggestions: [] }

  if (normalized.length < MIN_LENGTH_FOR_FUZZY) return { level: 'none', suggestions: [] }

  const suggestions = existing
    .map((s) => ({ skill: s, score: similarity(normalized, s.normalizedName ?? '') }))
    .filter((r) => r.score >= CLOSE_MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.skill)

  return { level: suggestions.length > 0 ? 'close' : 'none', suggestions }
}
