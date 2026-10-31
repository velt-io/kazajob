'use client'

import { useEffect, useState } from 'react'
import { Building2, Check, X, ChevronRight, BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import type { Company } from '@/lib/types'
import { timeAgo } from '@/lib/utils'
import { ACCENT, EmptyPanel, Monogram, PageHeader, StatusPill } from '@/components/os/recruiter/primitives'
import { Tooltip } from '@/components/ui/radix'

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/companies')
        if (res.ok) setCompanies((await res.json()) as Company[])
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [])

  const toggleVerified = async (company: Company) => {
    await fetch(`/api/admin/companies/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: !company.is_verified }),
    })
    setCompanies((prev) => prev.map((c) => c.id === company.id ? { ...c, is_verified: !c.is_verified } : c))
  }

  const verified = companies.filter((c) => c.is_verified).length

  return (
    <div className="max-w-[960px] mx-auto">
      <PageHeader
        eyebrow="Annuaire"
        title="Entreprises"
        subtitle={`${companies.length} entreprise(s) · ${verified} vérifiée(s)`}
      />

      {loading ? <PageLoader /> : companies.length === 0 ? (
        <div className="osr-panel">
          <EmptyPanel icon={<Building2 size={26} />} title="Aucune entreprise" accent={ACCENT.green} />
        </div>
      ) : (
        <div className="osr-panel p-2 osr-sep">
          {companies.map((company, i) => (
            <div key={company.id} className="osr-row osr-in flex items-center gap-3 sm:gap-4 px-3 py-3" style={{ ['--i' as string]: i } as React.CSSProperties}>
              <Monogram name={company.name} size={44} gradient="linear-gradient(145deg, var(--osr-indigo), var(--kz-blue))" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15px] font-semibold text-white truncate">{company.name}</h3>
                  {company.is_verified && <StatusPill accent={ACCENT.green}>Vérifiée</StatusPill>}
                </div>
                <div className="osr-sub text-[12px] text-[var(--kz-mute)] truncate">
                  {company.location ?? '—'} · {company.sector ?? 'Secteur non précisé'} · {timeAgo(company.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleVerified(company)}
                  aria-label={company.is_verified ? `Retirer la vérification de ${company.name}` : `Vérifier ${company.name}`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kz-blue)]"
                  style={company.is_verified
                    ? { background: 'var(--osr-fill-2)', color: 'var(--kz-text)' }
                    : { background: 'color-mix(in srgb, var(--kz-green) 18%, transparent)', color: 'var(--kz-green)' }}
                >
                  {company.is_verified ? <X size={13} /> : <Check size={13} />}
                  <span className="hidden sm:inline">{company.is_verified ? 'Retirer' : 'Vérifier'}</span>
                  {!company.is_verified && <BadgeCheck size={13} className="sm:hidden" aria-hidden />}
                </button>
                <Tooltip content="Abonnement & usage">
                  <Link href={`/admin/companies/${company.id}`} aria-label={`Abonnement et usage de ${company.name}`} className="osr-icon-btn">
                    <ChevronRight size={16} />
                  </Link>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
