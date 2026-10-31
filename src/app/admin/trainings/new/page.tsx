'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { TrainingForm } from '@/components/forms/TrainingForm'
import { useAuth } from '@/features/auth/useAuth'

export default function AdminNewTrainingPage() {
  const { profile } = useAuth()
  return (
    <div className="max-w-[760px] mx-auto">
      <Link href="/admin/jobs" className="inline-flex items-center gap-0.5 text-[14px] font-medium text-[var(--kz-blue)] hover:brightness-125 mb-3">
        <ChevronLeft size={16} />Retour
      </Link>
      <p className="osr-eyebrow mb-2">Administration</p>
      <h1 className="osr-title mb-7">Créer une annonce de formation</h1>
      <div className="os-glass rounded-[28px] p-4 sm:p-6">
        {profile && <TrainingForm recruiterId={profile.id} admin />}
      </div>
    </div>
  )
}
