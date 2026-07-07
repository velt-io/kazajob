'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StageForm } from '@/components/forms/StageForm'
import { CompanyRequired } from '@/components/feedback/CompanyRequired'
import { useAuth } from '@/features/auth/useAuth'

export default function NewStagePage() {
  const { profile } = useAuth()

  return (
    <CompanyRequired action="publier un stage">
      <div className="max-w-[760px] mx-auto">
        <Link href="/recruiter/stages" className="flex items-center gap-2 text-sm font-semibold text-[#6B5A4A] hover:text-[#1A1410] mb-6">
          <ArrowLeft size={16} />
          Retour aux stages
        </Link>
        <h1 className="kz-h2 text-[#1A1410] mb-6">Publier un stage</h1>
        <StageForm companyId={profile?.company_id ?? undefined} />
      </div>
    </CompanyRequired>
  )
}
