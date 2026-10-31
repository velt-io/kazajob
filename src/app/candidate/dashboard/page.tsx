'use client'

import { useState, useEffect } from 'react'
import type { Job } from '@/lib/types'
import { useAuth } from '@/features/auth/useAuth'
import { useApplications } from '@/features/applications/useApplications'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useGamification } from '@/features/gamification/useGamification'
import { computeCvCompletion } from '@/lib/cv'
import { TodayDashboard } from '@/components/os/TodayDashboard'

export default function CandidateDashboard() {
  const { profile } = useAuth()
  const { applications, loading: appsLoading } = useApplications(profile?.id)
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const { favorites } = useFavorites(profile?.id)
  const gami = useGamification(profile, applications.length, favorites.length)

  useEffect(() => {
    if (!profile?.id) return
    fetch('/api/jobs/recommended?limit=4')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRecommendedJobs(d as Job[]))
      .catch(() => {})
      .finally(() => setJobsLoading(false))
  }, [profile?.id])

  const profileScore = computeCvCompletion(profile ?? {})

  if (!profile) return null

  // Thème OS 2027 : une seule vue « Aujourd'hui » (les anneaux remplacent le mode quête)
  return (
    <TodayDashboard
      profile={profile}
      gami={gami}
      applications={applications}
      appsLoading={appsLoading}
      recommendedJobs={recommendedJobs}
      jobsLoading={jobsLoading}
      favoritesCount={favorites.length}
      profileScore={profileScore}
      showQuiz={!profile.quiz_result}
    />
  )
}
