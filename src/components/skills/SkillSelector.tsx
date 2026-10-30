'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { KZ } from '@/lib/constants'
import type { Skill } from '@/lib/types'

interface SkillSelectorProps {
  selected: Skill[]
  onAdd: (skill: Skill) => void
  onRemove: (id: string) => void
  allowCreate?: boolean
  placeholder?: string
}

type ProposeResponse =
  | { status: 'matched'; skill: Skill }
  | { status: 'suggestions'; suggestions: Skill[] }
  | { status: 'created'; skill: Skill }

export function SkillSelector({ selected, onAdd, onRemove, allowCreate = true, placeholder = 'Rechercher une compétence...' }: SkillSelectorProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Skill[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [suggestions, setSuggestions] = useState<Skill[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/skills?q=${encodeURIComponent(query.trim())}`)
      const data = res.ok ? ((await res.json()) as Skill[]) : []
      setResults(data.filter((s) => !selected.some((sel) => sel.id === s.id)))
      setSearching(false)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selected])

  const selectSkill = (skill: Skill) => {
    onAdd(skill)
    setQuery('')
    setResults([])
    setOpen(false)
    setSuggestions([])
    setNotice(null)
  }

  const handlePropose = async () => {
    if (!query.trim()) return
    setProposing(true)
    setNotice(null)
    setSuggestions([])
    const res = await fetch('/api/skills/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: query.trim() }),
    })
    const data = (res.ok ? await res.json() : null) as ProposeResponse | null
    setProposing(false)

    if (!data) { setNotice('Erreur lors de la proposition.'); return }
    if (data.status === 'matched') {
      selectSkill(data.skill)
      setNotice(`« ${data.skill.name} » existait déjà — sélectionnée.`)
      return
    }
    if (data.status === 'suggestions') {
      setSuggestions(data.suggestions)
      return
    }
    selectSkill(data.skill)
    setNotice(`« ${data.skill.name} » proposée — en attente de validation.`)
  }

  const noExactResult = query.trim().length >= 2 && !searching && results.length === 0 && suggestions.length === 0

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSuggestions([]); setNotice(null) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
        />

        {open && query.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 z-20 bg-[var(--kz-paper)] border border-[var(--kz-edge)] rounded-lg shadow-[3px_3px_0_var(--kz-shadow)] mt-1 max-h-56 overflow-y-auto">
            {results.map((s) => (
              <button key={s.id} type="button" onClick={() => selectSkill(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--kz-cream2)] text-sm">
                <span className="font-semibold text-[var(--kz-ink)]">{s.name}</span>
                {s.category && <span className="text-xs text-[var(--kz-mute)]">{s.category}</span>}
              </button>
            ))}

            {suggestions.length > 0 && (
              <div className="p-2 border-t border-[var(--kz-line)]">
                <p className="text-xs text-[var(--kz-mute)] mb-1.5">Compétence(s) proche(s) existante(s) :</p>
                {suggestions.map((s) => (
                  <button key={s.id} type="button" onClick={() => selectSkill(s)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--kz-cream2)] text-sm font-semibold text-[var(--kz-ink)]">
                    Utiliser « {s.name} »
                  </button>
                ))}
              </div>
            )}

            {allowCreate && noExactResult && (
              <button type="button" onClick={handlePropose} disabled={proposing}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--kz-cream2)] text-sm font-semibold border-t border-[var(--kz-line)]"
                style={{ color: KZ.violet }}>
                <Plus size={14} />
                {proposing ? 'Envoi...' : `Proposer « ${query.trim()} »`}
              </button>
            )}

            {!allowCreate && noExactResult && (
              <p className="px-3 py-2.5 text-xs text-[var(--kz-mute)]">Aucune compétence trouvée.</p>
            )}
          </div>
        )}
      </div>

      {notice && <p className="text-xs" style={{ color: KZ.violet }}>{notice}</p>}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border border-[var(--kz-edge)] rounded-md" style={{ background: s.status === 'pending' ? KZ.yellowSoft : KZ.violetSoft }}>
              {s.name}
              {s.status === 'pending' && <span className="text-[10px] opacity-70">(en attente)</span>}
              <button type="button" onClick={() => onRemove(s.id)} className="text-[var(--kz-mute)] hover:text-red-600"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
