'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { JobForm } from '@/components/forms/JobForm'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import type { Job } from '@/lib/types'
import { PageHeader } from '@/components/os/recruiter/primitives'
import { BackLink, FormWindow } from '@/components/os/recruiter/secondary-ui'

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
    <div className="max-w-[820px] mx-auto">
      <BackLink href="/recruiter/jobs">Mes offres</BackLink>
      <PageHeader eyebrow="Modification" title="Modifier l’offre" subtitle={job?.title} />
      <FormWindow title={job?.title ?? 'Offre'}>
        {profile && job && <JobForm job={job} recruiterId={profile.id} />}
      </FormWindow>
    </div>
  )
}
