'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Trash2, MapPin, BookOpen, Feather } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { Tooltip } from '@/components/ui/radix'
import { TALENT_POOL_CATEGORIES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { QuestHeader, toneStyle } from '@/components/quest/recruteur/QuestChrome'
import { HeroPortrait, RarityTag } from '@/components/quest/recruteur/HeroPortrait'
import { POOL_RARITY, RARITY_TONE } from '@/components/quest/recruteur/hero'

interface Entry {
  id: string
  category: string
  note: string | null
  created_at: string
  candidate: { id: string; full_name: string; avatar_url: string | null; avatar_config: Record<string, unknown> | null; location: string | null; bio: string | null }
}

type CatFilter = 'all' | (typeof TALENT_POOL_CATEGORIES)[number]['id']

export default function TalentPoolPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState<CatFilter>('all')

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

  const shownCats = TALENT_POOL_CATEGORIES.filter((c) => cat === 'all' || c.id === cat)

  return (
    <div className="max-w-[1200px] mx-auto">
      <QuestHeader
        eyebrow="Vivier de talents"
        icon={<BookOpen size={18} />}
        tone="var(--qx-cyan)"
        title={<>Le registre des <span className="qx-text-arcane">héros</span></>}
        subtitle={`${entries.length} profil(s) sauvegardé(s) · la rareté reflète la catégorie que vous leur avez donnée.`}
      />

      {loading ? <PageLoader /> : entries.length === 0 ? (
        <div className="qx-panel">
          <EmptyState
            title="Votre vivier est vide"
            description="Sauvegardez des profils intéressants depuis vos candidatures pour les retrouver ici, classés par catégorie."
            icon={<Star size={28} />}
          />
        </div>
      ) : (
        <>
          <div className="qxr-tabs mb-5" role="group" aria-label="Filtrer par catégorie">
            <button type="button" className="qxr-tab" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
              Tous <span className="qxr-tab-count">{entries.length}</span>
            </button>
            {TALENT_POOL_CATEGORIES.map((c) => {
              const n = entries.filter((e) => e.category === c.id).length
              return (
                <button key={c.id} type="button" className="qxr-tab" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                  <span className="qxr-column-gem" style={toneStyle(RARITY_TONE[POOL_RARITY[c.id]])} aria-hidden />
                  {c.label} <span className="qxr-tab-count">{n}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-8">
            {shownCats.map((c) => {
              const list = entries.filter((e) => e.category === c.id)
              if (list.length === 0) {
                return cat === 'all' ? null : (
                  <p key={c.id} className="text-sm text-[var(--kz-mute)] text-center py-10">Aucun héros dans cette catégorie.</p>
                )
              }
              const rarity = POOL_RARITY[c.id] ?? 'commune'
              return (
                <section key={c.id} aria-labelledby={`cat-${c.id}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <RarityTag rarity={rarity} label={c.label} />
                    <h2 id={`cat-${c.id}`} className="sr-only">{c.label}</h2>
                    <span className="text-xs text-[var(--kz-mute)] tabular-nums">{list.length}</span>
                    <span aria-hidden className="flex-1 h-px" style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${RARITY_TONE[rarity]} 45%, transparent), transparent)` }} />
                  </div>
                  <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {list.map((e, i) => {
                      const cnd = e.candidate
                      const r = POOL_RARITY[e.category] ?? 'commune'
                      return (
                        <div key={e.id} className="qx-rise flex" style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}>
                        <article data-tilt className="qxr-hero p-4 flex flex-col w-full" style={toneStyle(RARITY_TONE[r])}>
                          <div className="flex items-center justify-between mb-3">
                            <RarityTag rarity={r} />
                            <Tooltip content="Retirer du vivier">
                              <button onClick={() => remove(cnd.id)} className="qxr-icon-btn" data-danger aria-label={`Retirer ${cnd.full_name} du vivier`}>
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </div>

                          <div className="flex justify-center mb-3">
                            <HeroPortrait name={cnd.full_name ?? 'CA'} src={cnd.avatar_url} avatarConfig={cnd.avatar_config} size={84} rarity={r} />
                          </div>
                          <div className="text-center">
                            <Link href={`/recruteur/candidats/${cnd.id}`}
                              className="text-[15px] font-bold text-white hover:text-[var(--qx-magenta)] transition-colors focus-visible:outline-none focus-visible:underline">
                              {cnd.full_name}
                            </Link>
                            {cnd.location && <div className="text-[11.5px] text-[var(--qx-cyan)] flex items-center justify-center gap-1 mt-0.5"><MapPin size={11} aria-hidden />{cnd.location}</div>}
                          </div>

                          {cnd.bio && <p className="text-[12px] text-[var(--kz-text)] mt-3 line-clamp-2 text-center">{cnd.bio}</p>}
                          {e.note && (
                            <p className="text-[12px] text-[var(--kz-mute)] mt-3 italic flex gap-1.5 rounded-lg border border-[#C084FC]/15 bg-[rgba(12,5,24,0.45)] p-2">
                              <Feather size={12} className="shrink-0 mt-0.5 text-[var(--qx-gold)]" aria-hidden />
                              <span className="line-clamp-3">« {e.note} »</span>
                            </p>
                          )}

                          <div className="mt-auto pt-3">
                            <div className="pt-3 border-t border-[#C084FC]/15 flex items-center gap-2">
                              <select value={e.category} onChange={(ev) => changeCategory(cnd.id, ev.target.value)}
                                aria-label={`Catégorie de ${cnd.full_name}`} className="qxr-select flex-1">
                                {TALENT_POOL_CATEGORIES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                              </select>
                            </div>
                            <p className="text-[10.5px] text-[var(--kz-mute)] mt-2 text-center">Au registre · {timeAgo(e.created_at)}</p>
                          </div>
                        </article>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
