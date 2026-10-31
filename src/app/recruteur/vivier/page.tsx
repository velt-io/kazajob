'use client'

import { useEffect, useState, startTransition, ViewTransition } from 'react'
import Link from 'next/link'
import { Star, Trash2, MapPin, ChevronDown, Check, Quote, LayoutGrid, Rows3 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from '@/components/ui/radix'
import { TALENT_POOL_CATEGORIES } from '@/lib/constants'
import { island } from '@/lib/island'
import {
  BADGE_ACCENT, EmptyPanel, IconButton, PageHeader, SearchField, Segmented, accentStyle, tint,
} from '@/components/os/recruiter/primitives'

interface Entry {
  id: string
  category: string
  note: string | null
  created_at: string
  candidate: { id: string; full_name: string; avatar_url: string | null; avatar_config: Record<string, unknown> | null; location: string | null; bio: string | null }
}

const CAT_MAP = Object.fromEntries(TALENT_POOL_CATEGORIES.map((c) => [c.id, c]))
const catAccent = (id: string) => BADGE_ACCENT[CAT_MAP[id]?.color ?? 'cream']

export default function TalentPoolPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  // Présentation uniquement
  const [cat, setCat] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [layout, setLayout] = useState<'grid' | 'rows'>('grid')

  const load = async () => {
    try {
      const res = await fetch('/api/recruiter/talent-pool')
      if (res.ok) setEntries((await res.json()) as Entry[])
    } catch { /* noop */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const changeCategory = async (candidateId: string, category: string) => {
    // Transition : la carte glisse vers son nouveau groupe
    startTransition(() => {
      setEntries((prev) => prev.map((e) => e.candidate.id === candidateId ? { ...e, category } : e))
    })
    island({ title: CAT_MAP[category]?.label ?? 'Catégorie modifiée', subtitle: 'Vivier mis à jour', tone: 'success' })
    await fetch('/api/recruiter/talent-pool', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId, category }),
    })
  }

  const remove = async (candidateId: string) => {
    if (!confirm('Retirer ce profil du vivier ?')) return
    startTransition(() => {
      setEntries((prev) => prev.filter((e) => e.candidate.id !== candidateId))
    })
    await fetch(`/api/recruiter/talent-pool/${candidateId}`, { method: 'DELETE' })
  }

  const q = query.trim().toLowerCase()
  const matches = (e: Entry) => !q || `${e.candidate.full_name ?? ''} ${e.candidate.location ?? ''} ${e.note ?? ''}`.toLowerCase().includes(q)
  const groups = TALENT_POOL_CATEGORIES
    .filter((c) => cat === 'all' || c.id === cat)
    .map((c) => ({ cat: c, list: entries.filter((e) => e.category === c.id && matches(e)) }))
    .filter((g) => g.list.length > 0)

  return (
    <div className="max-w-[1180px] mx-auto">
      <PageHeader
        eyebrow="Recrutement"
        title="Vivier de talents"
        subtitle={<><span className="text-white font-medium tabular-nums">{entries.length}</span> profil(s) sauvegardé(s)</>}
        actions={!loading && entries.length > 0 ? (
          <Segmented ariaLabel="Disposition" value={layout} onChange={setLayout} items={[
            { id: 'grid', label: <span className="sr-only sm:not-sr-only">Grille</span>, icon: <LayoutGrid size={14} /> },
            { id: 'rows', label: <span className="sr-only sm:not-sr-only">Liste</span>, icon: <Rows3 size={14} /> },
          ]} />
        ) : undefined}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="osr-skel h-[168px]" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="os-glass rounded-[28px]">
          <EmptyPanel
            icon={<Star size={28} />}
            accent="var(--kz-yellow)"
            title="Votre vivier est vide"
            description="Sauvegardez des profils intéressants depuis vos candidatures pour les retrouver ici, classés par catégorie."
            action={<Link href="/recruteur/candidatures" className="inline-flex items-center h-10 px-5 rounded-full text-[14px] font-semibold text-black bg-white hover:bg-white/90">Voir les candidatures</Link>}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-2.5 mb-6">
            <Segmented ariaLabel="Catégorie" value={cat} onChange={setCat} items={[
              { id: 'all', label: 'Tous', count: entries.length },
              ...TALENT_POOL_CATEGORIES.map((c) => ({
                id: c.id as string,
                label: <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: BADGE_ACCENT[c.color] }} />{c.label}</span>,
                count: entries.filter((e) => e.category === c.id).length,
              })),
            ]} />
            <SearchField value={query} onChange={setQuery} placeholder="Nom, ville, note…" className="lg:ml-auto lg:w-[280px]" />
          </div>

          {groups.length === 0 ? (
            <p className="text-[14px] text-[var(--kz-mute)] text-center py-12">Aucun profil ne correspond.</p>
          ) : (
            <div className="flex flex-col gap-9">
              {groups.map(({ cat: c, list }) => {
                const accent = BADGE_ACCENT[c.color]
                return (
                  <div key={c.id} role="region" aria-label={c.label}>
                    <div className="flex items-center gap-2.5 mb-3 px-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
                      <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-white">{c.label}</h2>
                      <span className="text-[13px] text-[var(--kz-mute)] tabular-nums">{list.length}</span>
                    </div>
                    <div className={layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'os-glass rounded-[24px] p-1.5 osr-sep'}>
                      {list.map((e, i) => (
                        <ViewTransition key={e.id} name={`osr-pool-${e.id}`} share="osr-move" update="osr-move" exit="osr-out" enter="none" default="none">
                          <div className="osr-in min-w-0" style={{ ['--i' as string]: i }}>
                            {layout === 'grid'
                              ? <PoolCard e={e} onCategory={changeCategory} onRemove={remove} />
                              : <PoolRow e={e} onCategory={changeCategory} onRemove={remove} />}
                          </div>
                        </ViewTransition>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CategoryMenu({ e, onCategory }: { e: Entry; onCategory: (id: string, cat: string) => void }) {
  const current = CAT_MAP[e.category]
  const accent = catAccent(e.category)
  return (
    <Menu>
      <MenuTrigger asChild>
        <button type="button" aria-label={`Catégorie : ${current?.label ?? e.category}. Modifier`}
          className="osr-pill !h-7 !pr-2 cursor-pointer hover:brightness-125 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--kz-blue)_40%,transparent)]"
          style={accentStyle(accent)}>
          {current?.label ?? e.category}<ChevronDown size={12} />
        </button>
      </MenuTrigger>
      <MenuContent align="start">
        <MenuLabel className="osr-eyebrow !text-[10px]">Classer dans</MenuLabel>
        {TALENT_POOL_CATEGORIES.map((o) => (
          <MenuItem key={o.id} onSelect={() => { if (o.id !== e.category) onCategory(e.candidate.id, o.id) }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: BADGE_ACCENT[o.color] }} />
            <span className="flex-1">{o.label}</span>
            {o.id === e.category && <Check size={14} />}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

function PoolCard({ e, onCategory, onRemove }: { e: Entry; onCategory: (id: string, cat: string) => void; onRemove: (id: string) => void }) {
  const c = e.candidate
  const accent = catAccent(e.category)
  return (
    <div className="osr-kcard h-full p-4 flex flex-col gap-3" style={accentStyle(accent)}>
      <div className="flex items-start gap-3">
        <span className="rounded-full p-[2px] shrink-0" style={{ background: `conic-gradient(from 210deg, ${accent}, ${tint(accent, 20)}, ${accent})` }}>
          <span className="block rounded-full p-[2px] bg-[var(--kz-inverse)]">
            <Avatar name={c.full_name ?? 'CA'} src={c.avatar_url} avatarConfig={c.avatar_config} size={48} color={tint(accent, 25)} />
          </span>
        </span>
        <div className="flex-1 min-w-0 pt-0.5">
          <Link href={`/recruteur/candidats/${c.id}`} className="block text-[15px] font-semibold text-white truncate hover:underline underline-offset-2">{c.full_name}</Link>
          {c.location && <div className="text-[12px] text-[var(--kz-mute)] flex items-center gap-1 mt-0.5 truncate"><MapPin size={11} className="shrink-0" />{c.location}</div>}
        </div>
        <div className="osr-reveal">
          <IconButton label="Retirer du vivier" tone="danger" onClick={() => onRemove(c.id)}><Trash2 size={15} /></IconButton>
        </div>
      </div>
      {e.note ? (
        <p className="relative text-[13px] text-[var(--kz-text)] leading-relaxed line-clamp-3 pl-5">
          <Quote size={12} className="absolute left-0 top-1 text-[var(--kz-mute)]" aria-hidden />{e.note}
        </p>
      ) : c.bio ? (
        <p className="text-[13px] text-[var(--kz-mute)] leading-relaxed line-clamp-2">{c.bio}</p>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <CategoryMenu e={e} onCategory={onCategory} />
        <span className="text-[11px] text-[var(--kz-mute)] tabular-nums">{new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}

function PoolRow({ e, onCategory, onRemove }: { e: Entry; onCategory: (id: string, cat: string) => void; onRemove: (id: string) => void }) {
  const c = e.candidate
  const accent = catAccent(e.category)
  return (
    <div className="osr-row flex items-center gap-3 px-3 py-2.5">
      <Avatar name={c.full_name ?? 'CA'} src={c.avatar_url} avatarConfig={c.avatar_config} size={38} color={tint(accent, 25)} />
      <div className="flex-1 min-w-0">
        <Link href={`/recruteur/candidats/${c.id}`} className="block text-[14px] font-semibold text-white truncate hover:underline underline-offset-2">{c.full_name}</Link>
        <div className="text-[12px] text-[var(--kz-mute)] truncate">
          {[c.location, e.note && `« ${e.note} »`].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
      <CategoryMenu e={e} onCategory={onCategory} />
      <IconButton label="Retirer du vivier" tone="danger" onClick={() => onRemove(c.id)}><Trash2 size={15} /></IconButton>
    </div>
  )
}
