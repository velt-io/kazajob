'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Trash2, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import type { BadgeColor } from '@/lib/types'
import { KZ, TALENT_POOL_CATEGORIES } from '@/lib/constants'

interface Entry {
  id: string
  category: string
  note: string | null
  created_at: string
  candidate: { id: string; full_name: string; avatar_url: string | null; avatar_config: Record<string, unknown> | null; location: string | null; bio: string | null }
}

const CAT_MAP = Object.fromEntries(TALENT_POOL_CATEGORIES.map((c) => [c.id, c]))

export default function TalentPoolPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await fetch('/api/recruiter/talent-pool')
      if (res.ok) setEntries((await res.json()) as Entry[])
    } catch { /* noop */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const changeCategory = async (candidateId: string, category: string) => {
    setEntries((prev) => prev.map((e) => e.candidate.id === candidateId ? { ...e, category } : e))
    await fetch('/api/recruiter/talent-pool', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId, category }),
    })
  }

  const remove = async (candidateId: string) => {
    if (!confirm('Retirer ce profil du vivier ?')) return
    setEntries((prev) => prev.filter((e) => e.candidate.id !== candidateId))
    await fetch(`/api/recruiter/talent-pool/${candidateId}`, { method: 'DELETE' })
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6">
        <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Recrutement</p>
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[var(--kz-ink)]">Vivier de talents</h1>
        <p className="text-sm text-[var(--kz-mute)] mt-1">{entries.length} profil(s) sauvegardé(s)</p>
      </div>

      {loading ? <PageLoader /> : entries.length === 0 ? (
        <EmptyState
          title="Votre vivier est vide"
          description="Sauvegardez des profils intéressants depuis vos candidatures pour les retrouver ici, classés par catégorie."
          icon={<Star size={28} />}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {TALENT_POOL_CATEGORIES.map((cat) => {
            const list = entries.filter((e) => e.category === cat.id)
            if (list.length === 0) return null
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge color={cat.color as BadgeColor} size="md">{cat.label}</Badge>
                  <span className="text-xs text-[var(--kz-mute)]">{list.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {list.map((e) => {
                    const c = e.candidate
                    return (
                      <div key={e.id} className="kz-card p-4 bg-[var(--kz-paper)] flex items-start gap-3">
                        <Avatar name={c.full_name ?? 'CA'} src={c.avatar_url} avatarConfig={c.avatar_config} size={44} color={KZ.orangeSoft} />
                        <div className="flex-1 min-w-0">
                          <Link href={`/recruiter/candidates/${c.id}`} className="text-sm font-bold text-[var(--kz-ink)] hover:underline">{c.full_name}</Link>
                          {c.location && <div className="text-xs text-[var(--kz-mute)] flex items-center gap-1 mt-0.5"><MapPin size={11} />{c.location}</div>}
                          {e.note && <p className="text-xs text-[var(--kz-mute)] mt-1 line-clamp-2 italic">« {e.note} »</p>}
                          <select value={e.category} onChange={(ev) => changeCategory(c.id, ev.target.value)}
                            className="mt-2 text-xs font-semibold h-8 px-2 border border-[var(--kz-edge)] rounded-lg bg-[var(--kz-paper)] cursor-pointer">
                            {TALENT_POOL_CATEGORIES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                          </select>
                        </div>
                        <button onClick={() => remove(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[var(--kz-mute)] hover:text-red-600 shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
