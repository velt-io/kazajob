'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { JobForm } from '@/components/forms/JobForm'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import type { Job } from '@/lib/types'

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/recruiter/jobs/${id}`)
        if (res.ok) setJob((await res.json()) as Job)
      } catch { /* noop */ }
      setLoading(false)
    }
    fetchJob()
  }, [id])

  if (loading) return <PageLoader />

  return (
    <div className="max-w-[760px] mx-auto">
      <Link href="/recruteur/offres" className="flex items-center gap-2 text-sm font-semibold text-[var(--kz-mute)] hover:text-[var(--kz-ink)] mb-6">
        <ArrowLeft size={16} />
        Retour aux offres
      </Link>
      <h1 className="kz-h2 text-[var(--kz-ink)] mb-6">Modifier l&apos;offre</h1>
      <div className="kz-card p-6 bg-[var(--kz-paper)]">
        {profile && job && <JobForm job={job} recruiterId={profile.id} />}
      </div>
    </div>
  )
}
