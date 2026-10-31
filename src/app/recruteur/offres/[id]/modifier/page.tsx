'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, ScrollText } from 'lucide-react'
import { QuestHeader } from '@/components/quest/recruteur/QuestChrome'
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
      <QuestHeader eyebrow="Modifier l'offre" icon={<ScrollText size={18} />} title={<>Réviser le <span className="qx-text-arcane">parchemin</span></>} />
      <div className="qx-panel p-6">
        {profile && job && <JobForm job={job} recruiterId={profile.id} />}
      </div>
    </div>
  )
}
