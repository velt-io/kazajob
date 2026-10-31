'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, BookOpen, Check, X, GitMerge } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { JOB_SECTORS } from '@/lib/constants'
import { ACCENT, IconButton, PageHeader, SearchField, Segmented, SkeletonList, StatusPill, Widget, tint } from '@/components/os/recruiter/primitives'
import { OSR_FIELD } from '@/components/os/recruiter/admin-ui'

interface Skill {
  id: string
  name: string
  category: string | null
  usage_count?: number
  status: string
  source: string
}

const STATUS_TABS = [
  { id: 'all',      label: 'Toutes' },
  { id: 'pending',  label: 'En attente' },
  { id: 'approved', label: 'Approuvées' },
  { id: 'rejected', label: 'Rejetées' },
  { id: 'merged',   label: 'Fusionnées' },
]

const STATUS_ACCENT: Record<string, string> = {
  approved: ACCENT.green, pending: ACCENT.yellow, rejected: ACCENT.red, merged: ACCENT.mute,
}
const STATUS_LABEL: Record<string, string> = {
  approved: 'Approuvée', pending: 'En attente', rejected: 'Rejetée', merged: 'Fusionnée', archived: 'Archivée',
}

export default function AdminSkillsPage() {
  const [skills, setSkills]       = useState<Skill[]>([])
  const [filtered, setFiltered]   = useState<Skill[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [newName, setNewName]     = useState('')
  const [newCat, setNewCat]       = useState('')
  const [adding, setAdding]       = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mergeMode, setMergeMode] = useState(false)
  const [mergeSelection, setMergeSelection] = useState<string[]>([])
  const [merging, setMerging]     = useState(false)

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/admin/skills')
      const enriched = res.ok ? ((await res.json()) as Skill[]) : []
      enriched.sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0))
      setSkills(enriched)
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchSkills() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    let list = statusTab === 'all' ? skills : skills.filter(s => s.status === statusTab)
    if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || (s.category ?? '').toLowerCase().includes(q))
    setFiltered(list)
  }, [search, skills, statusTab])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch('/api/admin/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), category: newCat.trim() || null }),
    })
    if (res.ok) { setNewName(''); setNewCat(''); await fetchSkills() }
    setAdding(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer la compétence "${name}" ? Cela la retirera de tous les profils candidats.`)) return
    setDeletingId(id)
    await fetch(`/api/admin/skills/${id}`, { method: 'DELETE' })
    await fetchSkills()
    setDeletingId(null)
  }

  const handleModerate = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !confirm('Rejeter cette compétence proposée ?')) return
    await fetch(`/api/admin/skills/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await fetchSkills()
  }

  const toggleMergeSelection = (id: string) => {
    setMergeSelection(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
    )
  }

  const handleMerge = async () => {
    if (mergeSelection.length !== 2) return
    const [sourceId, targetId] = mergeSelection
    const source = skills.find(s => s.id === sourceId)
    const target = skills.find(s => s.id === targetId)
    if (!confirm(`Fusionner « ${source?.name} » dans « ${target?.name} » ? Toutes les relations seront déplacées vers « ${target?.name} ».`)) return
    setMerging(true)
    await fetch('/api/admin/skills/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId, targetId }),
    })
    setMerging(false)
    setMergeMode(false)
    setMergeSelection([])
    await fetchSkills()
  }

  const categoryStats = skills.reduce<Record<string, number>>((acc, s) => {
    const cat = s.category ?? 'Autre'
    acc[cat] = (acc[cat] ?? 0) + 1
    return acc
  }, {})
  const topCats = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const pendingCount = skills.filter(s => s.status === 'pending').length

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader
        eyebrow="Catalogue global"
        title="Compétences"
        subtitle={<>
          {skills.length} compétences
          {pendingCount > 0 && <span className="font-semibold text-[var(--kz-orange)]"> · {pendingCount} en attente</span>}
        </>}
        actions={
          <Button
            kind={mergeMode ? 'dark' : 'outline'} size="md" icon={<GitMerge size={14} />}
            onClick={() => { setMergeMode(v => !v); setMergeSelection([]) }}
          >
            {mergeMode ? 'Annuler fusion' : 'Fusionner deux compétences'}
          </Button>
        }
      />

      {mergeMode && (
        <div className="os-pop rounded-[18px] p-3 pl-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: tint(ACCENT.violet, 12), border: '1px solid color-mix(in srgb, var(--kz-violet) 40%, transparent)' }}>
          <p className="text-[13px] text-white flex items-center gap-2">
            <GitMerge size={15} className="text-[var(--kz-violet)] shrink-0" />
            Sélectionne 2 compétences dans la liste ({mergeSelection.length}/2). La 1ère sera fusionnée dans la 2nde.
          </p>
          <Button kind="primary" size="sm" loading={merging} disabled={mergeSelection.length !== 2} onClick={handleMerge}>
            Fusionner
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Liste */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Ajouter */}
          <Widget title="Ajouter une compétence" icon={<Plus size={14} />} accent={ACCENT.violet}>
            <div className="flex gap-2 flex-wrap">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nom de la compétence"
                aria-label="Nom de la compétence"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className={`flex-1 min-w-[160px] ${OSR_FIELD}`}
              />
              <select
                className={`flex-1 min-w-[140px] cursor-pointer [&>option]:bg-[#1C1C22] ${OSR_FIELD}`}
                aria-label="Catégorie"
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
              >
                <option value="">Catégorie (optionnel)</option>
                {JOB_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button kind="primary" size="md" icon={<Plus size={14} />} loading={adding} onClick={handleAdd}
                disabled={!newName.trim()} className="!h-10">
                Ajouter
              </Button>
            </div>
          </Widget>

          {/* Onglets statut + recherche + liste */}
          <div className="osr-panel overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-[var(--osr-hair)] flex flex-col gap-3">
              <Segmented ariaLabel="Filtrer par statut" value={statusTab} onChange={setStatusTab}
                items={STATUS_TABS.map(tab => ({ id: tab.id, label: tab.label }))} />
              <SearchField value={search} onChange={setSearch} placeholder="Rechercher une compétence…" />
            </div>
            {loading ? (
              <SkeletonList rows={5} height={40} className="p-4" />
            ) : (
              <div className="max-h-[520px] overflow-auto">
                {filtered.length === 0 ? (
                  <p className="text-center text-[13px] text-[var(--kz-mute)] py-10">Aucun résultat.</p>
                ) : (
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr>
                        {mergeMode && <th className="px-3 py-2.5 w-8"><span className="sr-only">Sélection</span></th>}
                        <th className="text-left px-3 py-2.5 uppercase">Compétence</th>
                        <th className="text-left px-3 py-2.5 uppercase hidden sm:table-cell">Statut</th>
                        <th className="text-center px-3 py-2.5 uppercase">Utilisations</th>
                        <th className="px-3 py-2.5"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(skill => {
                        const picked = mergeSelection.includes(skill.id)
                        return (
                          <tr key={skill.id} style={picked ? { background: tint(ACCENT.violet, 14) } : undefined}>
                            {mergeMode && (
                              <td className="px-3 py-2">
                                <input type="checkbox" checked={picked}
                                  aria-label={`Sélectionner ${skill.name}`}
                                  className="w-4 h-4 accent-[var(--kz-violet)]"
                                  onChange={() => toggleMergeSelection(skill.id)}
                                  disabled={!picked && mergeSelection.length >= 2} />
                              </td>
                            )}
                            <td className="px-3 py-2 font-semibold text-white">
                              {skill.name}
                              {skill.category && <span className="block text-[11px] font-normal text-[var(--kz-mute)]">{skill.category}</span>}
                            </td>
                            <td className="px-3 py-2 hidden sm:table-cell">
                              <StatusPill accent={STATUS_ACCENT[skill.status] ?? ACCENT.mute}>{STATUS_LABEL[skill.status] ?? skill.status}</StatusPill>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className="text-[12px] font-semibold tabular-nums" style={{ color: (skill.usage_count ?? 0) > 0 ? 'var(--kz-green)' : 'var(--kz-mute)' }}>
                                {skill.usage_count ?? 0}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                {skill.status === 'pending' && (
                                  <>
                                    <IconButton label="Approuver" onClick={() => handleModerate(skill.id, 'approve')} className="hover:!text-[var(--kz-green)]">
                                      <Check size={14} />
                                    </IconButton>
                                    <IconButton label="Rejeter" tone="danger" onClick={() => handleModerate(skill.id, 'reject')}>
                                      <X size={14} />
                                    </IconButton>
                                  </>
                                )}
                                <IconButton label="Supprimer" tone="danger" onClick={() => handleDelete(skill.id, skill.name)} disabled={deletingId === skill.id}>
                                  <Trash2 size={14} />
                                </IconButton>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="flex flex-col gap-4 min-w-0">
          <Widget title="Top catégories" icon={<BookOpen size={14} />} accent={ACCENT.indigo}>
            {topCats.length === 0 ? (
              <p className="text-[13px] text-[var(--kz-mute)]">Aucune donnée.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topCats.map(([cat, count], i) => (
                  <div key={cat}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="text-white font-medium truncate">{cat}</span>
                      <span className="text-[var(--kz-mute)] shrink-0 ml-2 tabular-nums">{count}</span>
                    </div>
                    <div className="osr-bar !h-1.5" style={{ '--i': i } as React.CSSProperties}>
                      <span style={{
                        width: `${Math.round((count / (topCats[0]?.[1] ?? 1)) * 100)}%`,
                        background: 'linear-gradient(90deg, var(--osr-indigo), var(--kz-violet))',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Widget>

          <Widget title="Top 5 compétences" bodyClassName="px-3 pb-3">
            <div className="flex flex-col">
              {skills.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2.5 px-2 py-2 rounded-[12px] hover:bg-[var(--osr-fill-2)] transition-colors">
                  <span className="w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0 tabular-nums"
                    style={i === 0
                      ? { background: 'var(--os-aurora)', color: 'white' }
                      : { background: 'var(--osr-fill-3)', color: 'var(--kz-text)' }}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-white truncate">{s.name}</span>
                  <span className="text-[12px] text-[var(--kz-mute)] tabular-nums">{s.usage_count ?? 0}×</span>
                </div>
              ))}
            </div>
          </Widget>
        </div>
      </div>
    </div>
  )
}
