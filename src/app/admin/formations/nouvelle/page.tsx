'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TrainingForm } from '@/components/forms/TrainingForm'
import { useAuth } from '@/features/auth/useAuth'

export default function AdminNewTrainingPage() {
  const { profile } = useAuth()
  return (
    <div className="max-w-[760px] mx-auto">
      <Link href="/admin/offres" className="flex items-center gap-2 text-sm font-semibold text-[var(--kz-mute)] hover:text-[var(--kz-ink)] mb-6">
        <ArrowLeft size={16} />Retour
      </Link>
      <h1 className="text-[24px] sm:text-[30px] font-bold text-white leading-tight mb-6">Créer une annonce de formation</h1>
      <div className="qx-panel p-6">
        {profile && <TrainingForm recruiterId={profile.id} admin />}
      </div>
    </div>
  )
}
