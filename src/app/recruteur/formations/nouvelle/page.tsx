'use client'

import Link from 'next/link'
import { ArrowLeft, GraduationCap } from 'lucide-react'
import { QuestHeader } from '@/components/quest/recruteur/QuestChrome'
import { TrainingForm } from '@/components/forms/TrainingForm'
import { CompanyRequired } from '@/components/feedback/CompanyRequired'
import { useAuth } from '@/features/auth/useAuth'

export default function NewTrainingPage() {
  const { profile } = useAuth()
  return (
    <CompanyRequired action="publier une offre de formation">
    <div className="max-w-[760px] mx-auto">
      <Link href="/recruteur/formations"
        className="flex items-center gap-2 text-sm font-semibold text-[var(--kz-mute)] hover:text-[var(--kz-ink)] mb-6">
        <ArrowLeft size={16} /> Retour aux formations
      </Link>
      <QuestHeader eyebrow="Publier une offre de formation" icon={<GraduationCap size={18} />} tone="var(--qx-gold)" title={<>Ouvrir un <span className="qx-text-arcane">enseignement</span></>} />
      <div className="qx-panel p-6">
        {profile && (
          <TrainingForm
            recruiterId={profile.id}
            companyId={profile.company_id ?? undefined}
          />
        )}
      </div>
    </div>
    </CompanyRequired>
  )
}
