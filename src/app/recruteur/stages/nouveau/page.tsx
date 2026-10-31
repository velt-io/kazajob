'use client'

import { StageForm } from '@/components/forms/StageForm'
import { CompanyRequired } from '@/components/feedback/CompanyRequired'
import { useAuth } from '@/features/auth/useAuth'
import { PageHeader } from '@/components/os/recruiter/primitives'
import { BackLink } from '@/components/os/recruiter/secondary-ui'

export default function NewStagePage() {
  const { profile } = useAuth()

  return (
    <CompanyRequired action="publier un stage">
      <div className="max-w-[820px] mx-auto">
        <BackLink href="/recruteur/stages">Stages</BackLink>
        <PageHeader eyebrow="Nouveau stage" title="Publier un stage" subtitle="Décrivez la mission, la durée et la gratification : les étudiants de l'île vous trouvent en quelques secondes." />
        <div className="min-w-0">
          <StageForm companyId={profile?.company_id ?? undefined} />
        </div>
      </div>
    </CompanyRequired>
  )
}
