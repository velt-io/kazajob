'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { ACCENT, EmptyPanel, StatusPill, WindowBar } from '@/components/os/recruiter/primitives'

interface InvitePreview {
  company: { name: string; logo_url: string | null } | null
  role: 'member' | 'admin'
  email: string | null
}

const ROLE_LABEL: Record<string, string> = { admin: 'Administrateur', member: 'Recruteur' }

function JoinContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('invite') ?? ''
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setError('Lien d\'invitation manquant.'); setLoading(false); return }
    fetch(`/api/invitations/${token}`)
      .then(async (r) => {
        if (r.ok) setInvite((await r.json()) as InvitePreview)
        else setError('Cette invitation est invalide ou a expiré.')
      })
      .catch(() => setError('Erreur de chargement.'))
      .finally(() => setLoading(false))
  }, [token])

  const accept = async () => {
    setAccepting(true); setError('')
    const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) router.push('/recruiter/company/team')
    else { setError(data.error ?? 'Impossible d\'accepter l\'invitation.'); setAccepting(false) }
  }

  if (loading) return <PageLoader />

  if (error && !invite) {
    return (
      <div className="max-w-[480px] mx-auto py-10">
        <div className="osr-panel">
          <EmptyPanel
            icon={<AlertCircle size={28} />}
            accent={ACCENT.orange}
            title="Invitation indisponible"
            description={error}
            action={<Button kind="outline" onClick={() => router.push('/recruiter/dashboard')}>Retour au tableau de bord</Button>}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[480px] mx-auto py-8 sm:py-12">
      <div className="os-glass rounded-[28px] overflow-hidden os-pop shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)]">
        <WindowBar title="Invitation équipe" />
        <div className="p-6 sm:p-7 text-center">
          <div className="w-20 h-20 rounded-[24px] border border-white/10 flex items-center justify-center mx-auto mb-5 overflow-hidden text-white"
            style={{ background: 'linear-gradient(145deg, var(--osr-indigo), var(--kz-violet))', boxShadow: '0 20px 44px -18px var(--kz-violet)' }}>
            {invite?.company?.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={invite.company.logo_url} alt="" className="w-full h-full object-cover" />
              : <Building2 size={30} />}
          </div>
          <p className="osr-eyebrow mb-2">Invitation équipe</p>
          <h1 className="text-[28px] font-semibold tracking-[-0.035em] leading-tight text-white mb-3">
            Rejoindre <span className="os-text-aurora">{invite?.company?.name ?? 'l\'entreprise'}</span>
          </h1>
          <p className="text-[14px] text-[var(--kz-mute)] mb-6 leading-relaxed">
            Vous êtes invité(e) à rejoindre cet espace recruteur en tant que{' '}
            <StatusPill accent={ACCENT.violet}>{ROLE_LABEL[invite?.role ?? 'member']}</StatusPill>
          </p>

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>
          )}

          <Button kind="primary" size="lg" full loading={accepting} onClick={accept} iconRight={<ArrowRight size={15} />}>
            Accepter l&apos;invitation
          </Button>
          <button onClick={() => router.push('/recruiter/dashboard')}
            className="mt-3 h-9 px-4 rounded-full text-[13px] font-medium text-[var(--kz-mute)] hover:text-white hover:bg-white/[0.06] transition-colors">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JoinContent />
    </Suspense>
  )
}
