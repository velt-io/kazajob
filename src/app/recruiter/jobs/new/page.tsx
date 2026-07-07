'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { JobForm } from '@/components/forms/JobForm'
import { CompanyRequired } from '@/components/feedback/CompanyRequired'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
import type { CompanyBillingSummary } from '@/lib/queries/billing-summary'
import { KZ } from '@/lib/constants'

export default function NewJobPage() {
  const { profile } = useAuth()
  const [billing, setBilling] = useState<CompanyBillingSummary | null>(null)
  const [loadingBilling, setLoadingBilling] = useState(true)

  useEffect(() => {
    if (!profile?.company_id) return
    fetch('/api/recruiter/billing-summary')
      .then(r => r.ok ? r.json() : null)
      .then(d => setBilling(d as CompanyBillingSummary | null))
      .catch(() => {})
      .finally(() => setLoadingBilling(false))
  }, [profile?.company_id])

  const blocked = !loadingBilling && billing !== null && !billing.canPublishJob

  return (
    <CompanyRequired action="publier une offre d'emploi">
    <div className="max-w-[760px] mx-auto">
      <Link href="/recruiter/jobs" className="flex items-center gap-2 text-sm font-semibold text-[#6B5A4A] hover:text-[#1A1410] mb-6">
        <ArrowLeft size={16} />
        Retour aux offres
      </Link>

      <h1 className="kz-h2 text-[#1A1410] mb-6">Publier une nouvelle offre</h1>

      {blocked && billing ? (
        <div className="kz-card p-8 bg-white text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: KZ.orangeSoft }}>
            <Lock size={24} color={KZ.orange} />
          </div>
          <h2 className="text-lg font-extrabold text-[#1A1410] mb-2">Publication temporairement bloquée</h2>
          <p className="text-sm text-[#6B5A4A] leading-relaxed max-w-md mx-auto mb-6">
            {billing.maxJobs !== -1 ? (
              <>
                Votre entreprise utilise <strong>{billing.activeJobs}</strong> annonces actives.
                Votre offre actuelle permet <strong>{billing.maxJobs}</strong> annonces actives.
                <br /><br />
                Vos annonces existantes restent visibles, mais vous devez passer à une offre supérieure
                ou attendre l&apos;expiration d&apos;une annonce pour publier à nouveau.
              </>
            ) : billing.message.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {billing.message.primaryActionHref && billing.message.primaryActionLabel && (
              <Link href={billing.message.primaryActionHref}>
                <Button kind="primary" size="md">{billing.message.primaryActionLabel}</Button>
              </Link>
            )}
            <Link href="/contact">
              <Button kind="outline" size="md">Contacter Kazajob</Button>
            </Link>
            <Link href="/recruiter/jobs">
              <Button kind="soft" size="md">Retour à mes annonces</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="kz-card p-6 bg-white">
          {profile && !loadingBilling && (
            <JobForm
              recruiterId={profile.id}
              companyId={profile.company_id ?? undefined}
            />
          )}
          {loadingBilling && <div className="h-32 animate-pulse rounded-xl bg-[#FBEFE0]" />}
        </div>
      )}
    </div>
    </CompanyRequired>
  )
}
