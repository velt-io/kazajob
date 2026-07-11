'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Search, BookOpen, Check, X, GitMerge } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { KZ, JOB_SECTORS } from '@/lib/constants'

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

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'orange' | 'cream'> = {
  approved: 'green', pending: 'yellow', rejected: 'orange', merged: 'cream',
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
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1410]">Référentiel compétences</h1>
          <p className="text-sm text-[#6B5A4A] mt-1">
            {skills.length} compétences · catalogue global
            {pendingCount > 0 && <span className="ml-2 font-semibold" style={{ color: KZ.orange }}>· {pendingCount} en attente</span>}
          </p>
        </div>
        <Button
          kind={mergeMode ? 'dark' : 'outline'} size="sm" icon={<GitMerge size={14} />}
          onClick={() => { setMergeMode(v => !v); setMergeSelection([]) }}
        >
          {mergeMode ? 'Annuler fusion' : 'Fusionner deux compétences'}
        </Button>
      </div>

      {mergeMode && (
        <div className="kz-card p-3 mb-4 flex items-center justify-between gap-3" style={{ background: KZ.violetSoft }}>
          <p className="text-xs text-[#1A1410]">
            Sélectionne 2 compétences dans la liste ({mergeSelection.length}/2). La 1ère sera fusionnée dans la 2nde.
          </p>
          <Button kind="primary" size="sm" loading={merging} disabled={mergeSelection.length !== 2} onClick={handleMerge}>
            Fusionner
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Liste */}
        <div className="flex flex-col gap-4">
          {/* Ajouter */}
          <div className="kz-card p-4 bg-white">
            <h2 className="text-sm font-bold text-[#1A1410] mb-3 flex items-center gap-2">
              <Plus size={15} color={KZ.violet} /> Ajouter une compétence
            </h2>
            <div className="flex gap-2 flex-wrap">
              <Input
                label=""
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nom de la compétence"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="flex-1 min-w-[160px]"
              />
              <div className="flex-1 min-w-[140px]">
                <select
                  className="w-full h-full px-3 py-2.5 rounded-xl border-2 border-[#1A1410] text-sm bg-white focus:outline-none focus:border-[#6D3BEB]"
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                >
                  <option value="">Catégorie (optionnel)</option>
                  {JOB_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Button kind="primary" size="md" icon={<Plus size={14} />} loading={adding} onClick={handleAdd}
                disabled={!newName.trim()}>
                Ajouter
              </Button>
            </div>
          </div>

          {/* Onglets statut + recherche + liste */}
          <div className="kz-card bg-white overflow-hidden">
            <div className="p-4 border-b border-[#E8DDC9] flex flex-col gap-3">
              <div className="flex gap-1.5 flex-wrap">
                {STATUS_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setStatusTab(tab.id)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-full border transition-all"
                    style={statusTab === tab.id
                      ? { background: KZ.violet, color: 'white', borderColor: KZ.violet }
                      : { background: KZ.paper, color: '#6B5A4A', borderColor: '#E8DDC9' }}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <Input
                label=""
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une compétence…"
                icon={<Search size={15} />}
              />
            </div>
            {loading ? (
              <div className="p-4 flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-lg bg-[#FBEFE0] animate-pulse" />)}
              </div>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm text-[#6B5A4A] py-8">Aucun résultat.</p>
                ) : (
                  <table className="w-full text-sm min-w-[560px]">
                    <thead className="sticky top-0" style={{ background: KZ.cream2 }}>
                      <tr>
                        {mergeMode && <th className="p-3 w-8" />}
                        <th className="text-left p-3 font-bold text-[#1A1410]">Compétence</th>
                        <th className="text-left p-3 font-bold text-[#1A1410] hidden sm:table-cell">Statut</th>
                        <th className="text-center p-3 font-bold text-[#1A1410]">Utilisations</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(skill => (
                        <tr key={skill.id} className="border-t border-[#E8DDC9] hover:bg-[#FBEFE0] transition-colors">
                          {mergeMode && (
                            <td className="p-3">
                              <input type="checkbox" checked={mergeSelection.includes(skill.id)}
                                onChange={() => toggleMergeSelection(skill.id)}
                                disabled={!mergeSelection.includes(skill.id) && mergeSelection.length >= 2} />
                            </td>
                          )}
                          <td className="p-3 font-semibold text-[#1A1410]">
                            {skill.name}
                            {skill.category && <span className="block text-[10px] font-normal text-[#6B5A4A]">{skill.category}</span>}
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <Badge color={STATUS_COLOR[skill.status] ?? 'cream'} size="sm">{skill.status}</Badge>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xs font-bold" style={{ color: (skill.usage_count ?? 0) > 0 ? KZ.green : KZ.mute }}>
                              {skill.usage_count ?? 0}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {skill.status === 'pending' && (
                                <>
                                  <button onClick={() => handleModerate(skill.id, 'approve')}
                                    className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-green-400 hover:text-green-600 transition-colors"
                                    title="Approuver">
                                    <Check size={13} />
                                  </button>
                                  <button onClick={() => handleModerate(skill.id, 'reject')}
                                    className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-red-400 hover:text-red-500 transition-colors"
                                    title="Rejeter">
                                    <X size={13} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(skill.id, skill.name)}
                                disabled={deletingId === skill.id}
                                className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-red-400 hover:text-red-500 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="flex flex-col gap-4">
          <div className="kz-card p-5 bg-white">
            <h3 className="text-sm font-bold text-[#1A1410] mb-4 flex items-center gap-2">
              <BookOpen size={15} /> Top catégories
            </h3>
            {topCats.length === 0 ? (
              <p className="text-xs text-[#6B5A4A]">Aucune donnée.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topCats.map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#1A1410] truncate">{cat}</span>
                      <span className="text-[#6B5A4A] shrink-0 ml-2">{count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden border border-[#1A1410]" style={{ background: KZ.cream2 }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.round((count / (topCats[0]?.[1] ?? 1)) * 100)}%`,
                        background: KZ.violet,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="kz-card p-5 bg-white">
            <h3 className="text-sm font-bold text-[#1A1410] mb-3">Top 5 compétences</h3>
            <div className="flex flex-col gap-2">
              {skills.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full border border-[#1A1410] text-[10px] font-extrabold flex items-center justify-center shrink-0" style={{ background: KZ.orangeSoft }}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs font-semibold text-[#1A1410] truncate">{s.name}</span>
                  <span className="text-xs text-[#6B5A4A]">{s.usage_count ?? 0}×</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
