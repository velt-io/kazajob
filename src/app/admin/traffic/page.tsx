'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { Eye, BarChart2, CalendarDays, FileText } from 'lucide-react'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { ACCENT, CountUp, EmptyPanel, PageHeader, Segmented, Widget, accentStyle } from '@/components/os/recruiter/primitives'

interface Traffic {
  days: number
  total: number
  top: { path: string; views: number }[]
  daily: { day: string; views: number }[]
}

const PERIODS = [7, 30, 90]

export default function AdminTrafficPage() {
  const [data, setData] = useState<Traffic | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/traffic?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d as Traffic))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [days])

  const maxDay = Math.max(1, ...(data?.daily.map((d) => d.views) ?? [1]))
  const maxTop = Math.max(1, ...(data?.top.map((t) => t.views) ?? [1]))

  return (
    <div className="max-w-[1100px] mx-auto">
      <PageHeader
        eyebrow="Analytics"
        title="Trafic du site"
        subtitle="Pages vues anonymes (sans cookie). Pour le détail (sources, pays, visiteurs uniques) : dashboard Vercel."
        actions={
          <Segmented
            ariaLabel="Période"
            value={String(days)}
            onChange={(v) => setDays(Number(v))}
            items={PERIODS.map((p) => ({ id: String(p), label: `${p} j` }))}
          />
        }
      />

      {loading ? <PageLoader /> : !data || data.total === 0 ? (
        <div className="osr-panel">
          <EmptyPanel
            title="Pas encore de données de trafic"
            description="Les vues de pages s'enregistrent dès que des visiteurs naviguent sur le site (hors espace admin)."
            icon={<BarChart2 size={26} />}
            accent={ACCENT.violet}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {[
              { label: `Vues (${data.days} j)`, value: data.total, icon: <Eye size={15} />, accent: ACCENT.violet },
              { label: 'Pages distinctes', value: data.top.length, icon: <FileText size={15} />, accent: ACCENT.orange },
              { label: 'Moy. / jour', value: Math.round(data.total / data.days), icon: <CalendarDays size={15} />, accent: ACCENT.green },
            ].map((k, i) => (
              <div key={k.label} className={`osr-in osr-glow rounded-[24px] os-glass p-5 min-w-0 ${i === 2 ? 'col-span-2 lg:col-span-1' : ''}`}
                style={{ ...accentStyle(k.accent), '--i': i } as CSSProperties}>
                <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white" style={{ background: k.accent }}>{k.icon}</span>
                <div className="text-[32px] font-semibold tracking-[-0.05em] text-white mt-3 leading-none"><CountUp value={k.value} /></div>
                <div className="text-[13px] text-[var(--kz-mute)] mt-1.5">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Vues par jour */}
          <Widget title="Vues par jour" sub={`${data.daily[0]?.day ?? ''} → ${data.daily[data.daily.length - 1]?.day ?? ''}`} icon={<BarChart2 size={14} />} accent={ACCENT.violet} className="mb-4">
            <div className="flex items-end gap-[3px] h-44 overflow-x-auto pt-2" role="img" aria-label={`Vues par jour sur ${data.days} jours`}>
              {data.daily.map((d, i) => (
                <div key={d.day} className="group relative flex-1 min-w-[6px] h-full flex items-end" title={`${d.day} — ${d.views} vues`}>
                  <div className="osr-in w-full rounded-t-[5px] rounded-b-[2px] transition-[filter] group-hover:brightness-150"
                    style={{
                      height: `${Math.max(3, (d.views / maxDay) * 100)}%`,
                      background: 'linear-gradient(180deg, var(--kz-violet), color-mix(in srgb, var(--kz-violet) 25%, transparent))',
                      '--i': Math.min(i, 12),
                    } as CSSProperties} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-[var(--kz-mute)] mt-2 tabular-nums">
              <span>{data.daily[0]?.day}</span>
              <span>{data.daily[data.daily.length - 1]?.day}</span>
            </div>
          </Widget>

          {/* Pages les plus consultées */}
          <Widget title="Pages les plus consultées" icon={<FileText size={14} />} accent={ACCENT.blue}>
            <div className="flex flex-col gap-3">
              {data.top.map((t, i) => (
                <div key={t.path} className="flex items-center gap-3 min-w-0">
                  <code className="text-[12px] text-[var(--kz-text)] w-32 sm:w-64 shrink-0 truncate">{t.path}</code>
                  <div className="osr-bar flex-1" style={{ '--i': i } as CSSProperties}>
                    <span style={{ width: `${(t.views / maxTop) * 100}%`, background: 'linear-gradient(90deg, var(--kz-blue), var(--kz-violet))' }} />
                  </div>
                  <span className="text-[12px] font-semibold text-white w-12 text-right tabular-nums">{t.views.toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </Widget>
        </>
      )}
    </div>
  )
}
