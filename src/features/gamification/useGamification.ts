'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Profile } from '@/lib/types'
import {
  LEVELS, getLevel, getNextLevel, getXpProgress, computeQuests,
  type GamificationLevel, type Quest, type QuestCategory,
} from '@/lib/gamification'

export { LEVELS, getLevel, getNextLevel, getXpProgress, computeQuests }
export type { GamificationLevel, Quest, QuestCategory }

export interface GamificationData {
  enabled:       boolean
  xp:            number
  streak:        number
  level:         GamificationLevel
  nextLevel:     GamificationLevel
  xpProgress:    number
  quests:        Quest[]
  activeQuests:  Quest[]
  doneQuests:    Quest[]
  skillsCount:   number
  toggle:        () => Promise<void>
}

// `useGamification` peut être monté par plusieurs composants en même temps (layout + page) —
// une garde au niveau module évite d'appeler /api/gamification/sync plusieurs fois en parallèle
// pour le même utilisateur (le endpoint n'est pas protégé contre les écritures concurrentes,
// le driver Neon HTTP ne supportant pas les transactions).
let syncedUserId: string | null = null
let syncPromise: Promise<{ new_xp?: number } | null> | null = null

function syncQuestXpOnce(userId: string): Promise<{ new_xp?: number } | null> {
  if (syncedUserId === userId && syncPromise) return syncPromise
  syncedUserId = userId
  syncPromise = fetch('/api/gamification/sync', { method: 'POST' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
  return syncPromise
}

export function useGamification(
  profile: Profile | null,
  applicationsCount: number,
  favoritesCount:    number,
): GamificationData {
  const [skillsCount, setSkillsCount] = useState(0)
  const [enabled, setEnabled]         = useState(profile?.gamification_enabled ?? true)
  const [xpOverride, setXpOverride]   = useState<number | null>(null)

  useEffect(() => {
    if (profile && profile.gamification_enabled !== undefined) {
      setEnabled(profile.gamification_enabled)
    }
  }, [profile?.gamification_enabled])

  useEffect(() => {
    if (!profile?.id) return
    fetch('/api/candidate-skills')
      .then((r) => (r.ok ? r.json() : []))
      .then((skills: unknown[]) => setSkillsCount(Array.isArray(skills) ? skills.length : 0))
      .catch(() => {})
  }, [profile?.id])

  // Synchronise l'XP côté serveur — le serveur recalcule les quêtes à partir des données
  // réelles et n'attribue l'XP qu'une seule fois par quête (idempotent via claimed_quests).
  useEffect(() => {
    if (!profile?.id) return
    let cancelled = false
    syncQuestXpOnce(profile.id).then((d) => {
      if (!cancelled && d?.new_xp !== undefined) setXpOverride(d.new_xp)
    })
    return () => { cancelled = true }
  }, [profile?.id])

  const toggle = useCallback(async () => {
    if (!profile?.id) return
    const newVal = !enabled
    setEnabled(newVal)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gamification_enabled: newVal }),
      })
      if (!res.ok) setEnabled(!newVal)
    } catch {
      setEnabled(!newVal)
    }
  }, [profile?.id, enabled])

  const xp         = xpOverride ?? profile?.xp ?? 0
  const streak     = profile?.streak ?? 0
  const level      = getLevel(xp)
  const nextLevel  = getNextLevel(xp)
  const xpProgress = getXpProgress(xp)
  const quests     = computeQuests(profile, applicationsCount, favoritesCount, skillsCount)
  const doneQuests = quests.filter(q => q.completed)
  const activeQuests = quests.filter(q => !q.completed).slice(0, 5)

  return {
    enabled, xp, streak, level, nextLevel, xpProgress,
    quests, activeQuests, doneQuests, skillsCount, toggle,
  }
}
