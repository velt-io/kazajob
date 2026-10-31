'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Download, TrendingUp, Users, Briefcase, FileText, MapPin, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'
import { ACCENT, CountUp, PageHeader, SkeletonList, Sparkline, Widget, accentStyle } from '@/components/os/recruiter/primitives'

interface WeekBucket { label: string; users: number; jobs: number; apps: number }
interface TopCity    { city: string; count: number }
interface TopSector  { sector: string; count: number }

function Bar({ value, max, color, i = 0 }: { value: number; max: number; color: string; i?: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2.5">
      <div className="osr-bar flex-1 !h-2" style={{ '--i': i } as CSSProperties}>
        <span style={{ width: `${Math.max(pct, 3)}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, transparent), ${color})` }} />
      </div>
      <span className="text-[12px] font-semibold text-white w-7 text-right tabular-nums">{value}</span>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [weeks, setWeeks]       = useState<WeekBucket[]>([])
  const [topCities, setTopCities] = useState<TopCity[]>([])
  const [topSectors, setTopSectors] = useState<TopSector[]>([])
  const [totals, setTotals]     = useState({ users: 0, jobs: 0, apps: 0, companies: 0 })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      let profiles: { created_at: string }[] = []
      let jobs: { created_at: string; location: string; sector: string | null }[] = []
      let apps: { created_at: string }[] = []
      try {
        const res = await fetch('/api/admin/analytics')
        if (res.ok) {
          const d = await res.json()
          profiles = d.profiles ?? []
          jobs = d.jobs ?? []
          apps = d.apps ?? []
          setTotals({
            users: d.totals?.users ?? 0, jobs: d.totals?.jobs ?? 0,
            apps: d.totals?.apps ?? 0, companies: d.totals?.companies ?? 0,
          })
        }
      } catch { /* noop */ }

      // Construire les buckets hebdomadaires (8 dernières semaines)
      const buckets: WeekBucket[] = []
      for (let i = 7; i >= 0; i--) {
        const start = new Date(); start.setDate(start.getDate() - i * 7 - 6); start.setHours(0,0,0,0)
        const end   = new Date(); end.setDate(end.getDate() - i * 7 + 1);   end.setHours(0,0,0,0)
        const label = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        const inRange = (d: string) => { const t = new Date(d); return t >= start && t < end }
        buckets.push({
          label,
          users: (profiles ?? []).filter(p => inRange(p.created_at)).length,
          jobs:  (jobs ?? []).filter(j => inRange(j.created_at)).length,
          apps:  (apps ?? []).filter(a => inRange(a.created_at)).length,
        })
      }
      setWeeks(buckets)

      // Top villes
      const cityMap = new Map<string, number>()
      ;(jobs ?? []).forEach((j: { location: string }) => {
        const c = (j.location ?? '').split(',')[0].trim()
        if (c) cityMap.set(c, (cityMap.get(c) ?? 0) + 1)
      })
      setTopCities([...cityMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([city,count])=>({city,count})))

      // Top secteurs
      const secMap = new Map<string, number>()
      ;(jobs ?? []).forEach((j: { sector: string | null }) => {
        const s = j.sector ?? 'Autre'
        secMap.set(s, (secMap.get(s) ?? 0) + 1)
      })
      setTopSectors([...secMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([sector,count])=>({sector,count})))

      setLoading(false)
    }
    load()
  }, [])

  const exportCSV = () => {
    const rows = [
      ['Semaine', 'Nouveaux utilisateurs', 'Nouvelles offres', 'Candidatures'],
      ...weeks.map(w => [w.label, w.users, w.jobs, w.apps]),
      [],
      ['Total utilisateurs', totals.users],
      ['Total offres', totals.jobs],
      ['Total candidatures', totals.apps],
      ['Total entreprises', totals.companies],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `kazajob-analytics-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const maxUsers  = Math.max(...weeks.map(w => w.users), 1)
  const maxJobs   = Math.max(...weeks.map(w => w.jobs), 1)
  const maxApps   = Math.max(...weeks.map(w => w.apps), 1)
  const maxCities = Math.max(...topCities.map(c => c.count), 1)
  const maxSec    = Math.max(...topSectors.map(s => s.count), 1)

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader
        eyebrow="Rapports"
        title="Analytics"
        subtitle="Données des 8 dernières semaines"
        actions={
          <Button kind="outline" size="md" icon={<Download size={15} />} onClick={exportCSV}>
            Exporter CSV
          </Button>
        }
      />

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Utilisateurs', value: totals.users, icon: <Users size={15} />, accent: ACCENT.violet },
          { label: 'Offres',        value: totals.jobs,  icon: <Briefcase size={15} />, accent: ACCENT.orange },
          { label: 'Candidatures',  value: totals.apps,  icon: <FileText size={15} />, accent: ACCENT.green },
          { label: 'Entreprises',   value: totals.companies, icon: <TrendingUp size={15} />, accent: ACCENT.blue },
        ].map((k, i) => (
          <div key={k.label} className="osr-in osr-glow rounded-[24px] os-glass p-5 min-w-0" style={{ ...accentStyle(k.accent), '--i': i } as CSSProperties}>
            <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white" style={{ background: k.accent }}>{k.icon}</span>
            <div className="text-[30px] font-semibold tracking-[-0.05em] text-white mt-3 leading-none"><CountUp value={k.value} /></div>
            <div className="text-[13px] text-[var(--kz-mute)] mt-1.5">{k.label} <span className="opacity-70">· total</span></div>
          </div>
        ))}
      </div>

      {loading ? (
        <SkeletonList rows={3} height={180} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
          {/* Graphiques semaine par semaine */}
          <div className="flex flex-col gap-4 min-w-0">
            {[
              { label: 'Nouveaux utilisateurs', key: 'users', color: KZ.violet, max: maxUsers },
              { label: 'Nouvelles offres',      key: 'jobs',  color: KZ.orange, max: maxJobs },
              { label: 'Candidatures',          key: 'apps',  color: KZ.green,  max: maxApps },
            ].map(({ label, key, color, max }) => {
              const series = weeks.map((w) => (w as unknown as Record<string, number>)[key] ?? 0)
              const total = series.reduce((s, v) => s + v, 0)
              return (
                <Widget key={key} title={label} sub="par semaine" accent={color}
                  action={<span className="text-[22px] font-semibold tracking-[-0.04em] text-white tabular-nums shrink-0">{total.toLocaleString('fr-FR')}</span>}>
                  <Sparkline data={series} color={color} height={48} className="mb-4" label={`${label} sur 8 semaines`} />
                  <div className="flex flex-col gap-1.5">
                    {weeks.map((w, i) => (
                      <div key={w.label} className="grid grid-cols-[60px_1fr] gap-2.5 items-center">
                        <span className="text-[11px] text-[var(--kz-mute)] text-right tabular-nums">{w.label}</span>
                        <Bar value={(w as unknown as Record<string, number>)[key] ?? 0} max={max} color={color} i={i} />
                      </div>
                    ))}
                  </div>
                </Widget>
              )
            })}
          </div>

          {/* Top villes + secteurs */}
          <div className="flex flex-col gap-4 min-w-0">
            <Widget title="Top villes" sub="offres publiées" icon={<MapPin size={14} />} accent={ACCENT.blue}>
              <div className="flex flex-col gap-2.5">
                {topCities.length === 0 ? (
                  <p className="text-[13px] text-[var(--kz-mute)]">Pas de données.</p>
                ) : topCities.map(({ city, count }, i) => (
                  <div key={city} className="grid grid-cols-[90px_1fr] gap-2.5 items-center">
                    <span className="text-[12px] text-[var(--kz-text)] truncate">{city}</span>
                    <Bar value={count} max={maxCities} color={KZ.blue} i={i} />
                  </div>
                ))}
              </div>
            </Widget>

            <Widget title="Top secteurs" sub="offres publiées" icon={<Layers size={14} />} accent={ACCENT.green}>
              <div className="flex flex-col gap-2.5">
                {topSectors.length === 0 ? (
                  <p className="text-[13px] text-[var(--kz-mute)]">Pas de données.</p>
                ) : topSectors.map(({ sector, count }, i) => (
                  <div key={sector} className="grid grid-cols-[110px_1fr] gap-2.5 items-center">
                    <span className="text-[12px] text-[var(--kz-text)] truncate">{sector}</span>
                    <Bar value={count} max={maxSec} color={KZ.green} i={i} />
                  </div>
                ))}
              </div>
            </Widget>
          </div>
        </div>
      )}
    </div>
  )
}
