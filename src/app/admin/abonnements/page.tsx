'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { TrendingUp, Users, Star, UserMinus } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'
import { ACCENT, CountUp, PageHeader, StatusPill, accentStyle } from '@/components/os/recruiter/primitives'
import { OSR_SELECT } from '@/components/os/recruiter/admin-ui'

interface SubRow {
  id: string
  plan_id: string
  status: string
  trial_ends_at: string | null
  current_period_end: string | null
  seats_used: number
  created_at: string
  company: { name: string; is_verified: boolean } | null
}

const STATUS_ACCENT: Record<string, string> = {
  trial: ACCENT.yellow, active: ACCENT.green, cancelled: ACCENT.red, expired: ACCENT.mute,
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs]   = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/subscriptions')
        if (res.ok) setSubs((await res.json()) as SubRow[])
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [])

  // KPIs
  const mrr = subs
    .filter(s => s.status === 'active')
    .reduce((acc, s) => {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === s.plan_id)
      return acc + (plan?.priceCts ?? 0)
    }, 0)

  const trialing  = subs.filter(s => s.status === 'trial').length
  const actives   = subs.filter(s => s.status === 'active').length
  const cancelled = subs.filter(s => s.status === 'cancelled' || s.status === 'expired').length

  const patchSub = async (subId: string, body: Record<string, string>) => {
    await fetch(`/api/admin/subscriptions/${subId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const handleChangePlan = async (subId: string, newPlanId: string) => {
    await patchSub(subId, { planId: newPlanId })
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, plan_id: newPlanId } : s))
  }

  const handleChangeStatus = async (subId: string, newStatus: string) => {
    await patchSub(subId, { status: newStatus })
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s))
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader eyebrow="Revenus" title="Abonnements" subtitle="Gestion des forfaits entreprises" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'MRR estimé', value: Math.floor(mrr / 100), suffix: ' €', icon: <TrendingUp size={15} />, accent: ACCENT.green },
          { label: 'Essais actifs', value: trialing, icon: <Star size={15} />, accent: ACCENT.yellow },
          { label: 'Abonnés actifs', value: actives, icon: <Users size={15} />, accent: ACCENT.violet },
          { label: 'Résiliés', value: cancelled, icon: <UserMinus size={15} />, accent: ACCENT.red },
        ].map((k, i) => (
          <div key={k.label} className="osr-in osr-glow rounded-[24px] os-glass p-5 min-w-0" style={{ ...accentStyle(k.accent), '--i': i } as CSSProperties}>
            <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white" style={{ background: k.accent }}>{k.icon}</span>
            <div className="text-[30px] font-semibold tracking-[-0.05em] text-white mt-3 leading-none">
              <CountUp value={k.value} format={(n) => `${Math.round(n).toLocaleString('fr-FR')}${k.suffix ?? ''}`} />
            </div>
            <div className="text-[13px] text-[var(--kz-mute)] mt-1.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="osr-table-wrap">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 uppercase">Entreprise</th>
              <th className="text-left px-4 py-3 uppercase">Forfait</th>
              <th className="text-center px-4 py-3 uppercase">Statut</th>
              <th className="text-center px-4 py-3 uppercase">Sièges</th>
              <th className="text-left px-4 py-3 uppercase">Échéance</th>
              <th className="text-left px-4 py-3 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4"><div className="osr-skel h-10" /></td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-[var(--kz-mute)]">Aucun abonnement.</td></tr>
            ) : subs.map(sub => {
              const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub.plan_id)
              const co = sub.company
              const expiry = sub.status === 'trial' ? sub.trial_ends_at : sub.current_period_end
              return (
                <tr key={sub.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-white">{co?.name ?? '—'}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      className={OSR_SELECT}
                      aria-label={`Forfait de ${co?.name ?? 'l’entreprise'}`}
                      value={sub.plan_id}
                      onChange={e => handleChangePlan(sub.id, e.target.value)}
                    >
                      {SUBSCRIPTION_PLANS.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {Math.floor(p.priceCts / 100)}€</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <StatusPill accent={STATUS_ACCENT[sub.status] ?? ACCENT.mute} live={sub.status === 'active'}>
                      {sub.status === 'trial' ? 'Essai' : sub.status === 'active' ? 'Actif' : sub.status === 'cancelled' ? 'Résilié' : 'Expiré'}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-2.5 text-center text-[12px] font-semibold text-white">
                    {sub.seats_used}/{plan?.maxMembers ?? '?'}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-[var(--kz-mute)]">
                    {expiry ? new Date(expiry).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      className={OSR_SELECT}
                      aria-label={`Statut de ${co?.name ?? 'l’abonnement'}`}
                      value={sub.status}
                      onChange={e => handleChangeStatus(sub.id, e.target.value)}
                    >
                      <option value="trial">Essai</option>
                      <option value="active">Activer</option>
                      <option value="cancelled">Résilier</option>
                      <option value="expired">Expirer</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
