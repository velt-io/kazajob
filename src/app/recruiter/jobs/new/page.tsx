'use client'

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { JobForm } from '@/components/forms/JobForm'
import { CompanyRequired } from '@/components/feedback/CompanyRequired'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
import type { CompanyBillingSummary } from '@/lib/queries/billing-summary'
import { ACCENT, PageHeader, SkeletonList, accentStyle, tint } from '@/components/os/recruiter/primitives'
import { BackLink, FormWindow } from '@/components/os/recruiter/secondary-ui'

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
    <div className="max-w-[820px] mx-auto">
      <BackLink href="/recruiter/jobs">Mes offres</BackLink>

      <PageHeader eyebrow="Nouvelle annonce" title="Publier une nouvelle offre" subtitle="Quelques minutes suffisent. KazaIA peut vous aider à rédiger la description." />

      {blocked && billing ? (
        <div className="osr-panel osr-glow p-8 sm:p-10 text-center" style={accentStyle(ACCENT.orange)}>
          <span className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-5 text-white"
            style={{ background: `linear-gradient(145deg, ${ACCENT.orange}, ${tint(ACCENT.orange, 55)})`, boxShadow: `0 18px 40px -16px ${ACCENT.orange}` }}>
            <Lock size={26} />
          </span>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white mb-2">Publication temporairement bloquée</h2>
          <p className="text-[15px] text-[var(--kz-mute)] leading-relaxed max-w-md mx-auto mb-7">
            {billing.maxJobs !== -1 ? (
              <>
                Votre entreprise utilise <strong className="text-white">{billing.activeJobs}</strong> annonces actives.
                Votre offre actuelle permet <strong className="text-white">{billing.maxJobs}</strong> annonces actives.
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
        <FormWindow title="Nouvelle offre d'emploi">
          {profile && !loadingBilling && (
            <JobForm
              recruiterId={profile.id}
              companyId={profile.company_id ?? undefined}
            />
          )}
          {loadingBilling && <SkeletonList rows={3} height={48} />}
        </FormWindow>
      )}
    </div>
    </CompanyRequired>
  )
}
