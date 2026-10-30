'use client'

import { memo, useMemo, useState } from 'react'
import { Shuffle, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'
import {
  generateAvatarSvg, randomAvatarConfig, sanitizeAvatarConfig, DEFAULT_AVATAR_CONFIG,
  SKIN_COLORS, HAIR_STYLES, HAIR_COLORS, EYES_STYLES, EYEBROW_STYLES,
  MOUTH_STYLES, CLOTHES_STYLES, CLOTHES_COLORS, ACCESSORIES, FACIAL_HAIR,
  type AvatarConfig,
} from '@/lib/avatar'

type Option = { id: string; label: string }
type Section = { label: string; key: keyof AvatarConfig; type: 'color' | 'thumb'; options: Option[] }

const TABS: { id: string; label: string; sections: Section[] }[] = [
  {
    id: 'cheveux', label: 'Cheveux',
    sections: [
      { label: 'Coiffure',            key: 'top',        type: 'thumb', options: HAIR_STYLES },
      { label: 'Couleur des cheveux', key: 'hairColor',  type: 'color', options: HAIR_COLORS },
      { label: 'Barbe & moustache',   key: 'facialHair', type: 'thumb', options: FACIAL_HAIR },
    ],
  },
  {
    id: 'visage', label: 'Visage',
    sections: [
      { label: 'Couleur de peau', key: 'skinColor', type: 'color', options: SKIN_COLORS },
      { label: 'Yeux',            key: 'eyes',      type: 'thumb', options: EYES_STYLES },
      { label: 'Sourcils',        key: 'eyebrow',   type: 'thumb', options: EYEBROW_STYLES },
      { label: 'Bouche',          key: 'mouth',     type: 'thumb', options: MOUTH_STYLES },
    ],
  },
  {
    id: 'tenue', label: 'Tenue',
    sections: [
      { label: 'Tenue',            key: 'clothes',      type: 'thumb', options: CLOTHES_STYLES },
      { label: 'Couleur de tenue', key: 'clothesColor', type: 'color', options: CLOTHES_COLORS },
    ],
  },
  {
    id: 'accessoires', label: 'Lunettes',
    sections: [
      { label: 'Lunettes', key: 'accessories', type: 'thumb', options: ACCESSORIES },
    ],
  },
]

function Svg({ svg, className }: { svg: string; className?: string }) {
  return <div className={`[&>svg]:w-full [&>svg]:h-full ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: svg }} />
}

function ColorSwatch({ hex, label, selected, onClick }: { hex: string; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className="w-9 h-9 rounded-full border-[1.5px] border-[var(--kz-edge)] transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
      style={{
        background: '#' + hex,
        boxShadow: selected ? '0 0 0 2px white, 0 0 0 4px var(--kz-orange)' : 'none',
      }}
    >
      {selected && <Check size={14} color={['ffffff', 'ffffb1', 'e8e1e1', 'fae3d0', 'ffdeb5', 'a7ffc4'].includes(hex) ? 'var(--kz-ink)' : '#fff'} strokeWidth={3} />}
    </button>
  )
}

// Vignette = l'avatar ACTUEL avec cette option appliquée : on voit le résultat avant de cliquer.
const ThumbOption = memo(function ThumbOption({
  config, field, option, selected, onSelect,
}: {
  config: AvatarConfig; field: keyof AvatarConfig; option: Option; selected: boolean; onSelect: (key: keyof AvatarConfig, id: string) => void
}) {
  const svg = useMemo(() => generateAvatarSvg({ ...config, [field]: option.id }), [config, field, option.id])
  return (
    <button
      type="button"
      onClick={() => onSelect(field, option.id)}
      aria-pressed={selected}
      aria-label={option.label}
      className="group flex flex-col items-center gap-1 p-1.5 rounded-xl border-[1.5px] transition-all hover:-translate-y-0.5 active:translate-y-0"
      style={{
        borderColor: selected ? 'var(--kz-ink)' : 'var(--kz-line)',
        background: selected ? KZ.orangeSoft : KZ.paper,
        boxShadow: selected ? '2px 2px 0 var(--kz-shadow)' : 'none',
      }}
    >
      <span aria-hidden className="w-14 h-14 rounded-full overflow-hidden" style={{ background: KZ.cream2 }}>
        <Svg svg={svg} className="w-full h-full" />
      </span>
      <span className="text-[10px] font-bold text-[var(--kz-ink)] leading-tight text-center line-clamp-1 max-w-[64px]">
        {option.label}
      </span>
    </button>
  )
})

interface AvatarBuilderProps {
  initialConfig?: AvatarConfig | Record<string, unknown> | null
  /** Mode contrôlé : le parent détient le config (ex. onboarding avec presets métier). */
  value?: AvatarConfig
  onChange?: (config: AvatarConfig) => void
  onSave: (config: AvatarConfig) => void | Promise<void>
  onCancel?: () => void
  saving?: boolean
  compact?: boolean   // libellé du bouton pour l'onboarding
}

export function AvatarBuilder({ initialConfig, value, onChange, onSave, onCancel, saving, compact }: AvatarBuilderProps) {
  const [inner, setInner] = useState<AvatarConfig>(() =>
    initialConfig ? sanitizeAvatarConfig(initialConfig) : DEFAULT_AVATAR_CONFIG,
  )
  const config = value ?? inner
  const [tab, setTab] = useState(TABS[0].id)

  const update = (next: AvatarConfig) => {
    if (!value) setInner(next)
    onChange?.(next)
  }
  const select = (key: keyof AvatarConfig, id: string) => update({ ...config, [key]: id })

  const previewSvg = useMemo(() => generateAvatarSvg(config), [config])
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0]

  return (
    <div className="w-full grid gap-6 md:grid-cols-[180px_1fr] md:items-start">
      {/* Prévisualisation */}
      <div className="flex flex-col items-center gap-3 md:sticky md:top-4">
        <div
          role="img"
          aria-label="Aperçu de ton avatar"
          className="rounded-full border-[3px] border-[var(--kz-edge)] overflow-hidden"
          style={{ width: 150, height: 150, background: KZ.cream2, boxShadow: '5px 5px 0 var(--kz-shadow)' }}
        >
          <Svg svg={previewSvg} className="w-full h-full" />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update(randomAvatarConfig())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[1.5px] border-[var(--kz-edge)] text-xs font-bold transition-shadow hover:shadow-[2px_2px_0_var(--kz-shadow)]"
            style={{ background: KZ.yellowSoft, color: 'var(--kz-ink)' }}
          >
            <Shuffle size={13} /> Aléatoire
          </button>
          <button
            type="button"
            onClick={() => update(DEFAULT_AVATAR_CONFIG)}
            aria-label="Réinitialiser"
            title="Réinitialiser"
            className="flex items-center px-2.5 py-1.5 rounded-full border-[1.5px] border-[var(--kz-edge)] transition-shadow hover:shadow-[2px_2px_0_var(--kz-shadow)]"
            style={{ background: KZ.paper, color: 'var(--kz-ink)' }}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <div className="min-w-0">
        {/* Onglets */}
        <div role="tablist" className="flex gap-1 p-1 rounded-full border-[1.5px] border-[var(--kz-edge)] mb-4 overflow-x-auto" style={{ background: KZ.cream2 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === tab}
              onClick={() => setTab(t.id)}
              className="flex-1 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
              style={t.id === tab
                ? { background: KZ.ink, color: KZ.cream }
                : { color: 'var(--kz-mute)' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          {activeTab.sections.map((section) => (
            <div key={section.key}>
              <p className="text-[11px] font-extrabold text-[var(--kz-ink)] uppercase tracking-widest mb-2">
                {section.label}
              </p>
              {section.type === 'color' ? (
                <div className="flex gap-2.5 flex-wrap">
                  {section.options.map((opt) => (
                    <ColorSwatch
                      key={opt.id}
                      hex={opt.id}
                      label={opt.label}
                      selected={config[section.key] === opt.id}
                      onClick={() => select(section.key, opt.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2">
                  {section.options.map((opt) => (
                    <ThumbOption
                      key={opt.id}
                      config={config}
                      field={section.key}
                      option={opt}
                      selected={config[section.key] === opt.id}
                      onSelect={select}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          {onCancel && (
            <Button kind="outline" size="lg" onClick={onCancel} disabled={saving}>
              Annuler
            </Button>
          )}
          <Button
            kind="primary"
            size="lg"
            full
            icon={<Check size={16} />}
            loading={saving}
            onClick={() => onSave(config)}
          >
            {compact ? 'Valider mon avatar' : 'Sauvegarder mon avatar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
