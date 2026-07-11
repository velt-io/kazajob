interface CvDataLike {
  title?: string
  bio?: string
  skills?: unknown[]
  experiences?: unknown[]
  education?: unknown[]
}

interface ProfileLike {
  full_name?: string | null
  avatar_url?: string | null
  location?: string | null
  phone?: string | null
  cv_url?: string | null
  cv_data?: Record<string, unknown> | null
}

export function computeCvCompletion(profile: ProfileLike): number {
  const cv = profile.cv_data as CvDataLike | null | undefined
  const checks = [
    !!profile.full_name,
    !!profile.avatar_url,
    !!profile.location,
    !!profile.phone,
    !!cv?.title,
    !!cv?.bio,
    !!cv?.skills?.length,
    !!cv?.experiences?.length,
    !!cv?.education?.length,
    !!(profile.cv_url || cv),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
