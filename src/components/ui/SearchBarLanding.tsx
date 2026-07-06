'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import { Button } from './Button'
import { KZ, REUNION_CITIES } from '@/lib/constants'

export function SearchBarLanding() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (location) params.set('location', location)
    router.push(`/candidate/jobs${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-2 mb-4 rounded-xl border-[1.5px] border-[#1A1410]"
      style={{ background: KZ.paper, boxShadow: '5px 5px 0 #1A1410' }}
    >
      <div className="flex-1 flex items-center gap-2 px-3 py-2 sm:py-1">
        <Search size={18} className="text-[#6B5A4A] shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Métier, mot-clé, compétence..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#6B5A4A] text-[#1A1410]"
        />
      </div>
      <div className="hidden sm:block w-px h-7 bg-[#E8DDC9] self-center" />
      <div className="flex items-center gap-2 px-3 py-2 sm:py-1">
        <MapPin size={18} className="text-[#6B5A4A] shrink-0" />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none text-[#2A2018] cursor-pointer appearance-none"
          style={{ minWidth: 130 }}
        >
          <option value="">Toute la Réunion</option>
          {REUNION_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <Button type="submit" kind="primary" size="md" className="w-full sm:w-auto">
        Rechercher
      </Button>
    </form>
  )
}
