'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Plus, Building2 } from 'lucide-react'
import { KZ } from '@/lib/constants'
import type { Membership } from '@/lib/types'

const ROLE_LABEL: Record<string, string> = { owner: 'Propriétaire', admin: 'Admin', member: 'Recruteur' }

export function CompanySwitcher() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/recruiter/memberships')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setMemberships(d as Membership[]))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const active = memberships.find((m) => m.is_active) ?? memberships[0]

  const switchTo = async (companyId: string) => {
    if (switching) return
    setSwitching(true)
    const res = await fetch('/api/recruiter/active-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    })
    if (res.ok) window.location.reload()
    else setSwitching(false)
  }

  if (memberships.length === 0) {
    return (
      <a
        href="/recruteur/creation-entreprise"
        className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--kz-line)] text-xs font-bold text-[var(--kz-ink)]"
        style={{ background: KZ.cream2 }}
      >
        <Plus size={15} /> Créer / rejoindre une entreprise
      </a>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => memberships.length > 1 && setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 p-3 rounded-xl border border-[var(--kz-line)]"
        style={{ background: KZ.cream2, cursor: memberships.length > 1 ? 'pointer' : 'default' }}
      >
        {active?.logo_url ? (
          <img src={active.logo_url} alt="" className="w-8 h-8 rounded-lg border border-[var(--kz-edge)] object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-lg border border-[var(--kz-edge)] flex items-center justify-center text-[11px] font-extrabold shrink-0"
            style={{ background: KZ.orangeSoft }}>
            {active?.company_name.slice(0, 2).toUpperCase() ?? <Building2 size={14} />}
          </div>
        )}
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-xs font-bold text-[var(--kz-ink)] truncate">{active?.company_name}</span>
          <span className="block text-[10px] text-[var(--kz-mute)]">{ROLE_LABEL[active?.role ?? 'member']}</span>
        </span>
        {memberships.length > 1 && <ChevronDown size={14} className="text-[var(--kz-mute)] shrink-0" />}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-[var(--kz-edge)] bg-[var(--kz-paper)] overflow-hidden z-50"
          style={{ boxShadow: '3px 3px 0 var(--kz-shadow)' }}>
          <div className="max-h-64 overflow-y-auto">
            {memberships.map((m) => (
              <button
                key={m.company_id}
                type="button"
                onClick={() => (m.is_active ? setOpen(false) : switchTo(m.company_id))}
                disabled={switching}
                className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-[var(--kz-cream2)] transition-colors border-b border-[var(--kz-line)] last:border-0"
              >
                <div className="w-7 h-7 rounded-lg border border-[var(--kz-edge)] flex items-center justify-center text-[10px] font-extrabold shrink-0"
                  style={{ background: m.is_active ? KZ.violetSoft : KZ.cream2 }}>
                  {m.company_name.slice(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-[var(--kz-ink)] truncate">{m.company_name}</span>
                  <span className="block text-[10px] text-[var(--kz-mute)]">{ROLE_LABEL[m.role]}</span>
                </span>
                {m.is_active && <Check size={14} style={{ color: KZ.green }} className="shrink-0" />}
              </button>
            ))}
          </div>
          <a href="/recruteur/creation-entreprise"
            className="flex items-center gap-2 p-3 text-xs font-bold text-[var(--kz-ink)] hover:bg-[var(--kz-cream2)] transition-colors border-t border-[var(--kz-edge)]"
            style={{ background: KZ.cream2 }}>
            <Plus size={14} /> Créer / rejoindre une entreprise
          </a>
        </div>
      )}
    </div>
  )
}
