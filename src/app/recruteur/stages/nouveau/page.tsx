'use client'

import { ArrowLeft, ClipboardList } from 'lucide-react'
import { QuestHeader } from '@/components/quest/recruteur/QuestChrome'
import Link from 'next/link'
import { StageForm } from '@/components/forms/StageForm'
import { CompanyRequired } from '@/components/feedback/CompanyRequired'
import { useAuth } from '@/features/auth/useAuth'

export default function NewStagePage() {
  const { profile } = useAuth()

  return (
    <CompanyRequired action="publier un stage">
      <div className="max-w-[760px] mx-auto">
        <Link href="/recruteur/stages" className="flex items-center gap-2 text-sm font-semibold text-[var(--kz-mute)] hover:text-[var(--kz-ink)] mb-6">
          <ArrowLeft size={16} />
          Retour aux stages
        </Link>
        <QuestHeader eyebrow="Publier un stage" icon={<ClipboardList size={18} />} tone="var(--qx-cyan)" title={<>Nouvelle quête d&apos;<span className="qx-text-arcane">apprenti</span></>} />
        <StageForm companyId={profile?.company_id ?? undefined} />
      </div>
    </CompanyRequired>
  )
}
