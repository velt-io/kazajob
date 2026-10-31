'use client'

import { TrainingForm } from '@/components/forms/TrainingForm'
import { CompanyRequired } from '@/components/feedback/CompanyRequired'
import { useAuth } from '@/features/auth/useAuth'
import { PageHeader } from '@/components/os/recruiter/primitives'
import { BackLink, FormWindow } from '@/components/os/recruiter/secondary-ui'

export default function NewTrainingPage() {
  const { profile } = useAuth()
  return (
    <CompanyRequired action="publier une offre de formation">
      <div className="max-w-[820px] mx-auto">
        <BackLink href="/recruiter/training">Formations</BackLink>
        <PageHeader eyebrow="Nouvelle formation" title="Publier une offre de formation" />
        <FormWindow title="Nouvelle offre de formation">
          {profile && (
            <TrainingForm
              recruiterId={profile.id}
              companyId={profile.company_id ?? undefined}
            />
          )}
        </FormWindow>
      </div>
    </CompanyRequired>
  )
}
