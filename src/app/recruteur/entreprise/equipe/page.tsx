'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Check, X, Shield, Users, Crown, LogOut, Link2, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'
import { QuestHeader } from '@/components/quest/recruteur/QuestChrome'
import type { CompanyMember, CompanyJoinRequest, CompanyInvitation } from '@/lib/types'
import type { BadgeColor } from '@/lib/types'

const ROLE_BADGE: Record<string, BadgeColor> = { owner: 'orange', admin: 'violet', member: 'cream' }
const ROLE_ICON: Record<string, React.ReactNode> = {
  owner: <Crown size={12} />, admin: <Shield size={12} />, member: <Users size={12} />,
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
    if (res.ok) { window.location.href = '/recruteur/tableau-de-bord' }
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
      setInviteLink(`${window.location.origin}/recruteur/rejoindre?invite=${data.token}`)
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
    <div className="max-w-[700px] mx-auto">
      <QuestHeader
        eyebrow="Mon entreprise"
        icon={<Users size={18} />}
        title={<>La <span className="qx-text-arcane">compagnie</span></>}
        subtitle="Gestion de l'équipe : membres, rôles et invitations."
        actions={myMembership && !isOwner ? (
          <Button kind="outline" size="sm" icon={<LogOut size={14} />} onClick={handleLeave}>Quitter</Button>
        ) : undefined}
      />

      {/* Demandes en attente */}
      {requests.length > 0 && (
        <div className="qx-panel p-5 mb-5">
          <h2 className="text-sm font-bold text-[var(--kz-ink)] mb-3 flex items-center gap-2">
            <UserPlus size={15} color={KZ.orange} />
            Demandes d&apos;adhésion ({requests.length})
          </h2>
          <div className="flex flex-col gap-3">
            {requests.map(req => {
              const p = req.profile as { full_name: string; email: string } | undefined
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--kz-line)]"
                  style={{ background: KZ.yellowSoft }}>
                  <Avatar name={p?.full_name ?? '?'} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[var(--kz-ink)]">{p?.full_name ?? '—'}</div>
                    <div className="text-xs text-[var(--kz-mute)] truncate">{p?.email}</div>
                    {req.message && <p className="text-xs text-[var(--kz-text)] mt-1 italic">&quot;{req.message}&quot;</p>}
                  </div>
                  {isOwnerOrAdmin && (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleRequest(req, true)} disabled={processingId === req.id} aria-label="Accepter la demande"
                        className="w-8 h-8 rounded-lg border border-[var(--kz-green)] flex items-center justify-center hover:bg-[var(--kz-green-soft)]">
                        <Check size={15} color={KZ.green} />
                      </button>
                      <button onClick={() => handleRequest(req, false)} disabled={processingId === req.id} aria-label="Refuser la demande"
                        className="w-8 h-8 rounded-lg border border-red-300 flex items-center justify-center hover:bg-red-50">
                        <X size={15} color="#EF4444" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Inviter un recruteur */}
      {isOwnerOrAdmin && (
        <div className="qx-panel p-5 mb-5">
          <h2 className="text-sm font-bold text-[var(--kz-ink)] mb-1 flex items-center gap-2">
            <Link2 size={15} color={KZ.violet} /> Inviter un recruteur
          </h2>
          <p className="text-xs text-[var(--kz-mute)] mb-3">
            Générez un lien d&apos;invitation (valable 7 jours). Avec un e-mail, l&apos;invitation est aussi envoyée directement.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="E-mail (optionnel)"
              type="email"
              className="flex-1"
            />
            <Select
              options={[{ value: 'member', label: 'Recruteur' }, { value: 'admin', label: 'Admin' }]}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
              className="w-full sm:w-36"
            />
            <Button kind="violet" size="md" loading={inviting} onClick={handleCreateInvite}>Générer</Button>
          </div>

          {inviteLink && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl border border-[var(--kz-edge)]" style={{ background: KZ.violetSoft }}>
              <code className="flex-1 min-w-0 text-[11px] text-[var(--kz-ink)] truncate">{inviteLink}</code>
              <button onClick={copyLink} className="flex items-center gap-1 text-xs font-bold shrink-0 text-[var(--qx-magenta)]">
                {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          )}

          {/* Invitations en attente */}
          {invitations.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-xs font-bold text-[var(--kz-mute)]">Invitations en attente ({invitations.length})</p>
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-[var(--kz-line)]" style={{ background: KZ.cream2 }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--kz-ink)] truncate">{inv.email ?? 'Lien d\'invitation'}</div>
                    <div className="text-[10px] text-[var(--kz-mute)]">Rôle : {inv.role === 'admin' ? 'Admin' : 'Recruteur'}</div>
                  </div>
                  <button onClick={() => handleRevoke(inv.id)} disabled={processingId === inv.id}
                    className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-red-400 hover:text-red-500 transition-colors" title="Révoquer" aria-label="Révoquer l'invitation">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Membres actifs */}
      <div className="qx-panel overflow-hidden">
        <div className="p-4 border-b border-[var(--kz-line)] flex justify-between items-center">
          <h2 className="text-[15px] font-bold text-white font-[family-name:var(--font-epic)] tracking-wide">Membres ({members.length})</h2>
        </div>
        {loading ? (
          <div className="p-4 flex flex-col gap-2">
            {[1, 2].map(i => <div key={i} className="h-14 qxr-skeleton" />)}
          </div>
        ) : (
          <div className="divide-y divide-[var(--kz-line)]">
            {members.map(m => {
              const p = m.profile as { full_name: string; email: string; avatar_url?: string | null; avatar_config?: Record<string, unknown> | null } | undefined
              const isSelf = m.recruiter_id === profile?.id
              const memberIsOwner = m.role === 'owner'
              return (
                <div key={m.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-4 hover:bg-[rgba(168,85,247,0.08)] transition-colors">
                  <Avatar name={p?.full_name ?? '?'} src={p?.avatar_url ?? null} avatarConfig={p?.avatar_config} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{p?.full_name ?? '—'}</span>
                      {isSelf && <Badge color="cream" size="sm">Vous</Badge>}
                    </div>
                    <div className="text-xs text-[var(--kz-mute)] truncate">{p?.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color={ROLE_BADGE[m.role] ?? 'cream'} size="sm">
                      <span className="flex items-center gap-1">{ROLE_ICON[m.role]} {m.role}</span>
                    </Badge>
                    {/* Transfert de propriété : owner uniquement, sur un autre membre */}
                    {isOwner && !isSelf && !memberIsOwner && (
                      <button
                        onClick={() => handleTransfer(m.id, p?.full_name ?? 'ce membre')}
                        disabled={processingId === m.id}
                        className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-[var(--kz-orange)] text-xs transition-colors"
                        title="Transférer la propriété" aria-label="Transférer la propriété"
                      >
                        <Crown size={12} />
                      </button>
                    )}
                    {isOwnerOrAdmin && !isSelf && !memberIsOwner && (
                      <>
                        <button
                          onClick={() => handleChangeRole(m.id, m.role === 'admin' ? 'member' : 'admin')}
                          disabled={processingId === m.id}
                          className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-[var(--kz-violet)] text-xs transition-colors"
                          title={m.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'} aria-label={m.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
                        >
                          <Shield size={12} />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          disabled={processingId === m.id}
                          className="p-1.5 rounded-lg border border-[var(--kz-line)] hover:border-red-400 hover:text-red-500 text-xs transition-colors"
                          title="Retirer" aria-label="Retirer le membre"
                        >
                          <X size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
