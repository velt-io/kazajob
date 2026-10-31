'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Check, X, Shield, Users, Crown, LogOut, Link2, Copy, Trash2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import type { CompanyMember, CompanyJoinRequest, CompanyInvitation } from '@/lib/types'
import { ACCENT, IconButton, PageHeader, SkeletonList, StatusPill, Widget } from '@/components/os/recruiter/primitives'
import { stagger } from '@/components/os/recruiter/secondary-ui'

const ROLE_META: Record<string, { label: string; accent: string; icon: React.ReactNode }> = {
  owner:  { label: 'Propriétaire',   accent: ACCENT.orange, icon: <Crown size={11} /> },
  admin:  { label: 'Administrateur', accent: ACCENT.violet, icon: <Shield size={11} /> },
  member: { label: 'Recruteur',      accent: ACCENT.mute,   icon: <Users size={11} /> },
}

export default function CompanyTeamPage() {
  const { profile } = useAuth()
  const [members, setMembers]   = useState<CompanyMember[]>([])
  const [requests, setRequests] = useState<CompanyJoinRequest[]>([])
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([])
  const [loading, setLoading]   = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Invitation
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState<'member' | 'admin'>('member')
  const [inviteLink, setInviteLink]   = useState('')
  const [inviting, setInviting]       = useState(false)
  const [copied, setCopied]           = useState(false)

  const myMembership = members.find(m => m.recruiter_id === profile?.id)
  const isOwner = myMembership?.role === 'owner'
  const isOwnerOrAdmin = !!myMembership && ['owner', 'admin'].includes(myMembership.role)

  const fetchAll = async () => {
    if (!profile?.company_id) return
    try {
      const [teamRes, invRes] = await Promise.all([
        fetch(`/api/companies/${profile.company_id}/team`),
        fetch(`/api/companies/${profile.company_id}/invitations`),
      ])
      if (teamRes.ok) {
        const { members: m, requests: r } = await teamRes.json()
        setMembers((m ?? []) as CompanyMember[])
        setRequests((r ?? []) as CompanyJoinRequest[])
      }
      if (invRes.ok) setInvitations((await invRes.json()) as CompanyInvitation[])
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [profile?.company_id])

  const handleRequest = async (req: CompanyJoinRequest, approve: boolean) => {
    if (!profile?.company_id) return
    setProcessingId(req.id)
    const res = await fetch(`/api/company-requests/${req.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Action impossible. Réessayez.')
      setProcessingId(null)
      return
    }
    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'join_response', requestId: req.id, approved: approve }),
    }).catch(() => {})
    await fetchAll()
    setProcessingId(null)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Retirer ce membre de l\'équipe ?')) return
    setProcessingId(memberId)
    const res = await fetch(`/api/company-members/${memberId}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Action impossible.') }
    await fetchAll()
    setProcessingId(null)
  }

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    setProcessingId(memberId)
    const res = await fetch(`/api/company-members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Action impossible.') }
    await fetchAll()
    setProcessingId(null)
  }

  const handleTransfer = async (memberId: string, name: string) => {
    if (!profile?.company_id) return
    if (!confirm(`Transférer la propriété de l'entreprise à ${name} ? Vous deviendrez administrateur.`)) return
    setProcessingId(memberId)
    const res = await fetch(`/api/companies/${profile.company_id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Action impossible.') }
    await fetchAll()
    setProcessingId(null)
  }

  const handleLeave = async () => {
    if (!profile?.company_id) return
    if (!confirm('Quitter cette entreprise ? Vous perdrez l\'accès à son espace recruteur.')) return
    const res = await fetch(`/api/companies/${profile.company_id}/leave`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { window.location.href = '/recruiter/dashboard' }
    else alert(data.error ?? 'Action impossible.')
  }

  const handleCreateInvite = async () => {
    if (!profile?.company_id) return
    setInviting(true); setInviteLink(''); setCopied(false)
    const res = await fetch(`/api/companies/${profile.company_id}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() || undefined, role: inviteRole }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.token) {
      setInviteLink(`${window.location.origin}/recruiter/join?invite=${data.token}`)
      if (inviteEmail.trim()) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'team_invitation', token: data.token }),
        }).catch(() => {})
      }
      setInviteEmail('')
      await fetchAll()
    } else {
      alert(data.error ?? 'Impossible de créer l\'invitation.')
    }
    setInviting(false)
  }

  const handleRevoke = async (invId: string) => {
    setProcessingId(invId)
    await fetch(`/api/company-invitations/${invId}`, { method: 'DELETE' })
    await fetchAll()
    setProcessingId(null)
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }


  return (
    <div className="max-w-[760px] mx-auto">
      <PageHeader
        eyebrow="Mon entreprise"
        title="Équipe"
        subtitle={`${members.length} membre${members.length > 1 ? 's' : ''}${requests.length ? ` · ${requests.length} demande(s) en attente` : ''}`}
        actions={myMembership && !isOwner ? (
          <Button kind="soft" size="sm" icon={<LogOut size={14} />} onClick={handleLeave}>Quitter</Button>
        ) : undefined}
      />

      {/* Demandes en attente */}
      {requests.length > 0 && (
        <Widget title={`Demandes d’adhésion (${requests.length})`} icon={<UserPlus size={14} />} accent={ACCENT.orange} className="mb-5" bodyClassName="px-2 pb-2">
          <div className="osr-sep">
            {requests.map((req, i) => {
              const p = req.profile as { full_name: string; email: string } | undefined
              return (
                <div key={req.id} className="osr-row osr-in flex items-center gap-3 px-3 py-3" style={{ ...stagger(i), opacity: processingId === req.id ? 0.55 : undefined }}>
                  <Avatar name={p?.full_name ?? '?'} size={40} color="var(--kz-orange-soft)" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white truncate">{p?.full_name ?? '—'}</div>
                    <div className="text-[12px] text-[var(--kz-mute)] truncate">{p?.email}</div>
                    {req.message && <p className="text-[12px] text-[var(--kz-text)] mt-1 italic line-clamp-2">&quot;{req.message}&quot;</p>}
                  </div>
                  {isOwnerOrAdmin && (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleRequest(req, true)} disabled={processingId === req.id} aria-label="Accepter la demande"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-[var(--kz-green)] hover:brightness-110 active:scale-90 transition disabled:opacity-50">
                        <Check size={16} strokeWidth={2.6} />
                      </button>
                      <button onClick={() => handleRequest(req, false)} disabled={processingId === req.id} aria-label="Refuser la demande"
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-white/[0.12] hover:bg-[var(--osr-red)] active:scale-90 transition disabled:opacity-50">
                        <X size={16} strokeWidth={2.6} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Widget>
      )}

      {/* Inviter un recruteur */}
      {isOwnerOrAdmin && (
        <Widget title="Inviter un recruteur" icon={<Link2 size={14} />} accent={ACCENT.violet} className="mb-5"
          sub="Lien valable 7 jours · envoyé directement si vous saisissez un e-mail">
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="flex-1 min-w-0">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="E-mail (optionnel)"
                type="email"
                aria-label="E-mail de la personne invitée (optionnel)"
                icon={<Mail size={15} />}
              />
            </div>
            <Select
              options={[{ value: 'member', label: 'Recruteur' }, { value: 'admin', label: 'Admin' }]}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
              aria-label="Rôle"
              className="w-full sm:w-36"
            />
            <Button kind="primary" size="md" className="!h-11" loading={inviting} onClick={handleCreateInvite}>Générer</Button>
          </div>

          {inviteLink && (
            <div className="os-pop mt-3 flex items-center gap-2 pl-3.5 pr-1.5 h-11 rounded-[14px] border border-white/10 bg-black/30">
              <Link2 size={14} className="text-[var(--kz-violet)] shrink-0" />
              <code className="flex-1 min-w-0 text-[12px] text-[var(--kz-ink)] truncate">{inviteLink}</code>
              <button onClick={copyLink} aria-live="polite"
                className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold shrink-0 transition-colors ${copied ? 'bg-[var(--kz-green)] text-white' : 'bg-white/[0.1] text-white hover:bg-white/[0.16]'}`}>
                {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          )}

          {/* Invitations en attente */}
          {invitations.length > 0 && (
            <div className="mt-5">
              <p className="osr-eyebrow mb-2 px-1">Invitations en attente ({invitations.length})</p>
              <div className="osr-surface osr-sep overflow-hidden">
                {invitations.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 px-3.5 py-2.5" style={{ opacity: processingId === inv.id ? 0.5 : undefined }}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.07] text-[var(--kz-mute)] shrink-0">
                      {inv.email ? <Mail size={14} /> : <Link2 size={14} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-white truncate">{inv.email ?? 'Lien d\'invitation'}</div>
                      <div className="text-[11px] text-[var(--kz-mute)]">Rôle : {inv.role === 'admin' ? 'Admin' : 'Recruteur'}</div>
                    </div>
                    <IconButton label="Révoquer" tone="danger" onClick={() => handleRevoke(inv.id)} disabled={processingId === inv.id}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Widget>
      )}

      {/* Membres actifs (façon Contacts) */}
      <Widget title="Membres" sub={`${members.length} personne${members.length > 1 ? 's' : ''}`} icon={<Users size={14} />} accent={ACCENT.blue} bodyClassName="px-2 pb-2">
        {loading ? (
          <SkeletonList rows={2} height={60} className="px-3 pb-2" />
        ) : (
          <div className="osr-sep">
            {members.map((m, i) => {
              const p = m.profile as { full_name: string; email: string; avatar_url?: string | null; avatar_config?: Record<string, unknown> | null } | undefined
              const isSelf = m.recruiter_id === profile?.id
              const memberIsOwner = m.role === 'owner'
              const role = ROLE_META[m.role] ?? { label: m.role, accent: ACCENT.mute, icon: null }
              return (
                <div key={m.id} className="osr-row osr-in flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 px-3 py-3" style={{ ...stagger(i), opacity: processingId === m.id ? 0.55 : undefined }}>
                  <Avatar name={p?.full_name ?? '?'} src={p?.avatar_url ?? null} avatarConfig={p?.avatar_config} size={42} color="var(--kz-blue-soft)" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[14px] font-semibold text-white truncate">{p?.full_name ?? '—'}</span>
                      {isSelf && <span className="osr-chip">Vous</span>}
                    </div>
                    <div className="text-[12px] text-[var(--kz-mute)] truncate">{p?.email}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                    <StatusPill accent={role.accent} className="mr-1">
                      <span className="flex items-center gap-1">{role.icon}{role.label}</span>
                    </StatusPill>
                    {/* Transfert de propriété : owner uniquement, sur un autre membre */}
                    {isOwner && !isSelf && !memberIsOwner && (
                      <IconButton label="Transférer la propriété" tone="accent" onClick={() => handleTransfer(m.id, p?.full_name ?? 'ce membre')} disabled={processingId === m.id}>
                        <Crown size={14} />
                      </IconButton>
                    )}
                    {isOwnerOrAdmin && !isSelf && !memberIsOwner && (
                      <>
                        <IconButton label={m.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'} onClick={() => handleChangeRole(m.id, m.role === 'admin' ? 'member' : 'admin')} disabled={processingId === m.id}>
                          <Shield size={14} />
                        </IconButton>
                        <IconButton label="Retirer" tone="danger" onClick={() => handleRemoveMember(m.id)} disabled={processingId === m.id}>
                          <X size={14} />
                        </IconButton>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Widget>
    </div>
  )
}
